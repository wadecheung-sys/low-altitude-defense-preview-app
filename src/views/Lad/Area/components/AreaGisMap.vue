<script setup lang="ts">
import { nextShapeId } from '@/api/lad/area'
import type { AreaShape, AreaShapeType } from '@/api/lad/area/types'
import type { AreaPaintItem } from '../areaShapeGeometry'
import { latLngToPercent } from '../areaGisCoords'
import { createAreaGisMap, renderPaintItemsOnMap, renderPreviewShape } from '../areaGisLeaflet'
import { GIS_BASE_LAT, GIS_BASE_LNG } from '../areaGisConstants'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = withDefaults(
  defineProps<{
    paintItems?: AreaPaintItem[]
    shapes: AreaShape[]
    activeColor: string
    tool: AreaShapeType | null
    readonly?: boolean
  }>(),
  {
    paintItems: () => [],
    readonly: false
  }
)

const emit = defineEmits<{
  'update:shapes': [shapes: AreaShape[]]
  drawn: []
}>()

const mapRoot = ref<HTMLElement | null>(null)
const mapReady = ref(false)

let map: L.Map | null = null
let zoneLayer: L.LayerGroup | null = null
let previewLayer: L.LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null

const drawing = ref(false)
const startPercent = ref({ x: 0, y: 0 })
const polygonDraft = ref<{ x: number; y: number }[]>([])
const previewShape = ref<AreaShape | null>(null)

function pushShape(shape: AreaShape) {
  emit('update:shapes', [...props.shapes, shape])
  emit('drawn')
}

function syncZones(fitBounds: boolean) {
  if (!map || !zoneLayer) return
  renderPaintItemsOnMap(map, zoneLayer, props.paintItems, { fitBounds })
}

function syncPreview() {
  if (!previewLayer) return
  renderPreviewShape(previewLayer, previewShape.value)
}

function mapLatLng(ev: { latlng: L.LatLng }) {
  return latLngToPercent(ev.latlng.lat, ev.latlng.lng)
}

function setMapDrawingMode(active: boolean) {
  if (!map) return
  if (active) {
    map.dragging.disable()
    map.doubleClickZoom.disable()
    map.getContainer().style.cursor = 'crosshair'
  } else {
    map.dragging.enable()
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = ''
  }
}

function onMapMouseDown(ev: L.LeafletMouseEvent) {
  if (props.readonly || !props.tool || props.tool === 'polygon') return
  L.DomEvent.stopPropagation(ev)
  const p = mapLatLng(ev)
  drawing.value = true
  startPercent.value = p
  setMapDrawingMode(true)
}

function onMapMouseMove(ev: L.LeafletMouseEvent) {
  if (props.readonly || !props.tool) return
  const p = mapLatLng(ev)

  if (props.tool === 'polygon') {
    if (polygonDraft.value.length) {
      previewShape.value = {
        id: 'preview',
        type: 'polygon',
        color: props.activeColor,
        points: [...polygonDraft.value, p]
      }
      syncPreview()
    }
    return
  }

  if (!drawing.value) return

  if (props.tool === 'rect') {
    const x = Math.min(startPercent.value.x, p.x)
    const y = Math.min(startPercent.value.y, p.y)
    previewShape.value = {
      id: 'preview',
      type: 'rect',
      color: props.activeColor,
      x,
      y,
      width: Math.abs(p.x - startPercent.value.x),
      height: Math.abs(p.y - startPercent.value.y)
    }
  } else if (props.tool === 'circle') {
    const dx = p.x - startPercent.value.x
    const dy = p.y - startPercent.value.y
    previewShape.value = {
      id: 'preview',
      type: 'circle',
      color: props.activeColor,
      cx: startPercent.value.x,
      cy: startPercent.value.y,
      r: Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10
    }
  }
  syncPreview()
}

function onMapMouseUp(ev: L.LeafletMouseEvent) {
  if (props.readonly || !props.tool || props.tool === 'polygon') return
  if (!drawing.value) return
  drawing.value = false
  setMapDrawingMode(false)

  const p = mapLatLng(ev)
  if (props.tool === 'rect') {
    const x = Math.min(startPercent.value.x, p.x)
    const y = Math.min(startPercent.value.y, p.y)
    const width = Math.abs(p.x - startPercent.value.x)
    const height = Math.abs(p.y - startPercent.value.y)
    previewShape.value = null
    syncPreview()
    if (width < 1 || height < 1) return
    pushShape({
      id: nextShapeId(),
      type: 'rect',
      color: props.activeColor,
      x,
      y,
      width,
      height
    })
  } else if (props.tool === 'circle') {
    const dx = p.x - startPercent.value.x
    const dy = p.y - startPercent.value.y
    const r = Math.sqrt(dx * dx + dy * dy)
    previewShape.value = null
    syncPreview()
    if (r < 1) return
    pushShape({
      id: nextShapeId(),
      type: 'circle',
      color: props.activeColor,
      cx: startPercent.value.x,
      cy: startPercent.value.y,
      r: Math.round(r * 10) / 10
    })
  }
}

function onMapClick(ev: L.LeafletMouseEvent) {
  if (props.readonly || props.tool !== 'polygon') return
  L.DomEvent.stopPropagation(ev)
  const p = mapLatLng(ev)
  polygonDraft.value.push(p)
  previewShape.value = {
    id: 'preview',
    type: 'polygon',
    color: props.activeColor,
    points: [...polygonDraft.value]
  }
  syncPreview()
}

function finishPolygon() {
  if (polygonDraft.value.length < 3) {
    polygonDraft.value = []
    previewShape.value = null
    syncPreview()
    return
  }
  pushShape({
    id: nextShapeId(),
    type: 'polygon',
    color: props.activeColor,
    points: [...polygonDraft.value]
  })
  polygonDraft.value = []
  previewShape.value = null
  syncPreview()
}

function cancelPolygon() {
  polygonDraft.value = []
  previewShape.value = null
  syncPreview()
}

function bindMapDrawEvents() {
  if (!map) return
  map.on('mousedown', onMapMouseDown)
  map.on('mousemove', onMapMouseMove)
  map.on('mouseup', onMapMouseUp)
  map.on('click', onMapClick)
}

function unbindMapDrawEvents() {
  if (!map) return
  map.off('mousedown', onMapMouseDown)
  map.off('mousemove', onMapMouseMove)
  map.off('mouseup', onMapMouseUp)
  map.off('click', onMapClick)
}

function refreshMapSize() {
  map?.invalidateSize({ animate: false })
}

onMounted(async () => {
  await nextTick()
  if (!mapRoot.value) return
  const inst = createAreaGisMap(mapRoot.value)
  map = inst.map
  zoneLayer = inst.zoneLayer
  previewLayer = L.layerGroup().addTo(map)
  bindMapDrawEvents()
  syncZones(true)
  mapReady.value = true
  refreshMapSize()
  setTimeout(refreshMapSize, 150)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => refreshMapSize())
    resizeObserver.observe(mapRoot.value)
  }
})

watch(
  () => props.paintItems,
  () => syncZones(false),
  { deep: true }
)

watch(
  () => props.tool,
  (tool) => {
    if (!map) return
    if (!tool) {
      drawing.value = false
      setMapDrawingMode(false)
      return
    }
    if (tool === 'polygon') {
      map.dragging.disable()
      map.doubleClickZoom.disable()
    } else {
      map.dragging.enable()
      map.doubleClickZoom.enable()
    }
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  unbindMapDrawEvents()
  setMapDrawingMode(false)
  map?.remove()
  map = null
  zoneLayer = null
  previewLayer = null
})

defineExpose({ finishPolygon, cancelPolygon })
</script>

<template>
  <section
    class="area-gis-map"
    :class="{ 'is-drawing': !!tool && !readonly && mapReady }"
    aria-label="GIS地图"
  >
    <div ref="mapRoot" class="area-gis-map__container"></div>
    <p v-if="mapReady && tool === 'polygon' && !readonly" class="area-gis-map__hint">
      在地图上依次点击顶点，完成后点击「完成绘制」
    </p>
    <p v-else-if="mapReady && tool && !readonly" class="area-gis-map__hint">
      在地图上拖拽绘制{{ tool === 'rect' ? '矩形' : '圆形' }}
    </p>
    <p v-else-if="mapReady" class="area-gis-map__hint area-gis-map__hint--muted">
      GeoQ 底图 · 中心 {{ GIS_BASE_LNG }}, {{ GIS_BASE_LAT }}
    </p>
  </section>
</template>

<style scoped lang="less">
.area-gis-map {
  position: relative;
  flex: 1;
  width: 100%;
  height: 520px;
  min-height: 520px;
}

.area-gis-map__container {
  width: 100%;
  height: 100%;
  min-height: 520px;
}

.area-gis-map :deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  font-family: inherit;
}

.area-gis-map__hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1000;
  margin: 0;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: rgb(255 255 255 / 92%);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 12%);
  pointer-events: none;

  &--muted {
    color: var(--el-text-color-secondary);
  }
}

:deep(.leaflet-control-attribution) {
  font-size: 10px;
}
</style>
