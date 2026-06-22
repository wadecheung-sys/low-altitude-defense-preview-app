import type { AreaRegionType, AreaShape } from '@/api/lad/area/types'

export interface RegionShapeRef {
  regionId: string
  regionType: AreaRegionType
  clipPriority: number
  color: string
  shapes: AreaShape[]
}

/** 画布绘制单元：外轮廓 + 需镂空的低优先级重叠图形 */
export interface AreaPaintItem {
  key: string
  regionId: string
  regionType: AreaRegionType
  clipPriority: number
  renderOrder: number
  shape: AreaShape
  fillColor: string
  holes: AreaShape[]
  highlight?: boolean
}

export function shapeBounds(shape: AreaShape): AreaShapeBounds {
  if (shape.type === 'rect') {
    return {
      minX: shape.x ?? 0,
      minY: shape.y ?? 0,
      maxX: (shape.x ?? 0) + (shape.width ?? 0),
      maxY: (shape.y ?? 0) + (shape.height ?? 0)
    }
  }
  if (shape.type === 'circle') {
    const r = shape.r ?? 0
    return {
      minX: (shape.cx ?? 0) - r,
      minY: (shape.cy ?? 0) - r,
      maxX: (shape.cx ?? 0) + r,
      maxY: (shape.cy ?? 0) + r
    }
  }
  if (shape.type === 'polygon' && shape.points?.length) {
    const xs = shape.points.map((p) => p.x)
    const ys = shape.points.map((p) => p.y)
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    }
  }
  return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
}

export interface AreaShapeBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 以外接框判断 inner 是否落在 outer 内部（示意坐标系 0–100） */
export function isShapeInside(inner: AreaShape, outer: AreaShape, margin = 0.35): boolean {
  const ib = shapeBounds(inner)
  const ob = shapeBounds(outer)
  return (
    ib.minX >= ob.minX - margin &&
    ib.minY >= ob.minY - margin &&
    ib.maxX <= ob.maxX + margin &&
    ib.maxY <= ob.maxY + margin
  )
}

/**
 * 收集应从 owner 中扣除的低优先级图形。
 * 规则：仅扣除 clipPriority 严格小于 owner，且几何上落在 owner 内部的图形。
 */
export function collectHoleShapes(
  ownerShape: AreaShape,
  ownerPriority: number,
  allRegions: RegionShapeRef[]
): AreaShape[] {
  const holes: AreaShape[] = []
  for (const region of allRegions) {
    if (region.clipPriority >= ownerPriority) continue
    for (const inner of region.shapes) {
      if (inner.id === ownerShape.id) continue
      if (isShapeInside(inner, ownerShape)) {
        holes.push(inner)
      }
    }
  }
  return holes
}

export function buildAreaPaintItems(
  allRegions: RegionShapeRef[],
  options: {
    fillAlpha?: number
    highlightRegionId?: string
  } = {}
): AreaPaintItem[] {
  const alpha = options.fillAlpha ?? 0.55
  const items: AreaPaintItem[] = []

  allRegions.forEach((region) => {
    region.shapes.forEach((shape) => {
      const holes = collectHoleShapes(shape, region.clipPriority, allRegions)
      items.push({
        key: `${region.regionId}-${shape.id}`,
        regionId: region.regionId,
        regionType: region.regionType,
        clipPriority: region.clipPriority,
        renderOrder: region.clipPriority,
        shape: { ...shape, color: shape.color || region.color },
        fillColor: tintFill(region.color, alpha),
        holes,
        highlight: options.highlightRegionId ? region.regionId === options.highlightRegionId : false
      })
    })
  })

  return items.sort((a, b) => a.renderOrder - b.renderOrder)
}

function tintFill(color: string, alpha: number): string {
  if (/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,/.test(color)) {
    return color.replace(/,\s*[\d.]+\s*\)$/, `,${alpha})`)
  }
  return color
}

export function maskDomId(key: string) {
  return `area-mask-${key.replace(/[^a-zA-Z0-9_-]/g, '')}`
}
