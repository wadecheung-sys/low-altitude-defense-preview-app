import { queryDeviceArchiveDetail } from '../device/archiveStore'
import { queryDeviceInfoDetail, queryDeviceInfoList } from '../device-info/infoStore'
import type { DeviceInfoItem } from '../device-info/types'
import { LAD_MONITOR_EXCLUDED_DEVICE_TYPES } from '@/constants/deviceTypes'
import { buildHeartbeatByDeviceType } from './heartbeatSnapshots'
import type {
  DeviceMonitorItem,
  DeviceMonitorListResult,
  DeviceMonitorQuery,
  DeviceOnlineStatus,
  DeviceRuntimeSnapshot
} from './types'

/** 监控页不展示周边类设备 */
const MONITOR_EXCLUDED_TYPES = new Set(LAD_MONITOR_EXCLUDED_DEVICE_TYPES)

const VENDOR_BY_TYPE: Record<string, string> = {
  雷达: '081',
  无线电侦测: '凡双科技',
  'Remote-ID 监视': '凡双科技',
  'ADS-B 监视': '凡双科技',
  无线电干扰: '凡双科技',
  导航诱骗: '凡双科技',
  察打一体: '凡双科技',
  强光驱离: '凡双科技',
  激光打击: '锐光防务',
  高功率微波: '081',
  光电跟踪: '耐杰光电'
}

const MODEL_BY_TYPE: Record<string, string> = {
  雷达: 'RADAR-081',
  无线电侦测: 'PL671F',
  'Remote-ID 监视': 'RDS200',
  'ADS-B 监视': 'EXD55-LS',
  无线电干扰: 'FG310F',
  导航诱骗: 'DY506F',
  察打一体: 'FS-CDYT',
  强光驱离: 'TBD-SLA',
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

export function queryDeviceRuntimeSnapshot(id: string): DeviceRuntimeSnapshot {
  const detail = queryDeviceInfoDetail(id)
  if (!detail) throw new Error('设备不存在')

  const seed = hashSeed(id)
  const onlineStatus = resolveRunStatus(detail)
  const model = detail.linkedArchive?.deviceModel || MODEL_BY_TYPE[detail.deviceType] || 'UNKNOWN'
  const tick = Math.floor(Date.now() / 5000)
  const runtime = buildHeartbeatByDeviceType({
    deviceType: detail.deviceType,
    deviceId: detail.deviceId,
    deviceName: detail.deviceName,
    deviceModel: model,
    ipAddress: detail.ipAddress,
    serialNo: detail.serialNo,
    seed,
    tick,
    onlineStatus,
    longitude: detail.longitude,
    latitude: detail.latitude,
    controlRangeM: detail.controlRangeM
  })

  return {
    deviceId: detail.deviceId,
    model,
    connectionStatus: onlineStatus,
    workStatus: runtime.workStatus,
    workMode: runtime.workMode,
    updatedAt: formatNow(),
    metrics: runtime.metrics
  }
}
