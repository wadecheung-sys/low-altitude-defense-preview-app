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
  liveMetrics: DataScreenMetricItem[]
  specifications: DataScreenMetricItem[]
  deviceConfigItems: Array<DeviceConfigurableItemTemplate & { currentValue: string }>
  runtimeConfigItems: Array<DeviceConfigurableItemTemplate & { currentValue: string }>
}

/** u324 各状态「查看更多」按钮 → 选型型号（数据大屏03.html） */
export const DATA_SCREEN_VIEW_MORE_BUTTONS: Record<string, string> = {
  u325: 'TBD-RAD',
  u330: 'TBD-EO',
  u335: 'PL671F',
  u340: 'RDS200',
  u345: 'FG310F',
  u351: 'DY506F',
  u357: 'TBD-LSR',
  u363: 'TBD-HPM',
  u369: 'TBD-SLA',
  u375: 'EXD55-LS'
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
        { label: '转台方位角', value: '184.75', unit: '°', emphasis: true },
        { label: '转台俯仰角', value: '12.35', unit: '°', emphasis: true },
        { label: '当前压制频段', value: '2400-2485', unit: 'MHz' },
        { label: '联动模式', value: '自动' },
        { label: '压制状态', value: '待机' },
        ...common
      ]
    case 'DY506F':
      return [
        { label: '锁定目标', value: 'T-0726-01', emphasis: true },
        { label: '诱骗模式', value: '驱离' },
        { label: '发射功率档位', value: '中' },
        { label: '发射状态', value: '关闭' },
        { label: '有效防御距离', value: '820', unit: 'm' },
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
        { label: 'RID 目标数', value: '4', unit: '架', emphasis: true },
        { label: '转台方位角', value: '184.75', unit: '°' },
        { label: '转台俯仰角', value: '12.35', unit: '°' },
        { label: '最近 Remote-ID', value: '1581F45TB23A0023' },
        { label: '刷新策略', value: '实时' },
        ...common
      ]
    case 'TBD-RAD':
      return [
        { label: '锁定目标', value: 'T-0726-01', emphasis: true },
        { label: '探测距离', value: '5.8', unit: 'km' },
        { label: '扫描周期', value: '4', unit: 's' },
        { label: '发现目标数', value: '3', unit: '架' },
        ...common
      ]
    case 'TBD-EO':
      return [
        { label: '跟踪目标', value: 'T-0726-01', emphasis: true },
        { label: '转台方位角', value: '126.4', unit: '°' },
        { label: '转台俯仰角', value: '8.2', unit: '°' },
        { label: '跟踪模式', value: '自动' },
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

function summaryFields(nameId: string, typeId: string, deployId: string, onlineId: string): SummaryFieldSync[] {
  return [
    { elementId: nameId, render: (v) => labelLine('设备名称', v.deviceName) },
    { elementId: typeId, render: (v) => labelLine('设备类型', v.deviceType) },
    { elementId: deployId, render: (v) => labelLine('部署位置', v.deployLocation) },
    { elementId: onlineId, render: (v) => labelLine('设备状态', v.onlineStatus) }
  ]
}

/** 同步 u324 设备概要面板文案（每状态 4 个字段） */
export const DATA_SCREEN_SUMMARY_PANELS: SummaryPanelSync[] = [
  { model: 'TBD-RAD', fields: summaryFields('u326', 'u327', 'u328', 'u329') },
  { model: 'TBD-EO', fields: summaryFields('u331', 'u332', 'u333', 'u334') },
  { model: 'PL671F', fields: summaryFields('u336', 'u337', 'u338', 'u339') },
  { model: 'RDS200', fields: summaryFields('u341', 'u342', 'u343', 'u344') },
  { model: 'FG310F', fields: summaryFields('u346', 'u347', 'u348', 'u349') },
  { model: 'DY506F', fields: summaryFields('u352', 'u353', 'u354', 'u355') },
  { model: 'TBD-LSR', fields: summaryFields('u358', 'u359', 'u360', 'u361') },
  { model: 'TBD-HPM', fields: summaryFields('u364', 'u365', 'u366', 'u367') },
  { model: 'TBD-SLA', fields: summaryFields('u370', 'u371', 'u372', 'u373') },
  { model: 'EXD55-LS', fields: summaryFields('u376', 'u377', 'u378', 'u379') }
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
