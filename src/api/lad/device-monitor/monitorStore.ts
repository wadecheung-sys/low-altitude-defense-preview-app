import { queryDeviceArchiveDetail } from '../device/archiveStore'
import { queryDeviceInfoDetail, queryDeviceInfoList } from '../device-info/infoStore'
import type { DeviceInfoItem } from '../device-info/types'
import { LAD_MONITOR_EXCLUDED_DEVICE_TYPES } from '@/constants/deviceTypes'
import { buildRadarDemoRuntime } from '../radar/radarDemoRuntime'
import type {
  DeviceMonitorItem,
  DeviceMonitorListResult,
  DeviceMonitorQuery,
  DeviceOnlineStatus,
  DeviceRuntimeMetric,
  DeviceRuntimeSnapshot
} from './types'

/** 监控页不展示周边类设备 */
const MONITOR_EXCLUDED_TYPES = new Set(LAD_MONITOR_EXCLUDED_DEVICE_TYPES)

const VENDOR_BY_TYPE: Record<string, string> = {
  雷达: '未在接口协议中标注',
  无线电侦测: '凡双科技',
  'Remote-ID 监视': '凡双科技',
  'ADS-B 监视': '亿思德科技',
  无线电干扰: '凡双科技',
  导航诱骗: '凡双科技',
  激光打击: '锐光防务',
  高功率微波: '磐石电子',
  光电跟踪: '光电设备厂商（资料未标注）'
}

const MODEL_BY_TYPE: Record<string, string> = {
  雷达: 'RADAR-081',
  无线电侦测: 'PL671F',
  'Remote-ID 监视': 'RDS200',
  'ADS-B 监视': 'EXD55-LS',
  无线电干扰: 'FG310F',
  导航诱骗: 'DY506F',
  激光打击: 'TBD-LSR',
  高功率微波: 'TBD-HPM',
  光电跟踪: 'EO-V2.8'
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}

/** 演示数据：多数设备为「正常」，少量异常/离线便于筛选演示 */
function resolveRunStatus(row: DeviceInfoItem): DeviceOnlineStatus {
  const bucket = hashSeed(row.id) % 100
  if (bucket < 82) return '正常'
  if (bucket < 92) return '异常'
  return '离线'
}

function formatRuntime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}

function buildMetrics(seed: number, online: DeviceOnlineStatus) {
  const base = 80 + (seed % 400)
  const alert = online === '离线' ? 0 : (seed % 17) + (online === '异常' ? 8 : 2)
  const handle = Math.max(0, Math.floor(base * 0.6) - (seed % 20))
  return {
    detectCount: online === '离线' ? 0 : base + alert,
    alertCount: alert,
    handleCount: handle
  }
}

function cloneLinkedArchive(detail: ReturnType<typeof queryDeviceInfoDetail>) {
  if (!detail?.linkedArchive) return null
  const arch = detail.linkedArchive
  return {
    ...arch,
    specifications: arch.specifications.map((indicator) => ({ ...indicator })),
    configurableItems: arch.configurableItems.map((item) => ({ ...item }))
  }
}

function enrichMonitorRow(row: DeviceInfoItem): DeviceMonitorItem {
  const seed = hashSeed(row.id)
  const onlineStatus = resolveRunStatus(row)
  const infoDetail = queryDeviceInfoDetail(row.id)
  const linkedArchive = cloneLinkedArchive(infoDetail)
  const archive = row.archiveId ? queryDeviceArchiveDetail(row.archiveId) : null
  const runtimeSec = onlineStatus === '离线' ? seed % 120 : 3600 * (4 + (seed % 48)) + (seed % 3600)
  const metrics = buildMetrics(seed, onlineStatus)
  const deviceModel =
    linkedArchive?.deviceModel || archive?.deviceModel || MODEL_BY_TYPE[row.deviceType] || '—'

  return {
    id: row.id,
    deviceId: row.deviceId,
    deviceName: row.deviceName,
    deviceType: row.deviceType,
    deployLocation: row.deployLocation,
    ipAddress: row.ipAddress,
    serialNo: row.serialNo,
    onlineStatus,
    runtimeText: formatRuntime(runtimeSec),
    metrics,
    manufacturer: linkedArchive?.vendor || archive?.vendor || VENDOR_BY_TYPE[row.deviceType] || '—',
    deviceModel,
    personInCharge: row.personInCharge,
    lastHeartbeat: row.lastHeartbeat,
    hasAlert: metrics.alertCount >= 10 || onlineStatus === '异常',
    imageUrl: linkedArchive?.imageUrl ?? archive?.imageUrl ?? null,
    archiveInfo: row.archiveInfo,
    linkedArchive
  }
}

export function queryDeviceMonitorList(q: DeviceMonitorQuery): DeviceMonitorListResult {
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 6
  const { list } = queryDeviceInfoList({
    pageIndex: 1,
    pageSize: 9999,
    deviceName: q.deviceName,
    deviceType: q.deviceType,
    deployLocation: q.deployLocation
  })

  let rows = list.filter((row) => !MONITOR_EXCLUDED_TYPES.has(row.deviceType)).map(enrichMonitorRow)
  if (q.onlineStatus) {
    rows = rows.filter((r) => r.onlineStatus === q.onlineStatus)
  }

  const filteredTotal = rows.length
  const start = (pageIndex - 1) * pageSize
  return {
    list: rows.slice(start, start + pageSize),
    total: filteredTotal
  }
}

function formatNow(date = new Date()): string {
  const p = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

function runtimeMetric(
  key: string,
  label: string,
  value: string | number,
  unit?: string,
  level: DeviceRuntimeMetric['level'] = 'normal'
): DeviceRuntimeMetric {
  return { key, label, value, unit, level }
}

function buildRuntimeMetrics(
  model: string,
  seed: number,
  tick: number,
  onlineStatus: DeviceOnlineStatus
): {
  workStatus: string
  workMode?: string
  metrics: DeviceRuntimeMetric[]
  radar?: DeviceRuntimeSnapshot['radar']
} {
  if (onlineStatus === '离线') {
    return {
      workStatus: '离线',
      metrics: [
        runtimeMetric('connection', '连接状态', '已断开', undefined, 'fault'),
        runtimeMetric('heartbeat', '最后心跳', '超过 15 秒', undefined, 'warning'),
        runtimeMetric('telemetry', '遥测数据', '暂无实时数据', undefined, 'unknown')
      ]
    }
  }

  const offset = seed + tick
  const connectionLevel = onlineStatus === '异常' ? 'warning' : 'normal'
  const commonConnection = runtimeMetric(
    'connection',
    '连接状态',
    onlineStatus === '异常' ? '链路异常' : '在线',
    undefined,
    connectionLevel
  )

  switch (model) {
    case 'RADAR-081':
      return buildRadarDemoRuntime(seed, tick)
    case 'FG310F': {
      const active = offset % 4 !== 0
      const workStatus = active ? '压制中' : '待机'
      const azimuth = ((seed * 7 + tick * 2.35) % 360).toFixed(2)
      const elevation = (8 + ((seed + tick) % 180) / 10).toFixed(2)
      const bands = ['840-960', '1550-1650', '2400-2485', '5725-5850', '5145-5250', '400-450']
      const bandIndex = offset % bands.length
      return {
        workStatus,
        workMode: 'HTTP 双向交互',
        metrics: [
          commonConnection,
          runtimeMetric(
            'work_status',
            '工作状态',
            workStatus,
            undefined,
            active ? 'running' : 'normal'
          ),
          runtimeMetric('last_report', '最近上报', '0x2003 水平/垂直角度'),
          runtimeMetric('azimuth', '转台水平角', azimuth, '°'),
          runtimeMetric('elevation', '转台垂直角', elevation, '°'),
          runtimeMetric(
            'target',
            '锁定目标',
            active ? `TG-${String((seed % 90) + 10).padStart(4, '0')}` : '—'
          ),
          runtimeMetric('band_index', '频段索引', bandIndex),
          runtimeMetric('band', '当前压制频段', bands[bandIndex], 'MHz'),
          runtimeMetric(
            'emission',
            '频段开关状态',
            active ? '开启' : '关闭',
            undefined,
            active ? 'running' : 'normal'
          ),
          runtimeMetric('band_power', '频段功率', ((90 + (offset % 26)) / 10).toFixed(1), 'dBm'),
          runtimeMetric('band_temperature', '功放温度', 29 + (offset % 4), '℃')
        ]
      }
    }
    case 'DY506F': {
      const active = offset % 5 !== 0
      const workStatus = active ? '工作中 · 整点授时' : '准备就绪'
      const modes = ['驱离', '禁飞/降落', '导航防御']
      return {
        workStatus,
        workMode: modes[Math.floor(offset / 4) % modes.length],
        metrics: [
          commonConnection,
          runtimeMetric(
            'work_status',
            '工作状态',
            workStatus,
            undefined,
            active ? 'running' : 'normal'
          ),
          runtimeMetric('last_report', '最近上报', '0x1010 设备信息'),
          runtimeMetric('ocxo', '晶振状态', '锁定'),
          runtimeMetric('timing', '授时同步状态字', '00000000 · 正常'),
          runtimeMetric('time_accuracy', '时间精度', 18 + (offset % 4), 'ns'),
          runtimeMetric(
            'emission',
            '四系统发射开关',
            active ? 'GPS/BDS/GLO 开 · GAL 关' : '全部关闭',
            undefined,
            active ? 'running' : 'normal'
          ),
          runtimeMetric(
            'satellites',
            '转发卫星颗数',
            `GPS ${7 + (offset % 3)} / BDS ${6 + (offset % 3)} / GLO ${5 + (offset % 3)} / GAL ${4 + (offset % 2)}`
          ),
          runtimeMetric(
            'sim_position',
            '模拟位置',
            `${120.089 + (offset % 6) * 0.0001}, ${30.342 + (offset % 5) * 0.0001}`
          ),
          runtimeMetric('sim_height', '模拟高度', 36 + (offset % 5), 'm'),
          runtimeMetric('environment', '环境温度', (36.5 + (offset % 8) / 10).toFixed(1), '℃')
        ]
      }
    }
    case 'EO-V2.8': {
      const azimuth = ((126.4 + tick * 0.08) % 360).toFixed(2)
      const elevation = (8.2 + Math.sin(tick / 4) * 0.18).toFixed(2)
      const channel = offset % 6 < 4 ? '可见光' : '热成像'
      const targetId = `EO-${String((seed % 90) + 10).padStart(4, '0')}`
      return {
        workStatus: '跟踪中',
        workMode: `${channel}自动跟踪`,
        metrics: [
          commonConnection,
          runtimeMetric('work_status', '工作状态', '跟踪中', undefined, 'running'),
          runtimeMetric('last_report', '最近上报', '0x0F 脱靶量 / 0x18 目标扩展'),
          runtimeMetric('target_id', '跟踪目标', targetId),
          runtimeMetric('tracking_channel', '跟踪视频源', channel),
          runtimeMetric('azimuth', '转台方位角', azimuth, '°'),
          runtimeMetric('elevation', '转台俯仰角', elevation, '°'),
          runtimeMetric('target_distance', '目标距离', 612 + (offset % 17), 'm'),
          runtimeMetric('target_height', '目标高度', 82 + (offset % 9), 'm'),
          runtimeMetric('off_target_x', '水平脱靶量', (offset % 9) - 4, 'px'),
          runtimeMetric('off_target_y', '俯仰脱靶量', (offset % 7) - 3, 'px'),
          runtimeMetric('visible_focal', '可见光物理焦距', 150, 'mm'),
          runtimeMetric('thermal_focal', '热成像物理焦距', 75, 'mm'),
          runtimeMetric('focus_mode', '聚焦模式', 'AF'),
          runtimeMetric('rangefinder', '激光测距器', '正常'),
          runtimeMetric('report_interval', '目标上报周期', 100, 'ms')
        ]
      }
    }
    case 'PL671F': {
      const targetCount = 2 + (offset % 7)
      const reportModes = ['频谱模式', '解析模式', '混合模式']
      const models = ['DJI Mini 3 Pro', 'DJI Mavic 3', 'Autel EVO II']
      return {
        workStatus: '监视中',
        workMode: reportModes[Math.floor(offset / 6) % reportModes.length],
        metrics: [
          commonConnection,
          runtimeMetric('work_status', '工作状态', '监视中', undefined, 'running'),
          runtimeMetric(
            'report_mode',
            '当前上报模式',
            reportModes[Math.floor(offset / 6) % reportModes.length]
          ),
          runtimeMetric('target_count', '当前目标数', targetCount, '架'),
          runtimeMetric('latest_model', '最新识别型号', models[offset % models.length]),
          runtimeMetric('bearing', '最新目标方位角', (180 + (offset % 120)).toFixed(1), '°'),
          runtimeMetric('elevation', '最新目标俯仰角', (10 + (offset % 35) / 2).toFixed(1), '°'),
          runtimeMetric('center_frequency', '当前中心频率', offset % 2 ? 2450000 : 5787000, 'KHz')
        ]
      }
    }
    case 'RDS200': {
      return {
        workStatus: '监视中',
        workMode: '0x1102 RID 广播报文解析',
        metrics: [
          commonConnection,
          runtimeMetric('work_status', '工作状态', '监视中', undefined, 'running'),
          runtimeMetric('last_message', '最近消息', '0x1102 无人机信息'),
          runtimeMetric(
            'uas_id',
            '最新 UAS ID',
            `1581F6N8C237C${String((seed + tick) % 100000).padStart(5, '0')}`
          ),
          runtimeMetric('recv_type', '承载协议', offset % 2 ? '2.4G' : 'BT5'),
          runtimeMetric('rssi', '接收信号强度', -35 - (offset % 12), 'dBm'),
          runtimeMetric(
            'uav_position',
            '无人机经纬度',
            `${(120.356876 + (offset % 5) * 0.00001).toFixed(6)}, ${(30.234543 + (offset % 4) * 0.00001).toFixed(6)}`
          ),
          runtimeMetric('barometric_altitude', '气压高度', (68.5 + (offset % 8)).toFixed(1), 'm'),
          runtimeMetric('ground_height', '距地/起飞高度', 36 + (offset % 7), 'm'),
          runtimeMetric('track_angle', '航迹角', (181 + (offset % 30)) % 360, '°'),
          runtimeMetric('ground_speed', '地速', 8 + (offset % 6), 'm/s'),
          runtimeMetric('operator_position', '操作员经纬度', '120.123456, 30.234543'),
          runtimeMetric('openbox_alarm', '开箱告警', '正常'),
          runtimeMetric('power_alarm', '断电告警', '正常'),
          runtimeMetric(
            'network',
            'TCP/MQTT 链路',
            onlineStatus === '异常' ? '抖动' : '正常',
            undefined,
            connectionLevel
          )
        ]
      }
    }
    case 'EXD55-LS': {
      const modes = ['Mode 1', 'Mode 2', 'Mode 4']
      const mode = modes[Math.floor(offset / 8) % modes.length]
      return {
        workStatus: '接收中',
        workMode: mode,
        metrics: [
          commonConnection,
          runtimeMetric('work_status', '工作状态', '接收中', undefined, 'running'),
          runtimeMetric('work_mode', '当前工作模式', mode),
          runtimeMetric('aircraft_count', '当前航空器数量', 6 + (offset % 13), '架'),
          runtimeMetric('packet_rate', '报文接收速率', 520 + (offset % 180), '条/s'),
          runtimeMetric('output_format', '输出格式', mode === 'Mode 4' ? 'JSON' : '飞机明文'),
          runtimeMetric('heartbeat_count', '心跳计数', (seed + tick) % 10000),
          runtimeMetric('data_output', '数据输出状态', '输出中', undefined, 'running')
        ]
      }
    }
    default:
      return {
        workStatus: onlineStatus === '异常' ? '异常' : '运行中',
        metrics: [
          commonConnection,
          runtimeMetric(
            'work_status',
            '工作状态',
            onlineStatus === '异常' ? '异常' : '运行中',
            undefined,
            connectionLevel
          ),
          runtimeMetric('heartbeat', '最后心跳', '刚刚'),
          runtimeMetric(
            'alarm',
            '当前告警',
            onlineStatus === '异常' ? '1 条' : '无',
            undefined,
            connectionLevel
          )
        ]
      }
  }
}

export function queryDeviceRuntimeSnapshot(id: string): DeviceRuntimeSnapshot {
  const detail = queryDeviceInfoDetail(id)
  if (!detail) throw new Error('设备不存在')

  const seed = hashSeed(id)
  const onlineStatus = resolveRunStatus(detail)
  const model = detail.linkedArchive?.deviceModel || MODEL_BY_TYPE[detail.deviceType] || 'UNKNOWN'
  const tick = Math.floor(Date.now() / 5000)
  const runtime = buildRuntimeMetrics(model, seed, tick, onlineStatus)

  return {
    deviceId: detail.deviceId,
    model,
    connectionStatus: onlineStatus,
    workStatus: runtime.workStatus,
    workMode: runtime.workMode,
    updatedAt: formatNow(),
    metrics: runtime.metrics,
    radar: runtime.radar
  }
}
