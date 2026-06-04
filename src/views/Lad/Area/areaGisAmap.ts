import type { AreaPaintItem } from './areaShapeGeometry'
import type { AreaShape } from '@/api/lad/area/types'
import { GIS_BASE_LAT, GIS_BASE_LNG } from './areaGisConstants'
import {
  parseFillStyle,
  percentRadiusToMeters,
  percentToLatLng,
  shapeToLatLngRing
} from './areaGisCoords'
import AMapLoader from '@amap/amap-jsapi-loader'

export type AmapOverlayBag = { list: AMap.Overlay[] }

function ringToAmapPath(ring: [number, number][]): [number, number][] {
  return ring.map(([lat, lng]) => [lng, lat])
}

function holePaths(holes: AreaShape[]): [number, number][][] {
  return holes
    .map((h) => shapeToLatLngRing(h))
    .filter((r) => r.length >= 3)
    .map(ringToAmapPath)
}

export function getAmapKey(): string {
  return (import.meta.env.VITE_AMAP_KEY || '').trim()
}

export async function loadAmapApi(): Promise<typeof AMap> {
  const key = getAmapKey()
  if (!key) {
    throw new Error('未配置 VITE_AMAP_KEY，请在高德开放平台申请 JS API Key 后写入 .env')
  }

  const securityCode = (import.meta.env.VITE_AMAP_SECURITY_CODE || '').trim()
  if (securityCode) {
    ;(window as Window & { _AMapSecurityConfig?: { securityJsCode: string } })._AMapSecurityConfig =
      { securityJsCode: securityCode }
  }

  return AMapLoader.load({
    key,
    version: '2.0',
    plugins: []
  }) as Promise<typeof AMap>
}

export async function createAreaGisMap(container: HTMLElement) {
  const AMap = await loadAmapApi()
  const map = new AMap.Map(container, {
    zoom: 15,
    center: [GIS_BASE_LNG, GIS_BASE_LAT],
    viewMode: '2D',
    resizeEnable: true
  })
  return { map, AMapNS: AMap }
}

export function clearOverlayBag(map: AMap.Map, bag: AmapOverlayBag) {
  if (bag.list.length) {
    map.remove(bag.list)
    bag.list = []
  }
}

export function renderPaintItemsOnMap(
  map: AMap.Map,
  AMapNS: typeof AMap,
  items: AreaPaintItem[],
  bag: AmapOverlayBag,
  options: { fitBounds?: boolean } = {}
) {
  clearOverlayBag(map, bag)
  const sorted = [...items].sort((a, b) => a.renderOrder - b.renderOrder)

  sorted.forEach((item) => {
    const { color, fillOpacity } = parseFillStyle(item.fillColor)
    const common = {
      strokeColor: color,
      strokeWeight: 2,
      strokeOpacity: 0.9,
      fillColor: color,
      fillOpacity,
      bubble: true
    }

    let overlay: AMap.Overlay | null = null

    if (item.shape.type === 'circle' && !item.holes.length) {
      const [lat, lng] = percentToLatLng(item.shape.cx ?? 50, item.shape.cy ?? 50)
      overlay = new AMapNS.Circle({
        ...common,
        center: new AMapNS.LngLat(lng, lat),
        radius: percentRadiusToMeters(item.shape.r ?? 1)
      })
    } else {
      const outer = ringToAmapPath(shapeToLatLngRing(item.shape))
      if (outer.length < 3) return
      const holes = holePaths(item.holes)
      const path = holes.length ? [outer, ...holes] : outer
      overlay = new AMapNS.Polygon({ ...common, path })
    }

    if (!overlay) return
    map.add(overlay)
    bag.list.push(overlay)
  })

  if (options.fitBounds) {
    if (bag.list.length) {
      map.setFitView(bag.list, false, [48, 48, 48, 48], 17)
    } else {
      map.setStatus({ dragEnable: true, zoomEnable: true })
    }
  }
}

export function renderPreviewShape(
  map: AMap.Map,
  AMapNS: typeof AMap,
  bag: AmapOverlayBag,
  shape: AreaShape | null
) {
  clearOverlayBag(map, bag)
  if (!shape) return

  const style = {
    strokeColor: '#409eff',
    strokeWeight: 2,
    strokeOpacity: 0.95,
    strokeStyle: 'dashed',
    fillColor: '#409eff',
    fillOpacity: 0.15,
    bubble: true
  }

  if (shape.type === 'circle') {
    const [lat, lng] = percentToLatLng(shape.cx ?? 50, shape.cy ?? 50)
    const circle = new AMapNS.Circle({
      ...style,
      center: new AMapNS.LngLat(lng, lat),
      radius: percentRadiusToMeters(shape.r ?? 1)
    })
    map.add(circle)
    bag.list.push(circle)
    return
  }

  const ring = ringToAmapPath(shapeToLatLngRing(shape))
  if (ring.length >= 3) {
    const poly = new AMapNS.Polygon({ ...style, path: ring })
    map.add(poly)
    bag.list.push(poly)
  }
}
