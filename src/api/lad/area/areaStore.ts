import type {
  AreaRegion,
  AreaRegionListResult,
  AreaRegionQuery,
  AreaRegionSavePayload,
  AreaRegionType,
  AreaShape
} from './types'
import {
  CLIP_PRIORITY_MAX,
  CLIP_PRIORITY_MIN,
  defaultAlarmForType,
  defaultClipPriorityForType,
  defaultColorForType
} from '@/views/Lad/Area/areaConstants'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

let shapeSeq = 0
export function nextShapeId() {
  shapeSeq += 1
  return `shape-${Date.now()}-${shapeSeq}`
}

const seed: AreaRegion[] = [
  {
    id: 'ar-10001',
    siteCode: 'L3001',
    name: '核心防护场地',
    parentId: 'ar-10002',
    parentSiteCode: 'L2001',
    parentSiteName: '反制处置区',
    regionType: 'nuclear',
    clipPriority: 90,
    alarmEnabled: true,
    color: defaultColorForType('nuclear'),
    shapes: [
      {
        id: 'shape-core',
        type: 'rect',
        color: defaultColorForType('nuclear'),
        x: 42,
        y: 42,
        width: 16,
        height: 16
      }
    ],
    createdAt: '2026-05-20 09:00:00',
    updatedAt: '2026-05-20 09:00:00'
  },
  {
    id: 'ar-10002',
    siteCode: 'L2001',
    name: '反制处置区',
    parentId: 'ar-10003',
    parentSiteCode: 'L1001',
    parentSiteName: '外围监测区',
    regionType: 'dispose',
    clipPriority: 70,
    alarmEnabled: true,
    color: defaultColorForType('dispose'),
    shapes: [
      {
        id: 'shape-dispose',
        type: 'rect',
        color: defaultColorForType('dispose'),
        x: 28,
        y: 26,
        width: 44,
        height: 48
      }
    ],
    createdAt: '2026-05-20 09:05:00',
    updatedAt: '2026-05-20 09:05:00'
  },
  {
    id: 'ar-10003',
    siteCode: 'L1001',
    name: '外围监测区',
    parentId: null,
    parentSiteCode: '',
    parentSiteName: '',
    regionType: 'warning',
    clipPriority: 40,
    alarmEnabled: true,
    color: defaultColorForType('warning'),
    shapes: [
      {
        id: 'shape-warning',
        type: 'rect',
        color: defaultColorForType('warning'),
        x: 10,
        y: 8,
        width: 80,
        height: 84
      }
    ],
    createdAt: '2026-05-20 09:10:00',
    updatedAt: '2026-05-20 09:10:00'
  },
  {
    id: 'ar-10004',
    siteCode: 'L2002',
    name: '试飞区',
    parentId: 'ar-10003',
    parentSiteCode: 'L1001',
    parentSiteName: '外围监测区',
    regionType: 'testflight',
    clipPriority: 15,
    alarmEnabled: false,
    color: defaultColorForType('testflight'),
    shapes: [
      {
        id: 'shape-flight',
        type: 'circle',
        color: defaultColorForType('testflight'),
        cx: 76,
        cy: 70,
        r: 15
      }
    ],
    createdAt: '2026-05-20 09:15:00',
    updatedAt: '2026-05-20 09:15:00'
  }
]

let allRegions = seed.map((row) => ({ ...row, shapes: cloneShapes(row.shapes) }))

function clampPriority(n: number) {
  return Math.min(CLIP_PRIORITY_MAX, Math.max(CLIP_PRIORITY_MIN, Math.round(n)))
}

function resolveRegionType(body: AreaRegionSavePayload): AreaRegionType {
  return body.regionType ?? 'other'
}

function cloneRegion(row: AreaRegion): AreaRegion {
  const parent = row.parentId ? allRegions.find((item) => item.id === row.parentId) : undefined
  return {
    ...row,
    parentSiteCode: parent?.siteCode || '',
    parentSiteName: parent?.name || '',
    shapes: cloneShapes(row.shapes)
  }
}

function descendantIds(rootId: string) {
  const ids = new Set([rootId])
  let changed = true
  while (changed) {
    changed = false
    allRegions.forEach((row) => {
      if (row.parentId && ids.has(row.parentId) && !ids.has(row.id)) {
        ids.add(row.id)
        changed = true
      }
    })
  }
  return ids
}

export function listAreaRegions() {
  return allRegions.map(cloneRegion)
}

export function queryAreaRegionList(params: AreaRegionQuery = {}): AreaRegionListResult {
  let rows = listAreaRegions()
  if (params.siteCode?.trim()) {
    const keyword = params.siteCode.trim().toLowerCase()
    rows = rows.filter((row) => row.siteCode.toLowerCase().includes(keyword))
  }
  if (params.name?.trim()) {
    const keyword = params.name.trim()
    rows = rows.filter((row) => row.name.includes(keyword))
  }
  if (params.parentId) rows = rows.filter((row) => row.parentId === params.parentId)
  if (params.rootId) {
    const ids = descendantIds(params.rootId)
    rows = rows.filter((row) => ids.has(row.id))
  }
  if (params.regionType) rows = rows.filter((row) => row.regionType === params.regionType)
  if (params.alarmEnabled !== undefined && params.alarmEnabled !== '') {
    const enabled = params.alarmEnabled === true || params.alarmEnabled === 'true'
    rows = rows.filter((row) => row.alarmEnabled === enabled)
  }
  rows.sort((a, b) => a.siteCode.localeCompare(b.siteCode))
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const start = (pageIndex - 1) * pageSize
  return { list: rows.slice(start, start + pageSize), total: rows.length }
}

export function getAreaRegion(id: string) {
  const row = allRegions.find((item) => item.id === id)
  return row ? cloneRegion(row) : null
}

export function saveAreaRegion(body: AreaRegionSavePayload): AreaRegion {
  const siteCode = body.siteCode.trim().toUpperCase()
  if (!siteCode) throw new Error('请输入场地编号')
  if (allRegions.some((row) => row.siteCode === siteCode && row.id !== body.id)) {
    throw new Error('场地编号已存在')
  }
  if (body.id && body.parentId && descendantIds(body.id).has(body.parentId)) {
    throw new Error('上级场地不能选择当前场地或其下级场地')
  }

  const regionType = resolveRegionType(body)
  const now = formatNow()
  const shapes = cloneShapes(body.shapes).map((shape) => ({
    ...shape,
    color: shape.color || body.color
  }))
  const values = {
    siteCode,
    name: body.name.trim(),
    parentId: body.parentId || null,
    regionType,
    clipPriority: clampPriority(body.clipPriority ?? defaultClipPriorityForType(regionType)),
    alarmEnabled: body.alarmEnabled ?? defaultAlarmForType(regionType),
    color: body.color,
    shapes
  }

  if (body.id) {
    const index = allRegions.findIndex((row) => row.id === body.id)
    if (index < 0) throw new Error('场地不存在')
    allRegions[index] = { ...allRegions[index], ...values, updatedAt: now }
    return cloneRegion(allRegions[index])
  }

  const max = Math.max(10000, ...allRegions.map((row) => Number(row.id.replace('ar-', '')) || 0))
  const row: AreaRegion = {
    id: `ar-${max + 1}`,
    ...values,
    parentSiteCode: '',
    parentSiteName: '',
    createdAt: now,
    updatedAt: now
  }
  allRegions.push(row)
  return cloneRegion(row)
}

export function deleteAreaRegion(id: string) {
  allRegions = allRegions
    .filter((row) => row.id !== id)
    .map((row) => (row.parentId === id ? { ...row, parentId: null } : row))
}

export function cloneShapes(shapes: AreaShape[]): AreaShape[] {
  return shapes.map((shape) => ({
    ...shape,
    points: shape.points?.map((point) => ({ ...point }))
  }))
}
