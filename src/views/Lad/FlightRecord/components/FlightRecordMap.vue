<script setup lang="ts">
import { GIS_BASE_LAT, GIS_BASE_LNG } from '@/views/Lad/Area/areaGisConstants'
import { percentToLatLng } from '@/views/Lad/Area/areaGisCoords'
import { createAreaGisMap } from '@/views/Lad/Area/areaGisLeaflet'
import { sampleTrajectoryAtProgress } from '@/views/Lad/Incident/trajectoryListRows'
import type { FlightRecordMapItem } from '../flightRecordMapTypes'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  items: FlightRecordMapItem[]
}>()

const mapRoot = ref<HTMLElement | null>(null)

let map: L.Map | null = null
let trackLayer: L.LayerGroup | null = null
let markerLayer: L.LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null
let lastFitKey = ''
let lastProgressKey = ''

function refreshMapSize() {
  map?.invalidateSize({ animate: false })
}

function trajectoryPercentToLatLng(x: number, y: number): [number, number] {
  return percentToLatLng(x * 100, y * 100)
}

function droneIcon(highlight: boolean) {
  return L.divIcon({
    className: 'flight-record-map__icon',
    html: `<span class="flight-record-map__badge is-drone${highlight ? ' is-selected' : ' is-static'}">无人机</span>`,
    iconSize: highlight ? [56, 28] : [48, 24],
    iconAnchor: highlight ? [28, 14] : [24, 12]
  })
}

function staticDroneLatLng(item: FlightRecordMapItem): [number, number] | null {
  if (item.decorativePos) {
    return trajectoryPercentToLatLng(item.decorativePos.x, item.decorativePos.y)
  }

  const { trajectory } = item.detail
  if (!trajectory.length) return null
  const point = trajectory[0]
  return trajectoryPercentToLatLng(point.x, point.y)
}

function renderSelectedTrail(item: FlightRecordMapItem, boundsPoints: L.LatLngExpression[]) {
  if (!trackLayer || !markerLayer) return

  const { trajectory, pilotPos, devicePos } = item.detail
  if (!trajectory.length) return

  const fullPath = trajectory.map((point) => trajectoryPercentToLatLng(point.x, point.y))
  fullPath.forEach((pt) => boundsPoints.push(pt))

  L.polyline(fullPath, {
    color: '#7c8db5',
    weight: 3,
    opacity: 0.45,
    dashArray: '6 8'
  }).addTo(trackLayer)

  const playedPoints = trajectory
    .filter((point) => point.progress <= item.progress)
    .map((point) => trajectoryPercentToLatLng(point.x, point.y))

  const sample = sampleTrajectoryAtProgress(trajectory, item.progress)
  const currentLatLng = trajectoryPercentToLatLng(sample.x, sample.y)

  if (playedPoints.length >= 2) {
    L.polyline(playedPoints, {
      color: '#a78bfa',
      weight: 5,
      opacity: 0.95
    }).addTo(trackLayer)
  } else if (playedPoints.length === 1) {
    L.polyline([playedPoints[0], currentLatLng], {
      color: '#a78bfa',
      weight: 5,
      opacity: 0.95
    }).addTo(trackLayer)
  }

  const pilotLatLng = trajectoryPercentToLatLng(pilotPos.x, pilotPos.y)
  const deviceLatLng = trajectoryPercentToLatLng(devicePos.x, devicePos.y)
  boundsPoints.push(pilotLatLng, deviceLatLng)

  L.circle(deviceLatLng, {
    radius: 180,
    color: '#60a5fa',
    fillColor: '#60a5fa',
    fillOpacity: 0.08,
    weight: 1.5,
    dashArray: '6 6'
  }).addTo(markerLayer)

  L.marker(pilotLatLng, {
    icon: L.divIcon({
      className: 'flight-record-map__icon',
      html: '<span class="flight-record-map__badge is-pilot">飞手</span>',
      iconSize: [48, 24],
      iconAnchor: [24, 12]
    })
  }).addTo(markerLayer)

  L.marker(deviceLatLng, {
    icon: L.divIcon({
      className: 'flight-record-map__icon',
      html: '<span class="flight-record-map__badge is-device">设备</span>',
      iconSize: [48, 24],
      iconAnchor: [24, 12]
    })
  }).addTo(markerLayer)

  L.marker(currentLatLng, {
    icon: droneIcon(true),
    zIndexOffset: 1000
  }).addTo(markerLayer)

  boundsPoints.push(currentLatLng)
}

function renderStaticDrone(item: FlightRecordMapItem, boundsPoints: L.LatLngExpression[]) {
  if (!markerLayer) return

  const latLng = staticDroneLatLng(item)
  if (!latLng) return

  L.marker(latLng, {
    icon: droneIcon(false),
    zIndexOffset: 100
  }).addTo(markerLayer)

  boundsPoints.push(latLng)
}

function fitToItems(items: FlightRecordMapItem[]) {
  if (!map || !items.length) return

  const boundsPoints: L.LatLngExpression[] = []
  items.forEach((item) => {
    if (item.showTrail) {
      const { trajectory, pilotPos, devicePos } = item.detail
      trajectory.forEach((point) => boundsPoints.push(trajectoryPercentToLatLng(point.x, point.y)))
      boundsPoints.push(
        trajectoryPercentToLatLng(pilotPos.x, pilotPos.y),
        trajectoryPercentToLatLng(devicePos.x, devicePos.y)
      )
      return
    }

    const latLng = staticDroneLatLng(item)
    if (latLng) boundsPoints.push(latLng)
  })

  if (!boundsPoints.length) {
    map.setView([GIS_BASE_LAT, GIS_BASE_LNG], 15)
    return
  }

  const bounds = L.latLngBounds(boundsPoints)
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.2), { maxZoom: 17 })
  }
}

function renderTrack(options: { refit?: boolean } = {}) {
  if (!map || !trackLayer || !markerLayer) return

  trackLayer.clearLayers()
  markerLayer.clearLayers()

  if (!props.items.length) {
    map.setView([GIS_BASE_LAT, GIS_BASE_LNG], 15)
    return
  }

  const boundsPoints: L.LatLngExpression[] = []

  props.items.forEach((item) => {
    if (item.showTrail) {
      renderSelectedTrail(item, boundsPoints)
    } else {
      renderStaticDrone(item, boundsPoints)
    }
  })

  const fitKey = props.items.map((item) => item.segmentId).join(',')
  if (options.refit || fitKey !== lastFitKey) {
    fitToItems(props.items)
    lastFitKey = fitKey
  }

  refreshMapSize()
}

function mapLayoutKey(items: FlightRecordMapItem[]) {
  return items.map((item) => `${item.segmentId}:${item.showTrail ? 1 : 0}`).join('|')
}

function selectedProgressKey(items: FlightRecordMapItem[]) {
  const selected = items.find((item) => item.showTrail)
  return selected ? `${selected.segmentId}:${Math.round(selected.progress * 10)}` : ''
}

onMounted(async () => {
  await nextTick()
  if (!mapRoot.value) return

  const created = createAreaGisMap(mapRoot.value)
  map = created.map
  trackLayer = L.layerGroup().addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  renderTrack({ refit: true })
  refreshMapSize()
  window.setTimeout(refreshMapSize, 150)

  resizeObserver = new ResizeObserver(() => refreshMapSize())
  resizeObserver.observe(mapRoot.value)
})

watch(
  () => mapLayoutKey(props.items),
  () => renderTrack({ refit: true })
)

watch(
  () => selectedProgressKey(props.items),
  (key) => {
    if (!key || key === lastProgressKey) return
    lastProgressKey = key
    renderTrack()
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="flight-record-map">
    <div ref="mapRoot" class="flight-record-map__canvas"></div>
    <div v-if="!items.length" class="flight-record-map__empty">请选择左侧时段以加载轨迹</div>
  </div>
</template>

<style scoped lang="less">
.flight-record-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
  background: #0f172a;

  &__canvas {
    width: 100%;
    height: 100%;
    min-height: 360px;
  }

  &__empty {
    position: absolute;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
    font-size: 14px;
    background: rgba(15, 23, 42, 0.55);
    pointer-events: none;
  }

  :deep(.leaflet-container) {
    width: 100%;
    height: 100%;
    background: #0f172a;
  }

  :deep(.flight-record-map__badge) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
    white-space: nowrap;

    &.is-drone.is-selected {
      background: #6d28d9;
      border: 1px solid #c4b5fd;
    }

    &.is-drone.is-static {
      background: #6d28d9;
      border: 1px solid #a78bfa;
      opacity: 0.72;
    }

    &.is-pilot {
      background: #92400e;
      border: 1px solid #fbbf24;
    }

    &.is-device {
      background: #1e3a5f;
      border: 1px solid #60a5fa;
    }
  }
}
</style>
