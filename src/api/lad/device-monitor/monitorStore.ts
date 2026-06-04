import { queryDeviceArchiveDetail } from '../device/archiveStore'
import { queryDeviceInfoList } from '../device-info/infoStore'
import type { DeviceInfoItem } from '../device-info/types'
import type {
  DeviceMonitorItem,
  DeviceMonitorListResult,
  DeviceMonitorQuery,
  DeviceOnlineStatus
} from './types'

const VENDOR_BY_TYPE: Record<string, string> = {
  雷达: '同方威视',
  无线电侦测: '同方威视',
  无线电干扰: '同方威视',
  导航诱骗: '同方威视',
  激光打击: '同方威视',
  高功率微波: '同方威视',
  光电跟踪: '同方威视'
}

const MODEL_BY_TYPE: Record<string, string> = {
  雷达: 'LAD-RADAR-X2',
  无线电侦测: 'LAD-RF-SCAN',
  无线电干扰: 'LAD-JAM-A1',
  导航诱骗: 'LAD-SPOOF-G2',
  激光打击: 'LAD-LSR-Z3',
  高功率微波: 'LAD-HPM-M9',
  光电跟踪: 'LAD-EO-360'
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

function enrichMonitorRow(row: DeviceInfoItem): DeviceMonitorItem {
  const seed = hashSeed(row.id)
  const onlineStatus = resolveRunStatus(row)
  const archive = row.archiveId ? queryDeviceArchiveDetail(row.archiveId) : null
  const runtimeSec = onlineStatus === '离线' ? seed % 120 : 3600 * (4 + (seed % 48)) + (seed % 3600)
  const metrics = buildMetrics(seed, onlineStatus)

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
    manufacturer: archive?.vendor || VENDOR_BY_TYPE[row.deviceType] || '—',
    deviceModel: archive?.deviceModel || MODEL_BY_TYPE[row.deviceType] || '—',
    personInCharge: row.personInCharge,
    lastHeartbeat: row.lastHeartbeat,
    hasAlert: metrics.alertCount >= 10 || onlineStatus === '异常',
    imageUrl: archive?.imageUrl ?? null
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

  let rows = list.map(enrichMonitorRow)
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
