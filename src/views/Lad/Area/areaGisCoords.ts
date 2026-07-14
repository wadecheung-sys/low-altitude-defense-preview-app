import type { AreaShape } from '@/api/lad/area/types'
import { GIS_BASE_LAT, GIS_BASE_LNG } from './areaGisConstants'

/** 示意坐标 ↔ 经纬度线性换算（GIS 地图模式下不限制 0–100 范围） */
export const LNG_PER_PERCENT = 0.0008
export const LAT_PER_PERCENT = 0.0006

export function percentToLatLng(x: number, y: number): [number, number] {
  const lng = GIS_BASE_LNG + (x - 50) * LNG_PER_PERCENT
  const lat = GIS_BASE_LAT - (y - 50) * LAT_PER_PERCENT
  return [lat, lng]
}

export function latLngToPercent(lat: number, lng: number): { x: number; y: number } {
  const x = 50 + (lng - GIS_BASE_LNG) / LNG_PER_PERCENT
  const y = 50 - (lat - GIS_BASE_LAT) / LAT_PER_PERCENT
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10
  }
}

/** 拖动时用经纬度增量换算为示意坐标增量，避免逐点 clamp 导致形变或拖不动。 */
export function latLngDeltaToPercentDelta(dLat: number, dLng: number): { dx: number; dy: number } {
  return {
    dx: Math.round((dLng / LNG_PER_PERCENT) * 10) / 10,
    dy: Math.round((-dLat / LAT_PER_PERCENT) * 10) / 10
  }
}

export function percentRadiusToMeters(r: number): number {
  return Math.max(30, Math.round(r * 85))
}

export function shapeToLatLngRing(shape: AreaShape): [number, number][] {
  if (shape.type === 'rect') {
    const x = shape.x ?? 0
    const y = shape.y ?? 0
    const w = shape.width ?? 0
    const h = shape.height ?? 0
    return [
      percentToLatLng(x, y),
      percentToLatLng(x + w, y),
      percentToLatLng(x + w, y + h),
      percentToLatLng(x, y + h)
    ]
  }
  if (shape.type === 'circle') {
    const cx = shape.cx ?? 50
    const cy = shape.cy ?? 50
    const r = shape.r ?? 1
    const pts: [number, number][] = []
    for (let i = 0; i < 36; i++) {
      const rad = (i / 36) * Math.PI * 2
      pts.push(percentToLatLng(cx + r * Math.cos(rad), cy + r * Math.sin(rad)))
    }
    return pts
  }
  if (shape.type === 'polygon' && shape.points?.length) {
    return shape.points.map((p) => percentToLatLng(p.x, p.y))
  }
  return []
}

export function parseFillStyle(fillColor: string): { color: string; fillOpacity: number } {
  const m = fillColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (!m) return { color: '#409eff', fillOpacity: 0.45 }
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  const a = m[4] != null ? Number(m[4]) : 1
  const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
  return { color: hex, fillOpacity: a }
}
