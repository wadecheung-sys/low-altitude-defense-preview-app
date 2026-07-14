import type { AreaShape } from '@/api/lad/area/types'

export type ShapeHandleKind = 'corner' | 'center' | 'radius' | 'vertex'

export interface ShapeHandle {
  index: number
  kind: ShapeHandleKind
  x: number
  y: number
}

const MIN_RECT_SIZE = 1
const MIN_CIRCLE_R = 1
const MIN_POLYGON_VERTICES = 3

function roundPercent(n: number): number {
  return Math.round(n * 10) / 10
}

function roundPoint(p: { x: number; y: number }): { x: number; y: number } {
  return { x: roundPercent(p.x), y: roundPercent(p.y) }
}

export function getShapeHandles(shape: AreaShape): ShapeHandle[] {
  if (shape.type === 'rect') {
    const x = shape.x ?? 0
    const y = shape.y ?? 0
    const w = shape.width ?? 0
    const h = shape.height ?? 0
    return [
      { index: 0, kind: 'corner', x, y },
      { index: 1, kind: 'corner', x: x + w, y },
      { index: 2, kind: 'corner', x: x + w, y: y + h },
      { index: 3, kind: 'corner', x, y: y + h }
    ]
  }

  if (shape.type === 'circle') {
    const cx = shape.cx ?? 50
    const cy = shape.cy ?? 50
    const r = shape.r ?? 1
    return [
      { index: 0, kind: 'center', x: cx, y: cy },
      { index: 1, kind: 'radius', x: cx + r, y: cy }
    ]
  }

  if (shape.type === 'polygon' && shape.points?.length) {
    return shape.points.map((p, index) => ({
      index,
      kind: 'vertex' as const,
      x: p.x,
      y: p.y
    }))
  }

  return []
}

export function translateShape(shape: AreaShape, dx: number, dy: number): AreaShape {
  if (shape.type === 'rect') {
    return {
      ...shape,
      x: roundPercent((shape.x ?? 0) + dx),
      y: roundPercent((shape.y ?? 0) + dy)
    }
  }

  if (shape.type === 'circle') {
    return {
      ...shape,
      cx: roundPercent((shape.cx ?? 50) + dx),
      cy: roundPercent((shape.cy ?? 50) + dy)
    }
  }

  if (shape.type === 'polygon' && shape.points?.length) {
    return {
      ...shape,
      points: shape.points.map((p) => ({
        x: roundPercent(p.x + dx),
        y: roundPercent(p.y + dy)
      }))
    }
  }

  return shape
}

function normalizeRect(x: number, y: number, w: number, h: number) {
  let nx = x
  let ny = y
  let nw = w
  let nh = h
  if (nw < MIN_RECT_SIZE) {
    nx = nx + nw - MIN_RECT_SIZE
    nw = MIN_RECT_SIZE
  }
  if (nh < MIN_RECT_SIZE) {
    ny = ny + nh - MIN_RECT_SIZE
    nh = MIN_RECT_SIZE
  }
  return {
    x: roundPercent(nx),
    y: roundPercent(ny),
    width: Math.round(nw * 10) / 10,
    height: Math.round(nh * 10) / 10
  }
}

function updateRectCorner(
  shape: AreaShape,
  cornerIndex: number,
  point: { x: number; y: number }
): AreaShape {
  const x = shape.x ?? 0
  const y = shape.y ?? 0
  const w = shape.width ?? 0
  const h = shape.height ?? 0
  const p = roundPoint(point)

  if (cornerIndex === 0) {
    return { ...shape, ...normalizeRect(p.x, p.y, x + w - p.x, y + h - p.y) }
  }
  if (cornerIndex === 1) {
    return { ...shape, ...normalizeRect(x, p.y, p.x - x, y + h - p.y) }
  }
  if (cornerIndex === 2) {
    return { ...shape, ...normalizeRect(x, y, p.x - x, p.y - y) }
  }
  return { ...shape, ...normalizeRect(p.x, y, x + w - p.x, p.y - y) }
}

function percentDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2)
}

export function updateShapeHandle(
  shape: AreaShape,
  handleIndex: number,
  point: { x: number; y: number }
): AreaShape {
  if (shape.type === 'rect') {
    return updateRectCorner(shape, handleIndex, point)
  }

  if (shape.type === 'circle') {
    const cx = shape.cx ?? 50
    const cy = shape.cy ?? 50
    const p = roundPoint(point)
    if (handleIndex === 0) {
      return { ...shape, cx: p.x, cy: p.y }
    }
    const r = Math.max(MIN_CIRCLE_R, Math.round(percentDistance(cx, cy, p.x, p.y) * 10) / 10)
    return { ...shape, r }
  }

  if (shape.type === 'polygon' && shape.points?.length) {
    if (handleIndex < 0 || handleIndex >= shape.points.length) return shape
    const points = shape.points.map((pt, i) => (i === handleIndex ? roundPoint(point) : pt))
    if (points.length < MIN_POLYGON_VERTICES) return shape
    return { ...shape, points }
  }

  return shape
}
