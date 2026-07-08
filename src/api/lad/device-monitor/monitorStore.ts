import { queryDeviceArchiveDetail } from '../device/archiveStore'
import { queryDeviceInfoDetail, queryDeviceInfoList } from '../device-info/infoStore'
import type { DeviceInfoItem } from '../device-info/types'
import type {
  DeviceMonitorItem,
  DeviceMonitorListResult,
  DeviceMonitorQuery,
  DeviceMonitorStatusField,
  DeviceOnlineStatus
} from './types'

/** 监控页不展示周边类设备（摄像头、ADS-B） */
const MONITOR_EXCLUDED_TYPES = new Set(['监控摄像头', 'ADS-B 监视'])

const VENDOR_BY_TYPE: Record<string, string> = {
  雷达: '华诺智感',
  无线电侦测: '凡双科技',
  'Remote-ID 监视': '凡双科技',
  'ADS-B 监视': '亿思德科技',
  无线电干扰: '凡双科技',
  导航诱骗: '凡双科技',
  激光打击: '锐光防务',
  高功率微波: '磐石电子',
  光电跟踪: '视界光电'
}

const MODEL_BY_TYPE: Record<string, string> = {
  雷达: 'TBD-RAD',
  无线电侦测: 'PL671F',
  'Remote-ID 监视': 'RDS200',
  'ADS-B 监视': 'EXD55-LS',
  无线电干扰: 'FG310F',
  导航诱骗: 'DY506F',
  激光打击: 'TBD-LSR',
  高功率微波: 'TBD-HPM',
  光电跟踪: 'TBD-EO'
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

function buildRuntimeStatus(
  model: string,
  online: DeviceOnlineStatus,
  seed: number,
  metrics: ReturnType<typeof buildMetrics>
): DeviceMonitorStatusField[] {
  const offline = online === '离线'
  const bearing = (seed * 37) % 360
  const pitch = -10 + (seed % 71)

  if (model === 'FG310F') {
    return [
      { label: '转台方位', value: offline ? '—' : `${bearing}°` },
      { label: '转台俯仰', value: offline ? '—' : `${pitch}°` },
      { label: '压制状态', value: offline ? '离线' : online === '异常' ? '待机' : '联动待命' },
      { label: '今日压制', value: offline ? '0' : String(metrics.handleCount) }
    ]
  }
  if (model === 'DY506F') {
    return [
      { label: 'GPS 搜星', value: offline ? '—' : `${6 + (seed % 4)}` },
      { label: 'GLONASS 搜星', value: offline ? '—' : `${4 + (seed % 3)}` },
      { label: '发射状态', value: offline ? '关闭' : online === '异常' ? '授时异常' : '关闭' },
      { label: '工作模式', value: offline ? '—' : '待命' }
    ]
  }
  if (model === 'PL671F') {
    return [
      { label: '探测目标', value: offline ? '0' : String(Math.max(0, metrics.detectCount % 40)) },
      { label: '测向方位', value: offline ? '—' : `${bearing}°` },
      { label: '今日告警', value: offline ? '0' : String(metrics.alertCount) },
      { label: '识别模式', value: '频谱/RID/WiFi' }
    ]
  }
  if (model === 'RDS200') {
    return [
      { label: 'RID 目标', value: offline ? '0' : String(Math.max(0, metrics.detectCount % 50)) },
      { label: '刷新周期', value: offline ? '—' : '≤1s' },
      { label: '上报链路', value: offline ? '断开' : '正常' },
      { label: '今日跟踪', value: offline ? '0' : String(metrics.detectCount) }
    ]
  }
  if (model.startsWith('TBD-')) {
    return [{ label: '运行状态', value: '正常' }]
  }
  if (model === 'EXD55-LS') {
    return [
      { label: '输出模式', value: 'Mode 4 JSON' },
      { label: '心跳间隔', value: '12s' }
    ]
  }
  return [
    { label: '今日探测', value: offline ? '0' : String(metrics.detectCount) },
    { label: '今日告警', value: offline ? '0' : String(metrics.alertCount) }
  ]
}

function cloneLinkedArchive(detail: ReturnType<typeof queryDeviceInfoDetail>) {
  if (!detail?.linkedArchive) return null
  const arch = detail.linkedArchive
  return {
    ...arch,
    indicators: arch.indicators.map((indicator) => ({ ...indicator }))
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
    runtimeStatus: buildRuntimeStatus(deviceModel, onlineStatus, seed, metrics),
    manufacturer:
      linkedArchive?.vendor || archive?.vendor || VENDOR_BY_TYPE[row.deviceType] || '—',
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

  let rows = list
    .filter((row) => !MONITOR_EXCLUDED_TYPES.has(row.deviceType))
    .map(enrichMonitorRow)
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
