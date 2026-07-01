import type { AreaPaintItem } from './areaShapeGeometry'
import type { AreaShape } from '@/api/lad/area/types'
import { GIS_BASE_LAT, GIS_BASE_LNG } from './areaGisConstants'
import {
  parseFillStyle,
  percentRadiusToMeters,
  percentToLatLng,
  shapeToLatLngRing
} from './areaGisCoords'
import { getShapeHandles } from './areaGisShapeEdit'
import L from 'leaflet'

/** 地图叠放：先绘低裁剪优先级，后绘高优先级（高优先级图形压住低优先级） */
export function sortPaintItemsForMapStack(items: AreaPaintItem[]): AreaPaintItem[] {
  return [...items].sort((a, b) => a.renderOrder - b.renderOrder)
}

function holeRings(holes: AreaShape[]): [number, number][][] {
  return holes.map((h) => shapeToLatLngRing(h)).filter((r) => r.length >= 3)
}

function fillFromItem(item: AreaPaintItem) {
  return parseFillStyle(item.shape.color || item.fillColor)
}

export function renderPaintItemsOnMap(
  map: L.Map,
  group: L.LayerGroup,
  items: AreaPaintItem[],
  options: { fitBounds?: boolean } = {}
) {
  group.clearLayers()
  const sorted = sortPaintItemsForMapStack(items)
  const bounds: L.LatLngBounds[] = []

  sorted.forEach((item) => {
    const { color, fillOpacity } = fillFromItem(item)
    const style: L.PathOptions = {
      color,
      fillColor: color,
      fillOpacity,
      weight: 2,
      opacity: 0.95
    }

    let layer: L.Layer | null = null

    if (item.shape.type === 'circle' && !item.holes.length) {
      const [lat, lng] = percentToLatLng(item.shape.cx ?? 50, item.shape.cy ?? 50)
      layer = L.circle([lat, lng], {
        ...style,
        radius: percentRadiusToMeters(item.shape.r ?? 1)
      })
    } else {
      const outer = shapeToLatLngRing(item.shape)
      if (outer.length < 3) return
      const holes = holeRings(item.holes)
      layer =
        holes.length > 0
          ? L.polygon([outer, ...holes] as L.LatLngExpression[][], style)
          : L.polygon(outer, style)
    }

    if (!layer) return
    layer.addTo(group)
    if ('getBounds' in layer && typeof layer.getBounds === 'function') {
      bounds.push(layer.getBounds())
    }
  })

  if (options.fitBounds) {
    if (bounds.length) {
      const merged = bounds.reduce((acc, b) => acc.extend(b), bounds[0])
      map.fitBounds(merged, { padding: [40, 40], maxZoom: 17 })
    } else {
      map.setView([GIS_BASE_LAT, GIS_BASE_LNG], 15)
    }
  }
}

const previewStyle: L.PathOptions = {
  color: '#409eff',
  fillColor: '#409eff',
  fillOpacity: 0.15,
  weight: 2,
  dashArray: '6 4',
  opacity: 0.95
}

export function renderPreviewShape(group: L.LayerGroup, shape: AreaShape | null) {
  group.clearLayers()
  if (!shape) return

  if (shape.type === 'circle') {
    const [lat, lng] = percentToLatLng(shape.cx ?? 50, shape.cy ?? 50)
    L.circle([lat, lng], {
      ...previewStyle,
      radius: percentRadiusToMeters(shape.r ?? 1)
    }).addTo(group)
    return
  }

  const ring = shapeToLatLngRing(shape)
  if (ring.length >= 3) {
    L.polygon(ring, previewStyle).addTo(group)
  }
}

const editShapeStyle: L.PathOptions = {
  color: '#409eff',
  fillColor: '#409eff',
  fillOpacity: 0.22,
  weight: 3,
  opacity: 1,
  interactive: false
}

const editHitStyle: L.PathOptions = {
  color: 'transparent',
  fillColor: '#409eff',
  fillOpacity: 0.05,
  weight: 16,
  opacity: 0,
  interactive: true
}

const handleStyle: L.CircleMarkerOptions = {
  radius: 7,
  color: '#409eff',
  fillColor: '#ffffff',
  fillOpacity: 1,
  weight: 2,
  interactive: true
}

const centerHandleStyle: L.CircleMarkerOptions = {
  ...handleStyle,
  radius: 6,
  fillColor: '#409eff',
  fillOpacity: 1
}

export interface EditableShapeHandlers {
  onBodyMouseDown: (ev: L.LeafletMouseEvent) => void
  onHandleMouseDown: (handleIndex: number, ev: L.LeafletMouseEvent) => void
}

export function renderEditableShape(
  group: L.LayerGroup,
  shape: AreaShape,
  handlers: EditableShapeHandlers
) {
  group.clearLayers()

  const bindBody = (layer: L.Path) => {
    layer.on('mousedown', (ev) => {
      L.DomEvent.stop(ev)
      handlers.onBodyMouseDown(ev)
    })
  }

  if (shape.type === 'circle') {
    const [lat, lng] = percentToLatLng(shape.cx ?? 50, shape.cy ?? 50)
    const circle = L.circle([lat, lng], {
      ...editShapeStyle,
      interactive: true,
      radius: percentRadiusToMeters(shape.r ?? 1)
    })
    bindBody(circle)
    circle.addTo(group)
  } else {
    const ring = shapeToLatLngRing(shape)
    if (ring.length >= 3) {
      if (shape.type === 'polygon') {
        const hit = L.polygon(ring, editHitStyle)
        bindBody(hit)
        hit.addTo(group)
        L.polygon(ring, editShapeStyle).addTo(group)
      } else {
        const polygon = L.polygon(ring, { ...editShapeStyle, interactive: true })
        bindBody(polygon)
        polygon.addTo(group)
      }
    }
  }

  getShapeHandles(shape).forEach((handle) => {
    const [lat, lng] = percentToLatLng(handle.x, handle.y)
    const style = handle.kind === 'center' ? centerHandleStyle : handleStyle
    const marker = L.circleMarker([lat, lng], style)
    marker.on('mousedown', (ev) => {
      L.DomEvent.stop(ev)
      handlers.onHandleMouseDown(handle.index, ev)
    })
    marker.addTo(group)
  })
}

/** 国内可访问的公开底图（GeoQ），无需 Key */
export function createAreaGisMap(container: HTMLElement): {
  map: L.Map
  zoneLayer: L.LayerGroup
} {
  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true
  }).setView([GIS_BASE_LAT, GIS_BASE_LNG], 15)

  const geoq = L.tileLayer(
    'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 18,
      attribution: 'GeoQ'
    }
  )
  const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '&copy; CARTO'
  })

  geoq.addTo(map)
  geoq.on('tileerror', () => {
    if (!map.hasLayer(carto)) carto.addTo(map)
  })

  const zoneLayer = L.layerGroup().addTo(map)
  return { map, zoneLayer }
}
