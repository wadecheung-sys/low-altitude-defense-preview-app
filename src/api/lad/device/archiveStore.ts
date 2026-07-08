/**
 * 设备档案内存数据（列表 / 详情 / Mock 共用）
 */
import {
  ALL_CATALOG_DEVICES,
  catalogCategoryFromDeviceType,
  type DeviceCatalogEntry
} from '@/constants/deviceCatalog'
import type {
  DeviceArchiveCategory,
  DeviceArchiveDetail,
  DeviceArchiveIndicator,
  DeviceArchiveItem,
  DeviceArchiveListResult,
  DeviceArchiveQuery,
  DeviceArchiveSavePayload
} from './types'

export const DEVICE_ARCHIVE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <text x="160" y="120" fill="#94a3b8" font-size="14" text-anchor="middle">档案图像</text>
    </svg>`
  )

const categoryPrefixes: Record<Exclude<DeviceArchiveCategory, 'all'>, string> = {
  radar: 'D-LAD-RAD',
  radio: 'D-LAD-RF',
  counter: 'D-LAD-CM',
  eo: 'D-LAD-EO'
}

const CAMERA_ARCHIVE: Omit<DeviceArchiveItem, 'id'> = {
  archiveNo: 'D-LAD-CAM0001',
  archiveName: '固定监控摄像头档案',
  deviceType: '监控摄像头',
  vendor: '通用',
  deviceModel: 'IPC-通用',
  enabled: true,
  category: 'eo',
  updatedAt: '2026-03-16 11:10:00'
}

function buildIndicators(entry: DeviceCatalogEntry, archiveId: string): DeviceArchiveIndicator[] {
  return entry.indicators.map((indicator, index) => ({
    ...indicator,
    id: `${archiveId}-${index + 1}`,
    config: indicator.config ? { ...indicator.config } : undefined
  }))
}

function catalogToArchiveRow(entry: DeviceCatalogEntry, id: string): DeviceArchiveItem {
  return {
    id,
    archiveNo: entry.archiveNo,
    archiveName: entry.archiveName,
    deviceType: entry.deviceType,
    vendor: entry.vendor,
    deviceModel: entry.model,
    enabled: entry.tier !== 'pending',
    category: catalogCategoryFromDeviceType(entry.deviceType),
    updatedAt: '2026-03-18 10:20:00'
  }
}

const catalogArchiveIds = [
  'da-10001',
  'da-10002',
  'da-10003',
  'da-10004',
  'da-10005',
  'da-10006',
  'da-10007',
  'da-10008',
  'da-10009'
]

const detailExt: Record<
  string,
  { remark: string; imageUrl: string | null; indicators: DeviceArchiveIndicator[] }
> = {}

ALL_CATALOG_DEVICES.forEach((entry, index) => {
  const id = catalogArchiveIds[index]!
  detailExt[id] = {
    remark:
      entry.tier === 'pending'
        ? `${entry.deviceType}（${entry.model}）档案，技术参数待完善。`
        : `${entry.deviceType}（${entry.model}）档案，指标摘自产品说明书。`,
    imageUrl: DEVICE_ARCHIVE_PLACEHOLDER,
    indicators: buildIndicators(entry, id)
  }
})

detailExt['da-10010'] = {
  remark: '周边监控摄像头通用档案。',
  imageUrl: DEVICE_ARCHIVE_PLACEHOLDER,
  indicators: [
    {
      id: 'da-10010-1',
      item: '分辨率',
      unit: '',
      dataType: 'text',
      config: { maxLength: 32 },
      value: '1080P'
    }
  ]
}

let allList: DeviceArchiveItem[] = [
  ...ALL_CATALOG_DEVICES.map((entry, index) => catalogToArchiveRow(entry, catalogArchiveIds[index]!)),
  { ...CAMERA_ARCHIVE, id: 'da-10010' }
]

function filterList(params: DeviceArchiveQuery): DeviceArchiveItem[] {
  let rows = [...allList]
  const cat = params.category
  if (cat && cat !== 'all') {
    rows = rows.filter((r) => r.category === cat)
  }
  if (params.archiveNo?.trim()) {
    const kw = params.archiveNo.trim().toLowerCase()
    rows = rows.filter((r) => r.archiveNo.toLowerCase().includes(kw))
  }
  if (params.archiveName?.trim()) {
    const kw = params.archiveName.trim().toLowerCase()
    rows = rows.filter((r) => r.archiveName.toLowerCase().includes(kw))
  }
  if (params.deviceType) {
    rows = rows.filter((r) => r.deviceType === params.deviceType)
  }
  if (params.vendor) {
    rows = rows.filter((r) => r.vendor === params.vendor)
  }
  if (params.deviceModel?.trim()) {
    const kw = params.deviceModel.trim().toLowerCase()
    rows = rows.filter((r) => r.deviceModel.toLowerCase().includes(kw))
  }
  if (params.status === 'enabled') {
    rows = rows.filter((r) => r.enabled)
  } else if (params.status === 'disabled') {
    rows = rows.filter((r) => !r.enabled)
  }
  return rows
}

export function buildDeviceArchiveDetail(row: DeviceArchiveItem): DeviceArchiveDetail {
  const ext = detailExt[row.id] ?? {
    remark: `${row.deviceType}档案，供部署、联动与维护使用。`,
    imageUrl: DEVICE_ARCHIVE_PLACEHOLDER,
    indicators: []
  }
  if (!detailExt[row.id]) {
    detailExt[row.id] = {
      remark: ext.remark,
      imageUrl: ext.imageUrl,
      indicators: ext.indicators.map((i) => ({ ...i }))
    }
  }
  const cur = detailExt[row.id]!
  return {
    ...row,
    remark: cur.remark,
    imageUrl: cur.imageUrl,
    indicators: cur.indicators.map((i) => ({ ...i }))
  }
}

export function queryDeviceArchiveList(params: DeviceArchiveQuery): DeviceArchiveListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const filtered = filterList(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length
  }
}

export function queryDeviceArchiveDetail(id: string): DeviceArchiveDetail | null {
  const row = allList.find((r) => r.id === id)
  if (!row) return null
  return buildDeviceArchiveDetail(row)
}

export function deleteDeviceArchiveRecords(ids: string[]) {
  const set = new Set(ids)
  allList = allList.filter((r) => !set.has(r.id))
  ids.forEach((id) => delete detailExt[id])
}

export function setDeviceArchiveRecordsEnabled(ids: string[], enabled: boolean) {
  const set = new Set(ids)
  allList.forEach((r) => {
    if (set.has(r.id)) r.enabled = enabled
  })
}

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function categoryFromDeviceType(deviceType: string): Exclude<DeviceArchiveCategory, 'all'> {
  return catalogCategoryFromDeviceType(deviceType)
}

function nextArchiveId() {
  const nums = allList
    .map((r) => parseInt(r.id.replace(/^da-/, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 10000
  return `da-${max + 1}`
}

function generateArchiveNo(category: Exclude<DeviceArchiveCategory, 'all'>) {
  const prefix = categoryPrefixes[category]
  const seq = allList.filter((r) => r.archiveNo.startsWith(prefix)).length + 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

export function saveDeviceArchiveRecord(body: DeviceArchiveSavePayload): DeviceArchiveItem {
  const now = formatNow()
  const category = body.category ?? categoryFromDeviceType(body.deviceType)

  if (body.id) {
    const idx = allList.findIndex((r) => r.id === body.id)
    if (idx < 0) throw new Error('档案不存在')
    const row: DeviceArchiveItem = {
      ...allList[idx],
      archiveName: body.archiveName,
      deviceType: body.deviceType,
      vendor: body.vendor,
      deviceModel: body.deviceModel,
      enabled: body.enabled,
      category,
      updatedAt: now
    }
    allList[idx] = row
    detailExt[row.id] = {
      remark: body.remark ?? '',
      imageUrl: body.imageUrl ?? detailExt[row.id]?.imageUrl ?? DEVICE_ARCHIVE_PLACEHOLDER,
      indicators: body.indicators.map((i) => ({ ...i }))
    }
    return row
  }

  const id = nextArchiveId()
  const row: DeviceArchiveItem = {
    id,
    archiveNo: body.archiveNo?.trim() || generateArchiveNo(category),
    archiveName: body.archiveName,
    deviceType: body.deviceType,
    vendor: body.vendor,
    deviceModel: body.deviceModel,
    enabled: body.enabled ?? true,
    category,
    updatedAt: now
  }
  allList.unshift(row)
  detailExt[id] = {
    remark: body.remark ?? '',
    imageUrl: body.imageUrl ?? DEVICE_ARCHIVE_PLACEHOLDER,
    indicators: body.indicators.map((i) => ({ ...i }))
  }
  return row
}

/** 型号 → 档案 ID（与 ALL_CATALOG_DEVICES 顺序一致，避免双维护错位） */
export const DEVICE_ARCHIVE_ID_BY_MODEL: Record<string, string> = Object.fromEntries(
  ALL_CATALOG_DEVICES.map((entry, index) => [entry.model, catalogArchiveIds[index]!])
)

export const DEVICE_CAMERA_ARCHIVE_ID = 'da-10010'
