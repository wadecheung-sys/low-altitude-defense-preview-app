<script setup lang="ts">
import { nextShapeId } from '@/api/lad/area'
import type { AreaShape, AreaShapeType } from '@/api/lad/area/types'
import type { AreaPaintItem } from '../areaShapeGeometry'
import { latLngDeltaToPercentDelta, latLngToPercent } from '../areaGisCoords'
import {
  createAreaGisMap,
  renderEditableShape,
  renderPaintItemsOnMap,
  renderPreviewShape
} from '../areaGisLeaflet'
import { translateShape, updateShapeHandle } from '../areaGisShapeEdit'
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
let editLayer: L.LayerGroup | null = null
let previewLayer: L.LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null

const drawing = ref(false)
const startPercent = ref({ x: 0, y: 0 })
const polygonDraft = ref<{ x: number; y: number }[]>([])
const previewShape = ref<AreaShape | null>(null)

type EditDragMode =
  | { kind: 'body' }
  | { kind: 'handle'; index: number }

const editDrag = ref<{
  mode: EditDragMode
  startLatLng: L.LatLng
  startShape: AreaShape
  draftShape: AreaShape
  moved: boolean
} | null>(null)

let editDragMouseUpBlockUntil = 0

function setMapInteractionLock(locked: boolean, cursor = '') {
  if (!map) return
  if (locked) {
    map.dragging.disable()
    map.doubleClickZoom.disable()
    map.getContainer().style.cursor = cursor
  } else if (!props.tool && !drawing.value) {
    map.dragging.enable()
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = ''
  } else if (props.tool === 'polygon') {
    map.dragging.disable()
    map.doubleClickZoom.disable()
    map.getContainer().style.cursor = 'crosshair'
  } else if (props.tool) {
    map.dragging.enable()
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = 'crosshair'
  } else {
    map.dragging.enable()
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = ''
  }
}

function attachEditDragListeners() {
  document.addEventListener('mousemove', onDocumentMouseMove)
}

function detachEditDragListeners() {
  document.removeEventListener('mousemove', onDocumentMouseMove)
}

function onDocumentMouseMove(ev: MouseEvent) {
  if (!editDrag.value || !map) return
  applyEditDrag({ latlng: map.mouseEventToLatLng(ev) } as L.LeafletMouseEvent)
}

function pushShape(shape: AreaShape) {
  emit('update:shapes', [...props.shapes, shape])
  emit('drawn')
}

function canEditShape(): boolean {
  return !props.readonly && !props.tool && props.shapes.length > 0
}

function currentEditableShape(): AreaShape | null {
  return props.shapes[0] ?? null
}

function replaceEditableShape(shape: AreaShape) {
  emit('update:shapes', [shape])
}

function syncEditLayer() {
  if (!editLayer) return
  if (!canEditShape() || editDrag.value) {
    if (!editDrag.value) editLayer.clearLayers()
    return
  }
  const shape = currentEditableShape()
  if (!shape) {
    editLayer.clearLayers()
    return
  }
  renderEditableShape(editLayer, shape, {
    onBodyMouseDown: startBodyDrag,
    onHandleMouseDown: startHandleDrag
  })
  editLayer.bringToFront()
}

function startBodyDrag(ev: L.LeafletMouseEvent) {
  if (!canEditShape()) return
  const shape = currentEditableShape()
  if (!shape) return
  editDragMouseUpBlockUntil = Date.now() + 280
  editDrag.value = {
    mode: { kind: 'body' },
    startLatLng: ev.latlng,
    startShape: shape,
    draftShape: shape,
    moved: false
  }
  attachEditDragListeners()
  setMapInteractionLock(true, 'move')
  L.DomEvent.preventDefault(ev.originalEvent)
}

function startHandleDrag(handleIndex: number, ev: L.LeafletMouseEvent) {
  if (!canEditShape()) return
  const shape = currentEditableShape()
  if (!shape) return
  editDragMouseUpBlockUntil = Date.now() + 280
  editDrag.value = {
    mode: { kind: 'handle', index: handleIndex },
    startLatLng: ev.latlng,
    startShape: shape,
    draftShape: shape,
    moved: false
  }
  attachEditDragListeners()
  setMapInteractionLock(true, 'grabbing')
  L.DomEvent.preventDefault(ev.originalEvent)
}

function applyEditDrag(ev: L.LeafletMouseEvent) {
  const drag = editDrag.value
  if (!drag) return
  const { mode, startLatLng, startShape } = drag
  let nextShape: AreaShape
  if (mode.kind === 'body') {
    const { dx, dy } = latLngDeltaToPercentDelta(
      ev.latlng.lat - startLatLng.lat,
      ev.latlng.lng - startLatLng.lng
    )
    if (dx === 0 && dy === 0) return
    nextShape = translateShape(startShape, dx, dy)
  } else {
    nextShape = updateShapeHandle(startShape, mode.index, mapLatLng(ev))
  }
  editDrag.value = { ...drag, draftShape: nextShape, moved: true }
  if (editLayer) {
    renderEditableShape(editLayer, nextShape, {
      onBodyMouseDown: startBodyDrag,
      onHandleMouseDown: startHandleDrag
    })
  }
}

function cancelEditDrag() {
  if (!editDrag.value) return
  editDrag.value = null
  detachEditDragListeners()
  setMapInteractionLock(false)
  syncEditLayer()
}

function finishEditDrag() {
  const drag = editDrag.value
  if (!drag) return
  if (!drag.moved && Date.now() < editDragMouseUpBlockUntil) {
    cancelEditDrag()
    return
  }
  const finalShape = drag.draftShape
  editDrag.value = null
  detachEditDragListeners()
  setMapInteractionLock(false)
  if (drag.moved) {
    replaceEditableShape(finalShape)
  }
  syncEditLayer()
}

function onDocumentMouseUp() {
  if (editDrag.value) finishEditDrag()
  if (drawing.value && props.tool && props.tool !== 'polygon') {
    drawing.value = false
    setMapDrawingMode(false)
  }
}

function setMapDrawingMode(active: boolean) {
  if (!map) return
  if (active) {
    setMapInteractionLock(true, 'crosshair')
  } else {
    setMapInteractionLock(false)
  }
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

function onMapMouseDown(ev: L.LeafletMouseEvent) {
  if (props.readonly || !props.tool || props.tool === 'polygon') return
  L.DomEvent.stopPropagation(ev)
  const p = mapLatLng(ev)
  drawing.value = true
  startPercent.value = p
  setMapDrawingMode(true)
}

function onMapMouseMove(ev: L.LeafletMouseEvent) {
  if (editDrag.value) {
    applyEditDrag(ev)
    return
  }
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
  if (editDrag.value) {
    finishEditDrag()
    return
  }
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
  L.DomEvent.stop(ev)
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

function onMapDblClick(ev: L.LeafletMouseEvent) {
  if (props.readonly || props.tool !== 'polygon') return
  L.DomEvent.stop(ev)
  if (polygonDraft.value.length > 0) {
    polygonDraft.value.pop()
  }
  finishPolygon()
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
  map.on('dblclick', onMapDblClick)
}

function unbindMapDrawEvents() {
  if (!map) return
  map.off('mousedown', onMapMouseDown)
  map.off('mousemove', onMapMouseMove)
  map.off('mouseup', onMapMouseUp)
  map.off('click', onMapClick)
  map.off('dblclick', onMapDblClick)
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
  editLayer = L.layerGroup().addTo(map)
  previewLayer = L.layerGroup().addTo(map)
  bindMapDrawEvents()
  syncZones(true)
  syncEditLayer()
  mapReady.value = true
  refreshMapSize()
  setTimeout(refreshMapSize, 150)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => refreshMapSize())
    resizeObserver.observe(mapRoot.value)
  }

  document.addEventListener('mouseup', onDocumentMouseUp)
})

watch(
  () => props.paintItems,
  () => syncZones(false),
  { deep: true }
)

watch(
  () => [props.shapes, props.tool, props.readonly] as const,
  async () => {
    if (!editDrag.value) {
      await nextTick()
      syncEditLayer()
    }
  },
  { deep: true }
)

watch(
  () => props.tool,
  (tool) => {
    if (!map) return
    if (editDrag.value) finishEditDrag()
    if (!tool) {
      drawing.value = false
      setMapInteractionLock(false)
      syncEditLayer()
      return
    }
    editLayer?.clearLayers()
    if (tool === 'polygon') {
      setMapInteractionLock(true, 'crosshair')
    } else {
      map.dragging.enable()
      map.doubleClickZoom.enable()
      map.getContainer().style.cursor = ''
    }
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', onDocumentMouseUp)
  detachEditDragListeners()
  resizeObserver?.disconnect()
  unbindMapDrawEvents()
  setMapDrawingMode(false)
  map?.remove()
  map = null
  zoneLayer = null
  editLayer = null
  previewLayer = null
})

defineExpose({ finishPolygon, cancelPolygon })
</script>

<template>
  <section
    class="area-gis-map"
    :class="{
      'is-drawing': !!tool && !readonly && mapReady,
      'is-editing': canEditShape() && mapReady
    }"
    aria-label="GIS地图"
  >
    <div ref="mapRoot" class="area-gis-map__container"></div>
    <p v-if="mapReady && tool === 'polygon' && !readonly" class="area-gis-map__hint">
      在地图上依次点击顶点，双击完成绘制
    </p>
    <p v-else-if="mapReady && tool && !readonly" class="area-gis-map__hint">
      在地图上拖拽绘制{{ tool === 'rect' ? '矩形' : '圆形' }}
    </p>
    <p v-else-if="mapReady && canEditShape()" class="area-gis-map__hint">
      拖拽图形平移位置；拖拽控制点调整形状
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

  &.is-editing :deep(.leaflet-container) {
    cursor: default;
  }
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
