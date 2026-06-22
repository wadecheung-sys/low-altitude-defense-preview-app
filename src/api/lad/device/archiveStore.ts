/**
 * 设备档案内存数据（列表 / 详情 / Mock 共用）
 */
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

const vendors = ['同方威视']
const models = [
  'LAD-RADAR-X2',
  'LAD-RF-SCAN',
  'LAD-JAM-A1',
  'LAD-SPOOF-G2',
  'LAD-LSR-Z3',
  'LAD-EO-360'
]

const detailExt: Record<
  string,
  { remark: string; imageUrl: string | null; indicators: DeviceArchiveIndicator[] }
> = {}

function defaultIndicators(id: string, deviceType: string): DeviceArchiveIndicator[] {
  return [
    {
      id: `${id}-1`,
      item: '设备重量',
      unit: 'kg',
      dataType: 'number',
      config: { integerDigits: 3, decimalPlaces: 1 },
      value: deviceType === '雷达' ? '55' : deviceType === '高功率微波' ? '86' : '42'
    },
    {
      id: `${id}-2`,
      item: '额定电压',
      unit: 'V',
      dataType: 'number',
      config: { integerDigits: 3, decimalPlaces: 0 },
      value: '220'
    },
    {
      id: `${id}-3`,
      item: '工作频段',
      unit: 'GHz',
      dataType: 'text',
      config: { maxLength: 32 },
      value: '2.4 / 5.8'
    }
  ]
}

const seedRows: Omit<DeviceArchiveItem, 'id'>[] = [
  {
    archiveNo: 'D-LAD-RAD0001',
    archiveName: '北区低空监视雷达档案',
    deviceType: '雷达',
    vendor: '同方威视',
    deviceModel: 'LAD-RADAR-X2',
    enabled: true,
    category: 'radar',
    updatedAt: '2026-03-18 10:20:00'
  },
  {
    archiveNo: 'D-LAD-RF0001',
    archiveName: '东侧无线电侦测站档案',
    deviceType: '无线电侦测',
    vendor: '同方威视',
    deviceModel: 'LAD-RF-SCAN',
    enabled: true,
    category: 'radio',
    updatedAt: '2026-03-17 15:40:00'
  },
  {
    archiveNo: 'D-LAD-EO0001',
    archiveName: '南门光电跟踪转台档案',
    deviceType: '光电跟踪',
    vendor: '同方威视',
    deviceModel: 'LAD-EO-360',
    enabled: true,
    category: 'eo',
    updatedAt: '2026-03-16 11:10:00'
  },
  {
    archiveNo: 'D-LAD-CM0001',
    archiveName: '核心区无线电干扰设备档案',
    deviceType: '无线电干扰',
    vendor: '同方威视',
    deviceModel: 'LAD-JAM-A1',
    enabled: true,
    category: 'counter',
    updatedAt: '2026-03-16 09:40:00'
  },
  {
    archiveNo: 'D-LAD-CM0002',
    archiveName: '西区导航诱骗设备档案',
    deviceType: '导航诱骗',
    vendor: '同方威视',
    deviceModel: 'LAD-SPOOF-G2',
    enabled: true,
    category: 'counter',
    updatedAt: '2026-03-17 15:40:00'
  }
]

let allList: DeviceArchiveItem[] = [
  ...seedRows.map((r, i) => ({
    ...r,
    id: `da-${10001 + i}`
  })),
  ...Array.from({ length: 30 }, (_, i) => {
    const typePool = [
      '雷达',
      '无线电侦测',
      '无线电干扰',
      '导航诱骗',
      '激光打击',
      '高功率微波',
      '光电跟踪'
    ]
    const deviceType = typePool[i % typePool.length]
    const cat = categoryFromDeviceType(deviceType)
    const seq = String(i + 3).padStart(4, '0')
    const day = String(10 + (i % 18)).padStart(2, '0')
    return {
      id: `da-${10006 + i}`,
      archiveNo: `${categoryPrefixes[cat]}${seq}`,
      archiveName: `${vendors[i % vendors.length]}-${deviceType}${seq}档案`,
      deviceType,
      vendor: vendors[i % vendors.length],
      deviceModel: models[i % models.length],
      enabled: i % 4 !== 1,
      category: cat,
      updatedAt: `2026-03-${day} ${String(9 + (i % 8)).padStart(2, '0')}:30:00`
    }
  })
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
    remark: `${row.deviceType}档案，供部署、联动与维护演示使用。`,
    imageUrl: DEVICE_ARCHIVE_PLACEHOLDER,
    indicators: defaultIndicators(row.id, row.deviceType)
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
  if (deviceType === '雷达') return 'radar'
  if (deviceType === '无线电侦测') return 'radio'
  if (deviceType === '光电跟踪') return 'eo'
  return 'counter'
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
