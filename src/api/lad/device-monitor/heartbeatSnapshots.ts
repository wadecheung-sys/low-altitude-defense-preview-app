/**
 * 设备运行监控「扩展信息」弹层心跳快照。
 *
 * 字段口径（仅展示协议载荷中有明确字段的项；上报周期/频率等说明性文字不单列）：
 * - 凡双《数据接入接口文档 v0.2.4》§2.1 设备状态推送（含强光/探照灯 type=11）
 * - 081《系统软件接口协议 V0.0.2》status 心跳
 * - 耐杰《光电指控协议 V2.9.2》0x01 / 0x02
 *
 * 变化策略：
 * - 安装经纬高、范围半径、张角等按设备固定，不随心跳刷新抖动
 * - 在线状态、反制天线朝向/俯仰、光电跟踪角度与距离等可随工作状态变化
 * - 无对应能力或未启用时，按接口约定填 0（不用空字符串冒充「无」）
 */
import type {
  DeviceOnlineStatus,
  DeviceRuntimeMetric,
  DeviceRuntimeMetricLevel
} from './types'

function metric(
  key: string,
  label: string,
  value: string | number,
  unit?: string,
  level: DeviceRuntimeMetricLevel = 'normal'
): DeviceRuntimeMetric {
  return { key, label, value, unit, level }
}

function padCoord(value: number, digits = 6): string {
  return value.toFixed(digits)
}

export interface HeartbeatBuildInput {
  deviceType: string
  deviceId: string
  deviceName: string
  deviceModel: string
  ipAddress: string
  serialNo: string
  seed: number
  /** 约 5 秒一跳的刷新计数 */
  tick: number
  onlineStatus: DeviceOnlineStatus
  /** 安装经度（设备信息扩展）；缺省则用种子稳定值 */
  longitude?: number
  latitude?: number
  /** 设备信息「管制范围」/ 选型作用距离（米），作性能参数 */
  controlRangeM?: number
}

export interface HeartbeatBuildResult {
  workStatus: string
  workMode?: string
  metrics: DeviceRuntimeMetric[]
}

const FANS_SHUANG_STATUS: Record<number, string> = {
  0: '离线',
  1: '在线',
  2: '侦测中',
  3: '反制中'
}

const FANS_SHUANG_TYPE_CODE: Record<string, number> = {
  无线电侦测: 2,
  无线电干扰: 8,
  导航诱骗: 4,
  'Remote-ID 监视': 20,
  'ADS-B 监视': 13,
  强光驱离: 11,
  察打一体: 14
}

/** 第 5 章选型性能：侦测范围半径（米）。无侦测能力为 0。 */
const DETECT_RANGE_BY_TYPE: Record<string, number> = {
  无线电侦测: 5000,
  'Remote-ID 监视': 5000,
  'ADS-B 监视': 25000,
  察打一体: 3000,
  无线电干扰: 0,
  导航诱骗: 0,
  强光驱离: 0
}

/** 定向反制波束/覆盖张角（度）。无定向反制天线能力为 0（强光等协议字段仍上报 0）。 */
const ANTENNA_SCOPE_BY_TYPE: Record<string, number> = {
  无线电干扰: 60,
  察打一体: 60,
  强光驱离: 0,
  导航诱骗: 0,
  无线电侦测: 0,
  'Remote-ID 监视': 0,
  'ADS-B 监视': 0
}

function fanshuangTypeLabel(code: number): string {
  const map: Record<number, string> = {
    2: '频谱侦测',
    3: '全向压制',
    4: '导航诱骗',
    8: '定向压制',
    11: '探照灯',
    13: 'ADS-B 接收机',
    14: '侦打一体设备',
    20: '无人机远程识别'
  }
  return map[code] || `类型 ${code}`
}

function hasDetectAbility(deviceType: string): boolean {
  return (DETECT_RANGE_BY_TYPE[deviceType] ?? 0) > 0
}

/** 具备反制功能（影响在线状态码：反制中 / 待机） */
function hasCounterAbility(deviceType: string): boolean {
  return ['无线电干扰', '导航诱骗', '强光驱离', '察打一体'].includes(deviceType)
}

/** 具备定向反制天线角度回传；强光（探照灯）协议同构但无有效方位/俯仰 */
function hasDirectionalCounterAntenna(deviceType: string): boolean {
  return deviceType === '无线电干扰' || deviceType === '察打一体'
}

/** 慢节奏状态机：约 60s 才可能切换，避免心跳刷新时性能/状态乱跳 */
function slowPhase(seed: number, tick: number, period = 12): number {
  return Math.floor(tick / period) + Math.floor(seed / 17)
}

function offlineMetrics(lastHint = '超过心跳间隔未收到上报'): HeartbeatBuildResult {
  return {
    workStatus: '离线',
    metrics: [
      metric('online_status', '在线状态', '离线', undefined, 'fault'),
      metric('heartbeat', '心跳判定', lastHint, undefined, 'warning'),
      metric('telemetry', '遥测数据', '暂无', undefined, 'unknown')
    ]
  }
}

function resolveInstallCoord(
  provided: number | undefined,
  seed: number,
  base: number,
  span: number
): number {
  if (typeof provided === 'number' && Number.isFinite(provided) && provided !== 0) {
    return provided
  }
  return base + ((seed % span) - span / 2) * 0.00001
}

function resolveCounterRangeM(input: HeartbeatBuildInput): number {
  if (!hasCounterAbility(input.deviceType)) return 0
  if (input.controlRangeM && input.controlRangeM > 0) return Math.round(input.controlRangeM)
  const fallback: Record<string, number> = {
    无线电干扰: 3000,
    导航诱骗: 1000,
    强光驱离: 3000,
    察打一体: 3000
  }
  return fallback[input.deviceType] ?? 0
}

function resolveDetectRangeM(deviceType: string): number {
  return DETECT_RANGE_BY_TYPE[deviceType] ?? 0
}

function resolveFirmware(deviceType: string, seed: number): string {
  if (deviceType === 'ADS-B 监视') return 'V1.3'
  if (deviceType === 'Remote-ID 监视') return 'V2.1'
  return `V1.${1 + (seed % 3)}`
}

/** 凡双 §2.1 设备状态推送（设备心跳）；离线时仍按同构字段上报，便于监控页统一展示 */
export function buildFanshuangHeartbeat(input: HeartbeatBuildInput): HeartbeatBuildResult {
  const {
    onlineStatus,
    seed,
    tick,
    deviceType,
    deviceId,
    deviceName,
    deviceModel,
    ipAddress,
    serialNo
  } = input

  const typeCode = FANS_SHUANG_TYPE_CODE[deviceType] ?? 2
  const detectAbility = hasDetectAbility(deviceType)
  const counterAbility = hasCounterAbility(deviceType)
  const directionalAntenna = hasDirectionalCounterAntenna(deviceType)
  const phase = slowPhase(seed, tick)
  const offline = onlineStatus === '离线'

  let statusCode = 1
  if (offline) {
    statusCode = 0
  } else if (onlineStatus === '异常') {
    statusCode = 1
  } else if (deviceType === '察打一体') {
    // 需求：当前阶段侧重数据解析；演示上多数时间侦测，偶发反制
    statusCode = phase % 5 === 0 ? 3 : 2
  } else if (counterAbility && !detectAbility) {
    statusCode = phase % 4 === 0 ? 1 : 3
  } else if (detectAbility && !counterAbility) {
    statusCode = phase % 5 === 0 ? 1 : 2
  }

  const statusText = FANS_SHUANG_STATUS[statusCode]
  const statusLevel: DeviceRuntimeMetricLevel =
    statusCode === 0 ? 'fault' : statusCode >= 2 ? 'running' : 'normal'
  const counterActive = !offline && statusCode === 3

  // —— 性能参数：固定 ——
  const counterRangeM = offline ? 0 : resolveCounterRangeM(input)
  const detectRangeM = offline ? 0 : resolveDetectRangeM(deviceType)
  const antennaScope = offline ? 0 : (ANTENNA_SCOPE_BY_TYPE[deviceType] ?? 0)
  const altitudeM = 60 + (seed % 80)
  const lng = resolveInstallCoord(input.longitude, seed, 120.414078, 17)
  const lat = resolveInstallCoord(input.latitude, seed + 3, 30.228708, 13)
  const firmware = resolveFirmware(deviceType, seed)

  // —— 运行态：仅定向反制天线在反制中可变；强光等同构字段填 0 ——
  let azimuth = 0
  let elevation = 0
  if (directionalAntenna && counterActive) {
    azimuth = Number(((seed * 7 + tick * 1.8) % 360).toFixed(1))
    elevation = Number((((seed % 35) - 5) + Math.sin(tick / 6) * 2).toFixed(1))
  }

  const batteryCapable = typeCode === 11 || typeCode === 5 || typeCode === 15
  const battery = offline
    ? batteryCapable
      ? 0
      : -1
    : batteryCapable
      ? 55 + ((seed + Math.floor(tick / 120)) % 40)
      : -1

  const workMode = offline
    ? '离线'
    : statusCode === 3
      ? '反制中'
      : statusCode === 2
        ? '侦测中'
        : onlineStatus === '异常'
          ? '链路异常'
          : '在线待机'

  const metrics: DeviceRuntimeMetric[] = [
    metric('sn', '设备唯一编码', serialNo || `FS-${deviceId}`),
    metric('name', '设备名称', deviceName),
    metric('ip', '设备 IP 地址', ipAddress || '—'),
    metric('version', '固件版本', firmware),
    metric('type', '设备类型', fanshuangTypeLabel(typeCode)),
    metric('model', '设备型号', deviceModel || '—'),
    metric('status', '在线状态', statusText, undefined, statusLevel),
    metric('lng', '经度', padCoord(lng)),
    metric('lat', '纬度', padCoord(lat)),
    metric('altitude', '海拔高度', altitudeM.toFixed(2), '米'),
    metric('azimuth', '反制天线中心朝向', azimuth, '°', counterActive ? 'running' : 'normal'),
    metric('elevation_angle', '反制天线俯仰角', elevation, '°', counterActive ? 'running' : 'normal'),
    metric('antenna_scope', '反制天线覆盖范围张角', antennaScope, '°'),
    metric('suppr_distance', '反制有效距离', counterRangeM, '米'),
    metric('spect_distance', '侦测范围半径', detectRangeM, '米'),
    metric(
      'battery',
      '电池电量',
      battery < 0 ? -1 : battery,
      battery < 0 ? undefined : '%',
      battery >= 0 && battery < 20 ? 'warning' : 'normal'
    ),
    metric(
      'timestamp',
      '上报时间',
      offline ? '超过心跳间隔未收到上报' : formatHeartbeatTime()
    )
  ]

  return { workStatus: statusText, workMode, metrics }
}

const H081_DEVICE_TYPE: Record<string, { code: number; label: string }> = {
  雷达: { code: 1, label: '雷达' },
  高功率微波: { code: 4, label: '微波武器' }
}

const H081_VOL: Record<number, string> = {
  0: '异常',
  1: '准备好',
  2: '正常'
}

/** 081 设备状态心跳（status，约 1Hz）；离线时仍按同构字段展示 */
export function buildH081Heartbeat(input: HeartbeatBuildInput): HeartbeatBuildResult {
  const { onlineStatus, seed, tick, deviceType, deviceId, deviceName } = input
  const offline = onlineStatus === '离线'
  const phase = slowPhase(seed, tick, 18)
  const typeMeta = H081_DEVICE_TYPE[deviceType] || { code: 1, label: deviceType }
  // 控制命令枚举：0 取消跟踪 / 1 跟踪；status 载荷未另给枚举，演示按此口径
  const workModeCode = offline ? 0 : phase % 2
  const workModeText = workModeCode === 1 ? '跟踪' : '未跟踪'
  const deviceStatusCode = offline ? 1 : onlineStatus === '异常' ? 1 : 0
  const deviceStatusText = offline ? '离线' : deviceStatusCode === 0 ? '正常' : '异常'
  const deviceStatusLevel: DeviceRuntimeMetricLevel =
    offline || deviceStatusCode !== 0 ? 'fault' : 'normal'

  const metrics: DeviceRuntimeMetric[] = [
    metric('name', '设备名称', deviceName),
    metric('id', '设备标识', deviceId),
    metric('type', '设备类型', `${typeMeta.label}（${typeMeta.code}）`),
    metric(
      'work_mode',
      '工作模式',
      workModeText,
      undefined,
      workModeCode === 1 ? 'running' : 'normal'
    ),
    metric('status', '设备状态', deviceStatusText, undefined, deviceStatusLevel)
  ]

  if (typeMeta.code === 1) {
    const transmitting = !offline && phase % 4 !== 0
    metrics.push(
      metric(
        'transmitter',
        '发射状态',
        transmitting ? '开' : '关',
        undefined,
        transmitting ? 'running' : 'normal'
      )
    )
  }

  if (typeMeta.code === 4) {
    // status：low_vol / high_vol；演示按慢相位推进，异常/离线时回落
    let lowVol = 2
    let highVol = 2
    if (offline || onlineStatus === '异常') {
      lowVol = 0
      highVol = 0
    } else if (workModeCode === 0) {
      lowVol = 1
      highVol = 1
    } else {
      lowVol = 2
      highVol = 2
    }
    // status 表：transmitter（微波：触发状态）、low_vol、high_vol
    metrics.push(
      metric(
        'transmitter',
        '触发状态',
        !offline && workModeCode === 1 ? '开' : '关',
        undefined,
        !offline && workModeCode === 1 ? 'running' : 'normal'
      ),
      metric(
        'low_vol',
        '低压状态',
        H081_VOL[lowVol],
        undefined,
        lowVol === 0 ? 'fault' : lowVol === 1 ? 'warning' : 'normal'
      ),
      metric(
        'high_vol',
        '高压状态',
        H081_VOL[highVol],
        undefined,
        highVol === 0 ? 'fault' : highVol === 1 ? 'warning' : 'running'
      )
    )
  }

  metrics.push(
    metric(
      'timestamp',
      '上报时间',
      offline ? '超过 status 心跳间隔未收到上报' : formatHeartbeatTime()
    )
  )

  return {
    workStatus: deviceStatusText,
    workMode: workModeText,
    metrics
  }
}

const EO_WORK_MODE: Record<number, string> = {
  0: '空闲',
  1: '搜索',
  2: '跟踪'
}

/** 耐杰光电：0x01 状态 + 0x02 方位俯仰；空闲/离线时距离与目标高度按 0；离线仍同构展示 */
export function buildNajieEoHeartbeat(input: HeartbeatBuildInput): HeartbeatBuildResult {
  const { onlineStatus, seed, tick, deviceId } = input
  const offline = onlineStatus === '离线'
  const phase = slowPhase(seed, tick, 10)
  const workOk = !offline && onlineStatus !== '异常'
  const modeCode = workOk ? (phase % 6 === 0 ? 0 : phase % 6 <= 2 ? 1 : 2) : 0
  const modeText = EO_WORK_MODE[modeCode]
  const channel = seed % 2 === 0 ? '可见光' : '热成像'

  // 云台角度：搜索/跟踪可变；空闲/离线保持安装基准角
  const baseAz = (seed % 3600) / 10
  const baseEl = 5 + (seed % 20)
  let azimuth = baseAz
  let elevation = baseEl
  if (modeCode === 1) {
    azimuth = (baseAz + tick * 0.35) % 360
    elevation = baseEl + Math.sin(tick / 8) * 1.5
  } else if (modeCode === 2) {
    azimuth = (baseAz + Math.sin(tick / 5) * 3 + tick * 0.05) % 360
    elevation = baseEl + Math.cos(tick / 7) * 1.2
  }

  const tracking = modeCode === 2
  const distance = tracking ? 520 + (seed % 100) + Math.round(Math.sin(tick / 9) * 15) : 0
  const targetHeight = tracking ? 60 + (seed % 40) : 0
  const zoom = modeCode === 0 ? 1 : 4 + (seed % 8)
  const eoId = Number.parseInt(deviceId.replace(/\D/g, '').slice(-4) || String(seed), 10) || seed

  const metrics: DeviceRuntimeMetric[] = [
    metric('eo_id', '光电编号', eoId),
    metric(
      'work_status',
      '工作状态',
      offline ? '离线' : workOk ? '正常' : '异常',
      undefined,
      workOk ? 'normal' : 'fault'
    ),
    metric('work_mode', '工作模式', modeText, undefined, modeCode === 2 ? 'running' : 'normal'),
    metric('track_source', '跟踪视频源', channel),
    metric('azimuth', '水平角度', azimuth.toFixed(2), '°'),
    metric('elevation', '俯仰角度', elevation.toFixed(2), '°'),
    metric('distance', '距离', distance, '米'),
    metric('target_height', '目标高度', targetHeight, '米'),
    metric('lens_zoom', '镜头倍率', zoom),
    metric(
      'timestamp',
      '状态时间戳',
      offline ? '超过状态上报周期未收到 0x01/0x02' : `${formatHeartbeatTime()}（UTC）`
    )
  ]

  return {
    workStatus: offline ? '离线' : workOk ? modeText : '异常',
    workMode: modeText,
    metrics
  }
}

function formatHeartbeatTime(): string {
  const date = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

export function buildHeartbeatByDeviceType(input: HeartbeatBuildInput): HeartbeatBuildResult {
  const type = input.deviceType
  if (
    type === '无线电侦测' ||
    type === '无线电干扰' ||
    type === '导航诱骗' ||
    type === 'Remote-ID 监视' ||
    type === 'ADS-B 监视' ||
    type === '强光驱离' ||
    type === '察打一体'
  ) {
    return buildFanshuangHeartbeat(input)
  }
  if (type === '雷达' || type === '高功率微波') {
    return buildH081Heartbeat(input)
  }
  if (type === '光电跟踪') {
    return buildNajieEoHeartbeat(input)
  }
  if (input.onlineStatus === '离线') return offlineMetrics()
  return {
    workStatus: input.onlineStatus === '异常' ? '异常' : '运行中',
    metrics: [
      metric(
        'connection',
        '连接状态',
        input.onlineStatus === '异常' ? '链路异常' : '在线',
        undefined,
        input.onlineStatus === '异常' ? 'warning' : 'normal'
      ),
      metric('heartbeat', '最近心跳', '刚刚'),
      metric('note', '说明', '当前类型未纳入凡双/081/耐杰光电心跳字段集')
    ]
  }
}
