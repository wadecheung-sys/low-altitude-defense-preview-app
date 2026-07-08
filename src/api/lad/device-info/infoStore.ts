import { deviceSupportsSelfCheck, runDeviceSelfCheck } from './deviceSelfCheck'
import type { DeviceSelfCheckResult } from './deviceSelfCheck'
import {
  DEVICE_ARCHIVE_ID_BY_MODEL,
  DEVICE_CAMERA_ARCHIVE_ID,
  queryDeviceArchiveDetail
} from '../device/archiveStore'
import { CONFIRMED_DEVICES, PENDING_DEVICES } from '@/constants/deviceCatalog'
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
  archiveIndicatorValues: Record<string, string>
}

const DEFAULT_EXT: DeviceInfoExt = {
  remark: '',
  imageUrl: '',
  deployAddress: '',
  longitude: 116.397128,
  latitude: 39.916527,
  mapX: 50,
  mapY: 50,
  deviceIcon: 'jammer',
  controlRangeM: 500,
  contactPhone: '',
  extendedFields: [],
  archiveIndicatorValues: {}
}

let extendSeq = 0
function nextExtendId() {
  extendSeq += 1
  return `ext-${Date.now()}-${extendSeq}`
}

function resolveCatalogVendor(row: DeviceInfoItem): string {
  const entry =
    CONFIRMED_DEVICES.find((d) => d.demo.deviceId === row.deviceId) ??
    PENDING_DEVICES.find((d) => d.demo.deviceId === row.deviceId)
  if (entry) return entry.vendor
  if (row.deviceType === '监控摄像头') return '通用'
  return '凡双科技'
}

function defaultExtendedFields(row: DeviceInfoItem, index: number): DeviceExtendedField[] {
  const acquisitionMethods = ['采购', '赠予', '置换', '赔偿', '其他'] as const
  const vendor = resolveCatalogVendor(row)
  const contacts = ['张工', '李工', '王工', '赵工', '周工']
  const years = ['2023-03-15', '2023-07-20', '2024-01-12', '2024-04-08', '2024-09-18']
  return [
    { id: nextExtendId(), label: '部署区域', value: row.deployLocation },
    { id: nextExtendId(), label: '设备IP', value: row.ipAddress },
    {
      id: nextExtendId(),
      label: '增加方式',
      value: acquisitionMethods[index % acquisitionMethods.length]
    },
    { id: nextExtendId(), label: '生产日期', value: years[index % years.length] },
    { id: nextExtendId(), label: '出厂日期', value: years[(index + 1) % years.length] },
    { id: nextExtendId(), label: '启用日期', value: years[(index + 2) % years.length] },
    { id: nextExtendId(), label: '使用年限（月）', value: String(12 + index * 6) },
    { id: nextExtendId(), label: '保管机构', value: '低空防御保障中心' },
    { id: nextExtendId(), label: '保管人', value: row.personInCharge },
    { id: nextExtendId(), label: '保管人电话', value: `138${String(10000000 + index).slice(-8)}` },
    { id: nextExtendId(), label: '供应商', value: vendor },
    { id: nextExtendId(), label: '供应商联系人', value: contacts[index % contacts.length] },
    {
      id: nextExtendId(),
      label: '供应商联系人电话',
      value: `139${String(20000000 + index).slice(-8)}`
    },
    { id: nextExtendId(), label: '软件版本', value: `V2.${(index % 5) + 1}.0` }
  ]
}

function resolveLinkedArchive(
  archiveId?: string,
  indicatorValues: Record<string, string> = {}
): DeviceLinkedArchive | null {
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
    indicators: arch.indicators.map((indicator) => ({
      ...indicator,
      config: indicator.config
        ? {
            ...indicator.config,
            options: indicator.config.options ? [...indicator.config.options] : undefined
          }
        : undefined,
      value: Object.prototype.hasOwnProperty.call(indicatorValues, indicator.id)
        ? indicatorValues[indicator.id]!
        : indicator.value
    }))
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
    imageUrl: '',
    deployAddress: `${row.deployLocation} · 园区坐标已标绘`,
    longitude: o.lng,
    latitude: o.lat,
    mapX: o.mapX,
    mapY: o.mapY,
    deviceIcon: row.deviceType.includes('雷达') || row.deviceType.includes('Remote-ID')
      ? 'radar'
      : row.deviceType.includes('光电')
        ? 'eo'
        : row.deviceType.includes('ADS-B')
          ? 'radar'
          : row.deviceType.includes('干扰')
            ? 'jammer'
            : 'counter',
    controlRangeM:
      row.deviceType === '雷达'
        ? 800
        : row.deviceType === 'Remote-ID 监视'
          ? 2500
          : row.deviceType === 'ADS-B 监视'
            ? 50000
            : row.deviceType === '无线电侦测'
              ? 5000
              : row.deviceType === '无线电干扰'
                ? 3000
                : row.deviceType === '导航诱骗'
                  ? 800
                  : row.deviceType === '高功率微波'
                    ? 1200
                    : row.deviceType === '光电跟踪'
                      ? 600
                      : 500,
    contactPhone: `138${String(10000000 + index).slice(-8)}`,
    extendedFields: [],
    archiveIndicatorValues: {}
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
    imageUrl: body.imageUrl ?? prev?.imageUrl ?? '',
    deployAddress: body.deployAddress?.trim() ?? prev?.deployAddress ?? '',
    longitude: body.longitude ?? prev?.longitude ?? DEFAULT_EXT.longitude,
    latitude: body.latitude ?? prev?.latitude ?? DEFAULT_EXT.latitude,
    mapX: body.mapX ?? prev?.mapX ?? DEFAULT_EXT.mapX,
    mapY: body.mapY ?? prev?.mapY ?? DEFAULT_EXT.mapY,
    deviceIcon: body.deviceIcon?.trim() || prev?.deviceIcon || DEFAULT_EXT.deviceIcon,
    controlRangeM: Number(body.controlRangeM ?? prev?.controlRangeM ?? DEFAULT_EXT.controlRangeM),
    contactPhone: body.contactPhone?.trim() ?? prev?.contactPhone ?? '',
    extendedFields,
    archiveIndicatorValues: body.archiveIndicatorValues
      ? { ...body.archiveIndicatorValues }
      : { ...(prev?.archiveIndicatorValues || {}) }
  }
}

function catalogSeedRow(
  model: string,
  overrides?: Partial<Omit<DeviceInfoItem, 'id'>>
): Omit<DeviceInfoItem, 'id'> {
  const entry =
    CONFIRMED_DEVICES.find((d) => d.model === model) ??
    PENDING_DEVICES.find((d) => d.model === model)
  if (!entry) throw new Error(`Unknown catalog model: ${model}`)
  const archiveId = DEVICE_ARCHIVE_ID_BY_MODEL[model]
  return {
    deviceId: entry.demo.deviceId,
    deviceName: entry.demo.deviceName,
    archiveInfo: entry.archiveName,
    archiveId,
    deviceType: entry.deviceType,
    deployLocation: entry.demo.deployLocation,
    ipAddress: entry.demo.ipAddress,
    serialNo: entry.demo.serialNo,
    lastHeartbeat: '2026-05-20 14:32:18',
    personInCharge: entry.demo.personInCharge,
    updatedAt: '2026-05-20 14:32:18',
    ...overrides
  }
}

const seedRows: Omit<DeviceInfoItem, 'id'>[] = [
  catalogSeedRow('FG310F'),
  catalogSeedRow('PL671F', { lastHeartbeat: '2026-05-20 14:28:05', updatedAt: '2026-05-20 14:28:05' }),
  catalogSeedRow('TBD-EO', { lastHeartbeat: '2026-05-20 13:55:40', updatedAt: '2026-05-20 13:55:40' }),
  catalogSeedRow('DY506F', { lastHeartbeat: '2026-05-20 12:10:22', updatedAt: '2026-05-20 12:10:22' }),
  catalogSeedRow('RDS200', { lastHeartbeat: '2026-05-20 14:30:00', updatedAt: '2026-05-20 14:30:00' }),
  catalogSeedRow('EXD55-LS', { lastHeartbeat: '2026-05-20 11:20:00', updatedAt: '2026-05-20 11:20:00' }),
  catalogSeedRow('TBD-RAD', { lastHeartbeat: '2026-05-20 10:00:00', updatedAt: '2026-05-20 10:00:00' }),
  catalogSeedRow('TBD-LSR', { lastHeartbeat: '2026-05-20 10:00:00', updatedAt: '2026-05-20 10:00:00' }),
  catalogSeedRow('TBD-HPM', { lastHeartbeat: '2026-05-20 10:00:00', updatedAt: '2026-05-20 10:00:00' })
]

/** 设备组演示：主设备周边监控摄像头 */
const peripheralCameraSeedRows: Omit<DeviceInfoItem, 'id'>[] = [
  {
    deviceId: 'CAM-N-E01',
    deviceName: 'FG310F压制-东向监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '核心区制高点',
    ipAddress: '192.168.1.101',
    serialNo: 'CAM-2025-N01',
    lastHeartbeat: '2026-05-20 14:32:18',
    personInCharge: '张工',
    updatedAt: '2026-05-20 14:32:18'
  },
  {
    deviceId: 'CAM-N-S01',
    deviceName: 'FG310F压制-南向监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '核心区制高点',
    ipAddress: '192.168.1.102',
    serialNo: 'CAM-2025-N02',
    lastHeartbeat: '2026-05-20 14:32:18',
    personInCharge: '张工',
    updatedAt: '2026-05-20 14:32:18'
  },
  {
    deviceId: 'CAM-N-W01',
    deviceName: 'FG310F压制-西向监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '核心区制高点',
    ipAddress: '192.168.1.103',
    serialNo: 'CAM-2025-N03',
    lastHeartbeat: '2026-05-20 14:32:18',
    personInCharge: '张工',
    updatedAt: '2026-05-20 14:32:18'
  },
  {
    deviceId: 'CAM-R-N01',
    deviceName: 'PL671F侦测-北侧监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '东侧瞭望台',
    ipAddress: '192.168.1.201',
    serialNo: 'CAM-2025-R01',
    lastHeartbeat: '2026-05-20 14:28:05',
    personInCharge: '周工',
    updatedAt: '2026-05-20 14:28:05'
  },
  {
    deviceId: 'CAM-R-S01',
    deviceName: 'PL671F侦测-南侧监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '东侧瞭望台',
    ipAddress: '192.168.1.202',
    serialNo: 'CAM-2025-R02',
    lastHeartbeat: '2026-05-20 14:28:05',
    personInCharge: '周工',
    updatedAt: '2026-05-20 14:28:05'
  },
  {
    deviceId: 'CAM-EO-E01',
    deviceName: '光电跟踪-东侧监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '南门岗哨',
    ipAddress: '192.168.2.101',
    serialNo: 'CAM-2025-E01',
    lastHeartbeat: '2026-05-20 13:55:40',
    personInCharge: '王工',
    updatedAt: '2026-05-20 13:55:40'
  },
  {
    deviceId: 'CAM-EO-W01',
    deviceName: '光电跟踪-西侧监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '南门岗哨',
    ipAddress: '192.168.2.102',
    serialNo: 'CAM-2025-E02',
    lastHeartbeat: '2026-05-20 13:55:40',
    personInCharge: '王工',
    updatedAt: '2026-05-20 13:55:40'
  },
  {
    deviceId: 'CAM-EO-G01',
    deviceName: '光电跟踪-岗哨全景监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '南门岗哨',
    ipAddress: '192.168.2.103',
    serialNo: 'CAM-2025-E03',
    lastHeartbeat: '2026-05-20 13:55:40',
    personInCharge: '王工',
    updatedAt: '2026-05-20 13:55:40'
  },
  {
    deviceId: 'CAM-W-N01',
    deviceName: 'DY506F诱骗-机房入口监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '西区机房',
    ipAddress: '192.168.3.101',
    serialNo: 'CAM-2025-W01',
    lastHeartbeat: '2026-05-20 12:10:22',
    personInCharge: '赵工',
    updatedAt: '2026-05-20 12:10:22'
  },
  {
    deviceId: 'CAM-W-O01',
    deviceName: 'DY506F诱骗-外围监控',
    archiveInfo: '固定监控摄像头档案',
    archiveId: DEVICE_CAMERA_ARCHIVE_ID,
    deviceType: '监控摄像头',
    deployLocation: '西区机房',
    ipAddress: '192.168.3.102',
    serialNo: 'CAM-2025-W02',
    lastHeartbeat: '2026-05-20 12:10:22',
    personInCharge: '赵工',
    updatedAt: '2026-05-20 12:10:22'
  }
]

let allList: DeviceInfoItem[] = [
  ...seedRows.map((r, i) => ({ ...r, id: `di-${10001 + i}` })),
  ...peripheralCameraSeedRows.map((r, i) => ({ ...r, id: `di-${20001 + i}` }))
]

// 初始化扩展部署信息与扩展字段
allList.forEach((row, i) => {
  if (!detailExt[row.id]) {
    detailExt[row.id] = {
      ...defaultExtForRow(row, i),
      extendedFields: defaultExtendedFields(row, i)
    }
  } else   if (!detailExt[row.id]!.extendedFields?.length) {
    detailExt[row.id]!.extendedFields = defaultExtendedFields(row, i)
  }
  if (!row.archiveId) {
    const modelEntry =
      CONFIRMED_DEVICES.find((d) => d.demo.deviceId === row.deviceId) ??
      PENDING_DEVICES.find((d) => d.demo.deviceId === row.deviceId)
    if (modelEntry) {
      row.archiveId = DEVICE_ARCHIVE_ID_BY_MODEL[modelEntry.model]
    }
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
    linkedArchive: resolveLinkedArchive(row.archiveId, ext.archiveIndicatorValues),
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
