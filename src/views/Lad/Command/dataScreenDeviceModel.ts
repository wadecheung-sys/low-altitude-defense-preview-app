import { queryDeviceInfoDetail, queryDeviceInfoList } from '@/api/lad/device-info/infoStore'
import type { DeviceInfoItem } from '@/api/lad/device-info/types'
import {
  ALL_CATALOG_DEVICES,
  CONFIRMED_DEVICES,
  INTERNAL_PLACEHOLDER_DEVICES,
  type DeviceCatalogEntry,
  type DeviceCatalogTier,
  type DeviceConfigurableItemTemplate
} from '@/constants/deviceCatalog'
import { getConfirmedDeviceProtocol } from '@/constants/deviceProtocols'

export type DataScreenDetailTab = 'monitor' | 'console' | 'logic'

export interface DataScreenMetricItem {
  label: string
  value: string
  unit?: string
  emphasis?: boolean
}

export interface DataScreenDeviceView {
  model: string
  deviceType: string
  vendor: string
  tier: DeviceCatalogTier
  deviceRecordId?: string
  deviceCode?: string
  deviceName: string
  deployLocation: string
  ipAddress: string
  serialNo: string
  personInCharge: string
  onlineStatus: '在线' | '离线'
  runStatus: string
  healthStatus: string
  overviewMetrics: DataScreenMetricItem[]
  protocolMetrics: DataScreenMetricItem[]
  liveMetrics: DataScreenMetricItem[]
  specifications: DataScreenMetricItem[]
  deviceConfigItems: Array<DeviceConfigurableItemTemplate & { currentValue: string }>
  runtimeConfigItems: Array<DeviceConfigurableItemTemplate & { currentValue: string }>
}

/** u315 各状态「查看更多」按钮 → 选型型号（数据大屏03.html） */
export const DATA_SCREEN_VIEW_MORE_BUTTONS: Record<string, string> = {
  u316: 'RADAR-081',
  u321: 'EO-V2.8',
  u326: 'PL671F',
  u331: 'RDS200',
  u337: 'FG310F',
  u343: 'DY506F',
  u349: 'TBD-LSR',
  u355: 'TBD-HPM',
  u361: 'TBD-SLA',
  u366: 'EXD55-LS'
}

interface SummaryFieldSync {
  elementId: string
  render: (view: DataScreenDeviceView) => string
}

interface SummaryPanelSync {
  model: string
  fields: SummaryFieldSync[]
}

function findCatalogEntry(model: string): DeviceCatalogEntry | undefined {
  return (
    ALL_CATALOG_DEVICES.find((item) => item.model === model) ??
    INTERNAL_PLACEHOLDER_DEVICES.find((item) => item.model === model) ??
    CONFIRMED_DEVICES.find((item) => item.model === model)
  )
}

function resolveInfoRecord(entry: DeviceCatalogEntry): DeviceInfoItem | undefined {
  const res = queryDeviceInfoList({
    pageIndex: 1,
    pageSize: 1,
    deviceId: entry.demo.deviceId
  })
  return res.list[0]
}

function mockLiveMetrics(entry: DeviceCatalogEntry): DataScreenMetricItem[] {
  const { model, deviceType } = entry
  const common: DataScreenMetricItem[] = [
    { label: '最近心跳', value: '2026-07-09 23:08:12' },
    { label: '数据刷新', value: '1.0 s' }
  ]

  switch (model) {
    case 'FG310F':
      return [
        { label: '锁定目标', value: 'T-0726-01', emphasis: true },
        { label: '转台水平角', value: '184.75', unit: '°', emphasis: true },
        { label: '转台垂直角', value: '12.35', unit: '°', emphasis: true },
        { label: '频段索引', value: '2 · 2400-2485', unit: 'MHz' },
        { label: '频段功率', value: '9.0', unit: 'dBm' },
        { label: '功放温度', value: '31', unit: '℃' },
        { label: '最近报文', value: '0x2003 角度上报' },
        ...common
      ]
    case 'DY506F':
      return [
        { label: '系统工作状态', value: '工作中 · 整点授时', emphasis: true },
        { label: '晶振状态', value: '锁定' },
        { label: '授时同步', value: '正常 · 18 ns' },
        { label: '四系统发射', value: 'GPS/BDS/GLO 开 · GAL 关' },
        { label: '转发卫星', value: 'GPS 9 / BDS 8 / GLO 6 / GAL 4' },
        { label: '模拟位置', value: '120.089436, 30.341896 · 36 m' },
        { label: '环境温度', value: '37.2', unit: '℃' },
        { label: '最近报文', value: '0x1010 设备信息上报' },
        ...common
      ]
    case 'PL671F':
      return [
        { label: '侦测目标数', value: '6', unit: '架', emphasis: true },
        { label: '最近识别', value: 'DJI Mini 3 Pro' },
        { label: '侦测灵敏度', value: '中' },
        { label: '上报周期', value: '5', unit: 's' },
        ...common
      ]
    case 'RDS200':
      return [
        { label: '最新 UAS ID', value: '1581F6N8C237C0031Q5N', emphasis: true },
        { label: '承载协议', value: 'WiFi 2.4G' },
        { label: '接收信号', value: '-35', unit: 'dBm' },
        { label: '无人机位置', value: '120.356876, 30.234543' },
        { label: '气压/距地高度', value: '68.5 / 36', unit: 'm' },
        { label: '航迹角/地速', value: '181° / 10 m/s' },
        { label: '设备告警', value: '开箱正常 · 供电正常' },
        { label: '最近报文', value: '0x1102 无人机信息' },
        ...common
      ]
    case 'RADAR-081':
      return [
        { label: '目标批次号', value: '081', emphasis: true },
        { label: '最新报文', value: '0x8C 跟踪航迹报' },
        { label: '目标距离', value: '3.8', unit: 'km' },
        { label: '目标速度', value: '26', unit: 'm/s' },
        { label: '报文频率', value: '10', unit: 'Hz' },
        { label: '阵面/处理状态', value: '正常' },
        { label: '最近心跳', value: '2026-07-09 23:08:12' },
        { label: '数据刷新', value: '0.1 s' }
      ]
    case 'EO-V2.8':
      return [
        { label: '跟踪目标', value: 'T-0726-01', emphasis: true },
        { label: '工作模式', value: '跟踪中', emphasis: true },
        { label: '跟踪视频源', value: '可见光' },
        { label: '转台方位角', value: '126.4', unit: '°' },
        { label: '转台俯仰角', value: '8.2', unit: '°' },
        { label: '目标距离', value: '612', unit: 'm' },
        { label: '目标高度', value: '86', unit: 'm' },
        { label: '水平/俯仰脱靶量', value: '+4 / -2', unit: 'px' },
        { label: '可见光物理焦距', value: '150', unit: 'mm' },
        { label: '热成像物理焦距', value: '75', unit: 'mm' },
        { label: '聚焦模式', value: 'AF' },
        { label: '激光测距器', value: '正常' },
        { label: '最近报文', value: '0x0F 脱靶量 / 0x18 目标扩展' },
        ...common
      ]
    case 'TBD-LSR':
      return [
        { label: '瞄准目标', value: '—' },
        { label: '出光状态', value: '待命' },
        { label: '作用距离估算', value: '520', unit: 'm' },
        ...common
      ]
    case 'TBD-HPM':
      return [
        { label: '锁定目标', value: 'T-0726-01' },
        { label: '工作模式', value: '待机' },
        { label: '方位角', value: '184.75', unit: '°' },
        { label: '俯仰角', value: '12.35', unit: '°' },
        ...common
      ]
    case 'EXD55-LS':
      return [
        { label: '1090ES 报文', value: '12', unit: '条/min' },
        { label: '输出格式', value: 'JSON' },
        ...common
      ]
    case 'TBD-SLA':
      return [
        { label: '锁定目标', value: 'T-0726-01' },
        { label: '声光状态', value: '待命' },
        { label: '警示等级', value: '—' },
        ...common
      ]
    default:
      return [{ label: '设备类型', value: deviceType }, ...common]
  }
}

function buildProtocolMetrics(entry: DeviceCatalogEntry): DataScreenMetricItem[] {
  const protocol = getConfirmedDeviceProtocol(entry.model)
  if (!protocol) return []
  return [
    { label: '传输方式', value: protocol.transport },
    { label: '连接角色', value: protocol.connectionRole },
    { label: '报文封装', value: protocol.framing },
    { label: '对接端点', value: protocol.endpoint },
    {
      label: '已映射消息',
      value: protocol.messages.map((message) => `${message.code} ${message.label}`).join(' / ')
    },
    { label: '协议依据', value: protocol.sourceDocument }
  ]
}

function resolveRunStatus(entry: DeviceCatalogEntry): string {
  switch (entry.deviceType) {
    case '雷达':
    case '无线电侦测':
    case 'Remote-ID 监视':
    case 'ADS-B 监视':
      return '监视中'
    case '光电跟踪':
      return '跟踪中'
    case '无线电干扰':
    case '导航诱骗':
    case '激光打击':
    case '高功率微波':
      return '待机'
    case '声光驱离':
      return '待命'
    default:
      return '运行中'
  }
}

function mockOverviewMetrics(entry: DeviceCatalogEntry): DataScreenMetricItem[] {
  const runStatus = resolveRunStatus(entry)
  return [
    { label: '设备状态', value: '在线', emphasis: true },
    { label: '运行状态', value: runStatus },
    { label: '健康状态', value: '正常' },
    { label: '部署位置', value: entry.demo.deployLocation },
    { label: '负责人', value: entry.demo.personInCharge },
    { label: 'IP 地址', value: entry.demo.ipAddress }
  ]
}

function configCurrentValue(
  item: DeviceConfigurableItemTemplate,
  savedValues: Record<string, string> = {}
): string {
  if (savedValues[item.key]?.trim()) return savedValues[item.key]
  if (item.defaultValue) return item.defaultValue
  if (item.key === 'turntable_azimuth' || item.key === 'eo_azimuth') return '184.75'
  if (item.key === 'turntable_elevation' || item.key === 'eo_elevation') return '12.35'
  if (item.key === 'track_mode' || item.key === 'link_track_mode') return '自动'
  if (item.key === 'detect_sensitivity') return '中'
  if (item.key === 'report_interval') return '5'
  if (item.key === 'refresh_policy') return '实时'
  if (item.key === 'output_format') return 'JSON'
  if (item.key === 'scan_mode') return '扇扫'
  if (item.key === 'target_filter') return '中'
  if (item.key === 'alarm_threshold') return '3'
  if (item.key === 'link_eo_track') return '开'
  if (item.key === 'safety_interlock') return '启用'
  if (item.key === 'max_exposure') return '10'
  if (item.key === 'fire_confirm' || item.key === 'link_radar_aim') return '开'
  if (item.key === 'work_mode') return '待机'
  if (item.key === 'target_hold_time') return '15'
  if (item.key === 'emission_confirm') return '开'
  if (item.key === 'warning_level' || item.key === 'volume_level') return '中'
  if (item.key === 'auto_trigger') return '开'
  if (item.key === 'light_pattern') return '频闪'
  return '—'
}

export function buildDataScreenDeviceView(model: string): DataScreenDeviceView | null {
  const entry = findCatalogEntry(model)
  if (!entry) return null

  const record = resolveInfoRecord(entry)
  const detail = record?.id ? queryDeviceInfoDetail(record.id) : null
  const savedConfig = detail?.deviceConfigValues ?? {}
  const deviceConfigItems = entry.configurableItems
    .filter((item) => item.scope === 'device')
    .map((item) => ({ ...item, currentValue: configCurrentValue(item, savedConfig) }))
  const runtimeConfigItems = entry.configurableItems
    .filter((item) => item.scope === 'runtime')
    .map((item) => ({ ...item, currentValue: configCurrentValue(item, savedConfig) }))

  return {
    model: entry.model,
    deviceType: entry.deviceType,
    vendor: entry.vendor,
    tier: entry.tier,
    deviceRecordId: record?.id,
    deviceCode: record?.deviceId ?? entry.demo.deviceId,
    deviceName: record?.deviceName ?? entry.demo.deviceName,
    deployLocation: record?.deployLocation ?? entry.demo.deployLocation,
    ipAddress: record?.ipAddress ?? entry.demo.ipAddress,
    serialNo: record?.serialNo ?? entry.demo.serialNo,
    personInCharge: record?.personInCharge ?? entry.demo.personInCharge,
    onlineStatus: '在线',
    runStatus: mockOverviewMetrics(entry)[1]?.value ?? '监视中',
    healthStatus: '正常',
    overviewMetrics: mockOverviewMetrics(entry),
    protocolMetrics: buildProtocolMetrics(entry),
    liveMetrics: mockLiveMetrics(entry),
    specifications: entry.specifications.map((item) => ({
      label: item.item,
      value: item.value,
      unit: item.unit || undefined
    })),
    deviceConfigItems,
    runtimeConfigItems
  }
}

function labelLine(label: string, value: string) {
  return `${label}：${value}`
}

function summaryFields(
  nameId: string,
  typeId: string,
  deployId: string,
  onlineId: string
): SummaryFieldSync[] {
  return [
    { elementId: nameId, render: (v) => labelLine('设备名称', v.deviceName) },
    { elementId: typeId, render: (v) => labelLine('设备类型', v.deviceType) },
    { elementId: deployId, render: (v) => labelLine('部署位置', v.deployLocation) },
    { elementId: onlineId, render: (v) => labelLine('设备状态', v.onlineStatus) }
  ]
}

/** 同步 u315 设备概要面板文案（每状态 4 个字段） */
export const DATA_SCREEN_SUMMARY_PANELS: SummaryPanelSync[] = [
  { model: 'RADAR-081', fields: summaryFields('u312', 'u313', 'u314', 'u315') },
  { model: 'EO-V2.8', fields: summaryFields('u317', 'u318', 'u319', 'u320') },
  { model: 'PL671F', fields: summaryFields('u322', 'u323', 'u324', 'u325') },
  { model: 'RDS200', fields: summaryFields('u327', 'u328', 'u329', 'u330') },
  { model: 'FG310F', fields: summaryFields('u332', 'u333', 'u334', 'u335') },
  { model: 'DY506F', fields: summaryFields('u338', 'u339', 'u340', 'u341') },
  { model: 'TBD-LSR', fields: summaryFields('u344', 'u345', 'u346', 'u347') },
  { model: 'TBD-HPM', fields: summaryFields('u350', 'u351', 'u352', 'u353') },
  { model: 'TBD-SLA', fields: summaryFields('u356', 'u357', 'u358', 'u359') },
  { model: 'EXD55-LS', fields: summaryFields('u362', 'u363', 'u364', 'u365') }
]

export function setPrototypeLabelText(doc: Document, elementId: string, text: string) {
  const root = doc.getElementById(`${elementId}_text`)
  if (!root) return
  const span = root.querySelector('span')
  if (span) {
    span.textContent = text
    return
  }
  root.textContent = text
}
