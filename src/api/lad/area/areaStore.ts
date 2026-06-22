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

/** 演示数据：各区域相互独立，仅通过 clipPriority 控制地图镂空 */
const seed: AreaRegion[] = [
  {
    id: 'ar-10001',
    name: '核心区',
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
    name: '反制处置区',
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
    name: '外围监测区',
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
    name: '试飞区',
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

let allRegions: AreaRegion[] = seed.map((r) => ({
  ...r,
  shapes: r.shapes.map((s) => ({ ...s }))
}))

function clampPriority(n: number): number {
  return Math.min(CLIP_PRIORITY_MAX, Math.max(CLIP_PRIORITY_MIN, Math.round(n)))
}

function resolveRegionType(body: AreaRegionSavePayload): AreaRegionType {
  return body.regionType ?? 'other'
}

function cloneRegion(row: AreaRegion): AreaRegion {
  return {
    ...row,
    shapes: row.shapes.map((s) => ({ ...s, points: s.points?.map((p) => ({ ...p })) }))
  }
}

export function listAreaRegions(): AreaRegion[] {
  return allRegions.map(cloneRegion)
}

export function queryAreaRegionList(params: AreaRegionQuery = {}): AreaRegionListResult {
  let rows = listAreaRegions()
  if (params.name?.trim()) {
    const kw = params.name.trim()
    rows = rows.filter((r) => r.name.includes(kw))
  }
  if (params.regionType) {
    rows = rows.filter((r) => r.regionType === params.regionType)
  }
  if (params.alarmEnabled !== undefined && params.alarmEnabled !== '') {
    const on = params.alarmEnabled === true || params.alarmEnabled === 'true'
    rows = rows.filter((r) => r.alarmEnabled === on)
  }
  rows.sort((a, b) => b.clipPriority - a.clipPriority)
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const start = (pageIndex - 1) * pageSize
  return {
    list: rows.slice(start, start + pageSize),
    total: rows.length
  }
}

export function getAreaRegion(id: string): AreaRegion | null {
  const row = allRegions.find((r) => r.id === id)
  if (!row) return null
  return {
    ...row,
    shapes: row.shapes.map((s) => ({ ...s, points: s.points?.map((p) => ({ ...p })) }))
  }
}

export function saveAreaRegion(body: AreaRegionSavePayload): AreaRegion {
  const regionType = resolveRegionType(body)
  const clipPriority = clampPriority(body.clipPriority ?? defaultClipPriorityForType(regionType))
  const alarmEnabled = body.alarmEnabled ?? defaultAlarmForType(regionType)

  const now = formatNow()
  const shapes = body.shapes.map((s) => ({
    ...s,
    color: s.color || body.color,
    points: s.points?.map((p) => ({ ...p }))
  }))

  if (body.id) {
    const idx = allRegions.findIndex((r) => r.id === body.id)
    if (idx < 0) throw new Error('区域不存在')
    const row: AreaRegion = {
      ...allRegions[idx],
      name: body.name.trim(),
      regionType,
      clipPriority,
      alarmEnabled,
      color: body.color,
      shapes,
      createdAt: allRegions[idx].createdAt || allRegions[idx].updatedAt,
      updatedAt: now
    }
    allRegions[idx] = row
    return { ...row, shapes: shapes.map((s) => ({ ...s })) }
  }

  const nums = allRegions
    .map((r) => parseInt(r.id.replace(/^ar-/, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 10000
  const id = `ar-${max + 1}`
  const row: AreaRegion = {
    id,
    name: body.name.trim(),
    regionType,
    clipPriority,
    alarmEnabled,
    color: body.color,
    shapes,
    createdAt: now,
    updatedAt: now
  }
  allRegions.push(row)
  return { ...row, shapes: shapes.map((s) => ({ ...s })) }
}

export function deleteAreaRegion(id: string) {
  allRegions = allRegions.filter((r) => r.id !== id)
}

export function cloneShapes(shapes: AreaShape[]): AreaShape[] {
  return shapes.map((s) => ({
    ...s,
    points: s.points?.map((p) => ({ ...p }))
  }))
}
