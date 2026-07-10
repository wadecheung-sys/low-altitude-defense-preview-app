/**
 * 设备档案内存数据（列表 / 详情 / Mock 共用）
 */
import {
  ALL_CATALOG_DEVICES,
  catalogCategoryFromDeviceType,
  INTERNAL_PLACEHOLDER_DEVICES
} from '@/constants/deviceCatalog'
import type { DeviceCatalogEntry } from '@/constants/deviceCatalog'
import type {
  DeviceArchiveCategory,
  DeviceArchiveConfigurableItem,
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
  eo: 'D-LAD-EO',
  camera: 'D-LAD-CAM'
}

interface CameraArchiveSeed {
  id: string
  row: Omit<DeviceArchiveItem, 'id'>
  detail: {
    remark: string
    specifications: Omit<DeviceArchiveIndicator, 'id'>[]
    configurableItems?: DeviceArchiveConfigurableItem[]
  }
}

const CAMERA_ARCHIVE_SEEDS: CameraArchiveSeed[] = [
  {
    id: 'da-10010',
    row: {
      archiveNo: 'D-LAD-CAM0001',
      archiveName: '400万星光筒型网络摄像机档案',
      deviceType: '监控摄像机',
      vendor: '海康威视',
      deviceModel: 'DS-2CD3T46WDV3-I3',
      enabled: true,
      category: 'camera',
      updatedAt: '2026-03-16 11:10:00'
    },
    detail: {
      remark: '海康威视筒型网络摄像机，适用于围墙、制高点等固定监控点位。',
      specifications: [
        { item: '分辨率', unit: '', value: '400万像素' },
        { item: '最低照度', unit: 'Lux', value: '0.005（星光级）' },
        { item: '红外补光距离', unit: 'm', value: '80' },
        { item: '防护等级', unit: '', value: 'IP67' },
        { item: '编码协议', unit: '', value: 'H.265 / H.264' }
      ]
    }
  },
  {
    id: 'da-10012',
    row: {
      archiveNo: 'D-LAD-CAM0002',
      archiveName: '800万红外枪型网络摄像机档案',
      deviceType: '监控摄像机',
      vendor: '大华',
      deviceModel: 'DH-IPC-HFW5831E-Z',
      enabled: true,
      category: 'camera',
      updatedAt: '2026-03-16 11:20:00'
    },
    detail: {
      remark: '大华枪型网络摄像机，适用于开阔区域、机房外围等中远距离监控。',
      specifications: [
        { item: '分辨率', unit: '', value: '800万像素' },
        { item: '镜头焦距', unit: 'mm', value: '2.7-13.5（电动变焦）' },
        { item: '红外补光距离', unit: 'm', value: '100' },
        { item: '防护等级', unit: '', value: 'IP67' },
        { item: '宽动态', unit: '', value: '120dB' }
      ]
    }
  },
  {
    id: 'da-10013',
    row: {
      archiveNo: 'D-LAD-CAM0003',
      archiveName: '200万高速云台球机档案',
      deviceType: '监控摄像机',
      vendor: '海康威视',
      deviceModel: 'DS-2DE4423IW-DE',
      enabled: true,
      category: 'camera',
      updatedAt: '2026-03-16 11:30:00'
    },
    detail: {
      remark: '海康威视云台球机，适用于门岗、广场等需要云台巡航与联动跟踪的点位。',
      specifications: [
        { item: '分辨率', unit: '', value: '200万像素' },
        { item: '光学变倍', unit: '倍', value: '23' },
        { item: '水平转速', unit: '°/s', value: '0.1-120' },
        { item: '红外补光距离', unit: 'm', value: '150' },
        { item: '防护等级', unit: '', value: 'IP66' }
      ],
      configurableItems: [
        {
          id: 'da-10013-cfg-1',
          key: 'preset_count',
          label: '预置位数量',
          unit: '个',
          scope: 'device',
          hint: '1~256',
          defaultValue: '16'
        }
      ]
    }
  },
  {
    id: 'da-10014',
    row: {
      archiveNo: 'D-LAD-CAM0004',
      archiveName: '400万全景广角摄像机档案',
      deviceType: '监控摄像机',
      vendor: '大华',
      deviceModel: 'DH-IPC-PFW3849-AS',
      enabled: true,
      category: 'camera',
      updatedAt: '2026-03-16 11:40:00'
    },
    detail: {
      remark: '大华全景广角摄像机，适用于门岗、通道等需要大范围覆盖的固定点位。',
      specifications: [
        { item: '分辨率', unit: '', value: '400万像素' },
        { item: '水平视场角', unit: '°', value: '180' },
        { item: '最低照度', unit: 'Lux', value: '0.01' },
        { item: '防护等级', unit: '', value: 'IP67' },
        { item: '音频输入', unit: '', value: '支持' }
      ]
    }
  }
]

function buildSpecifications(
  entry: DeviceCatalogEntry,
  archiveId: string
): DeviceArchiveIndicator[] {
  return entry.specifications.map((indicator, index) => ({
    ...indicator,
    id: `${archiveId}-spec-${index + 1}`
  }))
}

function buildConfigurableItems(
  entry: DeviceCatalogEntry,
  archiveId: string
): DeviceArchiveConfigurableItem[] {
  return entry.configurableItems.map((item, index) => ({
    ...item,
    id: `${archiveId}-cfg-${index + 1}`
  }))
}

function buildArchiveDetailExt(entry: DeviceCatalogEntry, archiveId: string) {
  return {
    remark:
      entry.tier === 'pending'
        ? `${entry.deviceType}（${entry.model}）档案，技术参数待完善。`
        : `${entry.deviceType}（${entry.model}）档案，规格摘自产品说明书。`,
    imageUrl: DEVICE_ARCHIVE_PLACEHOLDER,
    specifications: buildSpecifications(entry, archiveId),
    configurableItems: buildConfigurableItems(entry, archiveId)
  }
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
  {
    remark: string
    imageUrl: string | null
    specifications: DeviceArchiveIndicator[]
    configurableItems: DeviceArchiveConfigurableItem[]
  }
> = {}

ALL_CATALOG_DEVICES.forEach((entry, index) => {
  const id = catalogArchiveIds[index]!
  detailExt[id] = buildArchiveDetailExt(entry, id)
})

const slaCatalogEntry = INTERNAL_PLACEHOLDER_DEVICES.find((entry) => entry.model === 'TBD-SLA')
if (slaCatalogEntry) {
  detailExt['da-10011'] = buildArchiveDetailExt(slaCatalogEntry, 'da-10011')
}

CAMERA_ARCHIVE_SEEDS.forEach((seed) => {
  detailExt[seed.id] = {
    remark: seed.detail.remark,
    imageUrl: DEVICE_ARCHIVE_PLACEHOLDER,
    specifications: seed.detail.specifications.map((item, index) => ({
      ...item,
      id: `${seed.id}-spec-${index + 1}`
    })),
    configurableItems: seed.detail.configurableItems ?? []
  }
})

let allList: DeviceArchiveItem[] = [
  ...ALL_CATALOG_DEVICES.map((entry, index) =>
    catalogToArchiveRow(entry, catalogArchiveIds[index]!)
  ),
  ...(slaCatalogEntry ? [catalogToArchiveRow(slaCatalogEntry, 'da-10011')] : []),
  ...CAMERA_ARCHIVE_SEEDS.map((seed) => ({ ...seed.row, id: seed.id }))
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
    specifications: [],
    configurableItems: []
  }
  if (!detailExt[row.id]) {
    detailExt[row.id] = {
      remark: ext.remark,
      imageUrl: ext.imageUrl,
      specifications: ext.specifications.map((i) => ({ ...i })),
      configurableItems: ext.configurableItems.map((i) => ({ ...i }))
    }
  }
  const cur = detailExt[row.id]!
  return {
    ...row,
    remark: cur.remark,
    imageUrl: cur.imageUrl,
    specifications: cur.specifications.map((i) => ({ ...i })),
    configurableItems: cur.configurableItems.map((i) => ({ ...i }))
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
      specifications: body.specifications.map((i) => ({ ...i })),
      configurableItems: detailExt[row.id]?.configurableItems.map((i) => ({ ...i })) ?? []
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
    specifications: body.specifications.map((i) => ({ ...i })),
    configurableItems: []
  }
  return row
}

/** 型号 → 档案 ID（与 ALL_CATALOG_DEVICES 顺序一致，避免双维护错位） */
export const DEVICE_ARCHIVE_ID_BY_MODEL: Record<string, string> = {
  ...Object.fromEntries(
    ALL_CATALOG_DEVICES.map((entry, index) => [entry.model, catalogArchiveIds[index]!])
  ),
  'TBD-SLA': 'da-10011',
  'DS-2CD3T46WDV3-I3': 'da-10010',
  'DH-IPC-HFW5831E-Z': 'da-10012',
  'DS-2DE4423IW-DE': 'da-10013',
  'DH-IPC-PFW3849-AS': 'da-10014'
}

/** 默认监控摄像机档案（筒型枪机） */
export const DEVICE_CAMERA_ARCHIVE_ID = 'da-10010'

export const CAMERA_ARCHIVE_IDS = CAMERA_ARCHIVE_SEEDS.map((seed) => seed.id)
