import { deviceSupportsSelfCheck, runDeviceSelfCheck } from './deviceSelfCheck'
import type { DeviceSelfCheckResult } from './deviceSelfCheck'
import { queryDeviceArchiveDetail } from '../device/archiveStore'
import type {
  DeviceExtendedField,
  DeviceInfoDeployment,
  DeviceInfoDetail,
  DeviceInfoItem,
  DeviceInfoListResult,
  DeviceInfoQuery,
  DeviceInfoSavePayload,
  DeviceLinkedArchive
} from './types'

interface DeviceInfoExt extends DeviceInfoDeployment {
  remark: string
  extendedFields: DeviceExtendedField[]
}

const DEFAULT_EXT: DeviceInfoExt = {
  remark: '',
  deployAddress: '',
  longitude: 116.397128,
  latitude: 39.916527,
  mapX: 50,
  mapY: 50,
  deviceIcon: 'jammer',
  controlRangeM: 500,
  contactPhone: '',
  extendedFields: []
}

let extendSeq = 0
function nextExtendId() {
  extendSeq += 1
  return `ext-${Date.now()}-${extendSeq}`
}

function defaultExtendedFields(row: DeviceInfoItem): DeviceExtendedField[] {
  return [
    { id: nextExtendId(), label: '安装方位', value: `${row.deployLocation}主朝向` },
    { id: nextExtendId(), label: '现场编号', value: row.serialNo.slice(-6) },
    { id: nextExtendId(), label: '维护周期', value: '每季度巡检' }
  ]
}

function resolveLinkedArchive(archiveId?: string): DeviceLinkedArchive | null {
  if (!archiveId) return null
  const arch = queryDeviceArchiveDetail(archiveId)
  if (!arch) return null
  return {
    id: arch.id,
    archiveNo: arch.archiveNo,
    archiveName: arch.archiveName,
    deviceType: arch.deviceType,
    vendor: arch.vendor,
    deviceModel: arch.deviceModel,
    imageUrl: arch.imageUrl,
    indicators: arch.indicators.map((i) => ({ ...i }))
  }
}

const detailExt: Record<string, DeviceInfoExt> = {}

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function defaultExtForRow(row: DeviceInfoItem, index: number): DeviceInfoExt {
  const offsets = [
    { mapX: 52, mapY: 46, lng: 116.397128, lat: 39.916527 },
    { mapX: 38, mapY: 58, lng: 116.392, lat: 39.912 },
    { mapX: 64, mapY: 52, lng: 116.401, lat: 39.914 },
    { mapX: 48, mapY: 68, lng: 116.395, lat: 39.908 },
    { mapX: 72, mapY: 40, lng: 116.404, lat: 39.918 }
  ]
  const o = offsets[index % offsets.length]
  return {
    remark: '',
    deployAddress: `${row.deployLocation} · 园区坐标已标绘`,
    longitude: o.lng,
    latitude: o.lat,
    mapX: o.mapX,
    mapY: o.mapY,
    deviceIcon: row.deviceType.includes('雷达')
      ? 'radar'
      : row.deviceType.includes('光电')
        ? 'eo'
        : 'jammer',
    controlRangeM:
      row.deviceType === '雷达'
        ? 800
        : row.deviceType === '高功率微波'
          ? 1200
          : row.deviceType === '光电跟踪'
            ? 600
            : 500,
    contactPhone: `138${String(10000000 + index).slice(-8)}`,
    extendedFields: []
  }
}

function mergeExt(body: DeviceInfoSavePayload, prev?: DeviceInfoExt): DeviceInfoExt {
  const extendedFields =
    body.extendedFields?.map((f) => ({
      id: f.id,
      label: f.label.trim(),
      value: f.value.trim()
    })) ??
    prev?.extendedFields ??
    []
  return {
    remark: body.remark ?? prev?.remark ?? '',
    deployAddress: body.deployAddress?.trim() ?? prev?.deployAddress ?? '',
    longitude: body.longitude ?? prev?.longitude ?? DEFAULT_EXT.longitude,
    latitude: body.latitude ?? prev?.latitude ?? DEFAULT_EXT.latitude,
    mapX: body.mapX ?? prev?.mapX ?? DEFAULT_EXT.mapX,
    mapY: body.mapY ?? prev?.mapY ?? DEFAULT_EXT.mapY,
    deviceIcon: body.deviceIcon?.trim() || prev?.deviceIcon || DEFAULT_EXT.deviceIcon,
    controlRangeM: Number(body.controlRangeM ?? prev?.controlRangeM ?? DEFAULT_EXT.controlRangeM),
    contactPhone: body.contactPhone?.trim() ?? prev?.contactPhone ?? '',
    extendedFields
  }
}

const seedRows: Omit<DeviceInfoItem, 'id'>[] = [
  {
    deviceId: 'DEV-R-01',
    deviceName: '北区无线电干扰器',
    archiveInfo: '核心区无线电干扰设备档案',
    archiveId: 'da-10004',
    deviceType: '无线电干扰',
    deployLocation: '楼顶A区',
    ipAddress: '192.168.1.10',
    serialNo: 'RD-2025-X01',
    lastHeartbeat: '2026-05-20 14:32:18',
    personInCharge: '张工',
    updatedAt: '2026-05-20 14:32:18'
  },
  {
    deviceId: 'DEV-RAD-02',
    deviceName: '核心区雷达站',
    archiveInfo: '北区低空监视雷达档案',
    archiveId: 'da-10001',
    deviceType: '雷达',
    deployLocation: '塔台B座',
    ipAddress: '192.168.1.21',
    serialNo: 'LD-2025-A02',
    lastHeartbeat: '2026-05-20 14:28:05',
    personInCharge: '李工',
    updatedAt: '2026-05-20 14:28:05'
  },
  {
    deviceId: 'DEV-EO-03',
    deviceName: '南门光电跟踪球',
    archiveInfo: '南门光电跟踪转台档案',
    archiveId: 'da-10003',
    deviceType: '光电跟踪',
    deployLocation: '南门岗哨',
    ipAddress: '192.168.2.15',
    serialNo: 'EO-2025-C11',
    lastHeartbeat: '2026-05-20 13:55:40',
    personInCharge: '王工',
    updatedAt: '2026-05-20 13:55:40'
  },
  {
    deviceId: 'DEV-S-04',
    deviceName: '西区导航诱骗设备',
    archiveInfo: '西区导航诱骗设备档案',
    archiveId: 'da-10005',
    deviceType: '导航诱骗',
    deployLocation: '西区机房',
    ipAddress: '192.168.3.8',
    serialNo: 'SP-2025-D04',
    lastHeartbeat: '2026-05-20 12:10:22',
    personInCharge: '赵工',
    updatedAt: '2026-05-20 12:10:22'
  },
  {
    deviceId: 'DEV-RF-05',
    deviceName: '东侧无线电侦测',
    archiveInfo: '东侧无线电侦测站档案',
    archiveId: 'da-10002',
    deviceType: '无线电侦测',
    deployLocation: '东侧瞭望台',
    ipAddress: '192.168.1.45',
    serialNo: 'RF-2025-E05',
    lastHeartbeat: '2026-05-19 22:18:00',
    personInCharge: '周工',
    updatedAt: '2026-05-19 22:18:00'
  }
]

let allList: DeviceInfoItem[] = [
  ...seedRows.map((r, i) => ({ ...r, id: `di-${10001 + i}` })),
  ...Array.from({ length: 20 }, (_, i) => {
    const types = [
      '无线电干扰',
      '雷达',
      '光电跟踪',
      '导航诱骗',
      '无线电侦测',
      '激光打击',
      '高功率微波'
    ] as const
    const type = types[i % types.length]
    const seq = String(i + 6).padStart(2, '0')
    const day = String(18 + (i % 3)).padStart(2, '0')
    const archiveLabel = `${type}档案-${seq}`
    return {
      id: `di-${10006 + i}`,
      deviceId: `DEV-${type.slice(0, 2).toUpperCase()}-${seq}`,
      deviceName: `演示设备-${seq}`,
      archiveInfo: archiveLabel,
      deviceType: type,
      deployLocation: `部署点-${seq}`,
      ipAddress: `192.168.${1 + (i % 3)}.${10 + i}`,
      serialNo: `SN-2025-${seq}`,
      lastHeartbeat: `2026-05-${day} ${String(8 + (i % 10)).padStart(2, '0')}:15:00`,
      personInCharge: ['张工', '李工', '王工', '赵工'][i % 4],
      updatedAt: `2026-05-${day} ${String(8 + (i % 10)).padStart(2, '0')}:15:00`
    }
  })
]

// 初始化扩展部署信息与扩展字段
allList.forEach((row, i) => {
  if (!detailExt[row.id]) {
    detailExt[row.id] = {
      ...defaultExtForRow(row, i),
      extendedFields: defaultExtendedFields(row)
    }
  } else if (!detailExt[row.id]!.extendedFields?.length) {
    detailExt[row.id]!.extendedFields = defaultExtendedFields(row)
  }
  if (!row.archiveId && i < 5) {
    row.archiveId = `da-${10001 + i}`
  }
})

function filterList(params: DeviceInfoQuery): DeviceInfoItem[] {
  let rows = [...allList]
  if (params.deviceId?.trim()) {
    const kw = params.deviceId.trim().toLowerCase()
    rows = rows.filter((r) => r.deviceId.toLowerCase().includes(kw))
  }
  if (params.deviceName?.trim()) {
    const kw = params.deviceName.trim().toLowerCase()
    rows = rows.filter((r) => r.deviceName.toLowerCase().includes(kw))
  }
  if (params.deviceType) {
    rows = rows.filter((r) => r.deviceType === params.deviceType)
  }
  if (params.deployLocation?.trim()) {
    const kw = params.deployLocation.trim().toLowerCase()
    rows = rows.filter((r) => r.deployLocation.toLowerCase().includes(kw))
  }
  if (params.ipAddress?.trim()) {
    const kw = params.ipAddress.trim().toLowerCase()
    rows = rows.filter((r) => r.ipAddress.toLowerCase().includes(kw))
  }
  if (params.serialNo?.trim()) {
    const kw = params.serialNo.trim().toLowerCase()
    rows = rows.filter((r) => r.serialNo.toLowerCase().includes(kw))
  }
  if (params.personInCharge?.trim()) {
    const kw = params.personInCharge.trim().toLowerCase()
    rows = rows.filter((r) => r.personInCharge.toLowerCase().includes(kw))
  }
  if (params.lastHeartbeatStart) {
    rows = rows.filter((r) => r.lastHeartbeat >= params.lastHeartbeatStart!)
  }
  if (params.lastHeartbeatEnd) {
    rows = rows.filter((r) => r.lastHeartbeat <= `${params.lastHeartbeatEnd} 23:59:59`)
  }
  return rows
}

export function buildDeviceInfoDetail(row: DeviceInfoItem): DeviceInfoDetail {
  const idx = allList.findIndex((r) => r.id === row.id)
  if (!detailExt[row.id]) {
    detailExt[row.id] = defaultExtForRow(row, idx >= 0 ? idx : 0)
  }
  const ext = detailExt[row.id]!
  return {
    ...row,
    ...ext,
    remark: ext.remark,
    linkedArchive: resolveLinkedArchive(row.archiveId),
    extendedFields: ext.extendedFields.map((f) => ({ ...f })),
    supportsSelfCheck: deviceSupportsSelfCheck(row.deviceType)
  }
}

export function queryDeviceSelfCheck(id: string): DeviceSelfCheckResult | null {
  const row = allList.find((r) => r.id === id)
  if (!row) return null
  return runDeviceSelfCheck(row)
}

export function queryDeviceInfoList(params: DeviceInfoQuery): DeviceInfoListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const filtered = filterList(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length
  }
}

export function queryDeviceInfoDetail(id: string): DeviceInfoDetail | null {
  const row = allList.find((r) => r.id === id)
  if (!row) return null
  return buildDeviceInfoDetail(row)
}

export function deleteDeviceInfoRecords(ids: string[]) {
  const set = new Set(ids)
  allList = allList.filter((r) => !set.has(r.id))
  ids.forEach((id) => delete detailExt[id])
}

function nextDeviceId() {
  const nums = allList
    .map((r) => parseInt(r.id.replace(/^di-/, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 10000
  return `di-${max + 1}`
}

function generateDeviceCode() {
  const n = allList.length + 1
  return `DEV-NEW-${String(n).padStart(3, '0')}`
}

export function saveDeviceInfoRecord(body: DeviceInfoSavePayload): DeviceInfoItem {
  const now = formatNow()
  if (body.id) {
    const idx = allList.findIndex((r) => r.id === body.id)
    if (idx < 0) throw new Error('设备不存在')
    const row: DeviceInfoItem = {
      ...allList[idx],
      deviceId: body.deviceId?.trim() || allList[idx].deviceId,
      deviceName: body.deviceName.trim(),
      archiveInfo: body.archiveInfo.trim(),
      archiveId: body.archiveId,
      deviceType: body.deviceType,
      deployLocation: body.deployLocation.trim(),
      ipAddress: body.ipAddress.trim(),
      serialNo: body.serialNo.trim(),
      personInCharge: body.personInCharge.trim(),
      lastHeartbeat: now,
      updatedAt: now
    }
    allList[idx] = row
    detailExt[row.id] = mergeExt(body, detailExt[row.id])
    return row
  }
  const id = nextDeviceId()
  const row: DeviceInfoItem = {
    id,
    deviceId: body.deviceId?.trim() || generateDeviceCode(),
    deviceName: body.deviceName.trim(),
    archiveInfo: body.archiveInfo.trim(),
    archiveId: body.archiveId,
    deviceType: body.deviceType,
    deployLocation: body.deployLocation.trim(),
    ipAddress: body.ipAddress.trim(),
    serialNo: body.serialNo.trim(),
    personInCharge: body.personInCharge.trim(),
    lastHeartbeat: now,
    updatedAt: now
  }
  allList.unshift(row)
  detailExt[id] = mergeExt(body)
  if (!detailExt[id].deployAddress) {
    detailExt[id].deployAddress = `${row.deployLocation} · 待补充详细地址`
  }
  return row
}
