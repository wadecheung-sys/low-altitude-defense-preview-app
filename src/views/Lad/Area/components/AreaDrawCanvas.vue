<script setup lang="ts">
import type { AreaShape, AreaShapeType } from '@/api/lad/area/types'
import type { AreaPaintItem } from '../areaShapeGeometry'
import { maskDomId } from '../areaShapeGeometry'
import { nextShapeId } from '@/api/lad/area'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 已计算镂空关系的绘制项（按 level 升序） */
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

const svgRef = ref<SVGSVGElement | null>(null)
const drawing = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const polygonDraft = ref<{ x: number; y: number }[]>([])
const previewShape = ref<AreaShape | null>(null)

function strokeColor(color: string) {
  if (/rgba\(/.test(color)) {
    return color.replace(/,\s*[\d.]+\s*\)$/, ',1)')
  }
  return color
}

function polygonPointsAttr(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

const sortedItems = computed(() =>
  [...props.paintItems].sort((a, b) => a.renderOrder - b.renderOrder)
)

const highlightItems = computed(() => sortedItems.value.filter((i) => i.highlight))

function toSvgPoint(ev: MouseEvent) {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = ev.clientX
  pt.y = ev.clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const p = pt.matrixTransform(ctm.inverse())
  return {
    x: Math.round(Math.max(0, Math.min(100, p.x)) * 10) / 10,
    y: Math.round(Math.max(0, Math.min(100, p.y)) * 10) / 10
  }
}

function pushShape(shape: AreaShape) {
  emit('update:shapes', [...props.shapes, shape])
  emit('drawn')
}

function onMouseDown(ev: MouseEvent) {
  if (props.readonly || !props.tool) return
  const p = toSvgPoint(ev)
  if (props.tool === 'polygon') {
    polygonDraft.value.push(p)
    previewShape.value = {
      id: 'preview',
      type: 'polygon',
      color: props.activeColor,
      points: [...polygonDraft.value]
    }
    return
  }
  drawing.value = true
  startPoint.value = p
}

function onMouseMove(ev: MouseEvent) {
  if (props.readonly || !props.tool) return
  const p = toSvgPoint(ev)
  if (props.tool === 'polygon') {
    if (polygonDraft.value.length) {
      previewShape.value = {
        id: 'preview',
        type: 'polygon',
        color: props.activeColor,
        points: [...polygonDraft.value, p]
      }
    }
    return
  }
  if (!drawing.value) return
  if (props.tool === 'rect') {
    const x = Math.min(startPoint.value.x, p.x)
    const y = Math.min(startPoint.value.y, p.y)
    previewShape.value = {
      id: 'preview',
      type: 'rect',
      color: props.activeColor,
      x,
      y,
      width: Math.abs(p.x - startPoint.value.x),
      height: Math.abs(p.y - startPoint.value.y)
    }
  } else if (props.tool === 'circle') {
    const dx = p.x - startPoint.value.x
    const dy = p.y - startPoint.value.y
    previewShape.value = {
      id: 'preview',
      type: 'circle',
      color: props.activeColor,
      cx: startPoint.value.x,
      cy: startPoint.value.y,
      r: Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10
    }
  }
}

function onMouseUp(ev: MouseEvent) {
  if (props.readonly || !props.tool || props.tool === 'polygon') return
  if (!drawing.value) return
  drawing.value = false
  const p = toSvgPoint(ev)
  if (props.tool === 'rect') {
    const x = Math.min(startPoint.value.x, p.x)
    const y = Math.min(startPoint.value.y, p.y)
    const width = Math.abs(p.x - startPoint.value.x)
    const height = Math.abs(p.y - startPoint.value.y)
    if (width < 1 || height < 1) {
      previewShape.value = null
      return
    }
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
    const dx = p.x - startPoint.value.x
    const dy = p.y - startPoint.value.y
    const r = Math.sqrt(dx * dx + dy * dy)
    if (r < 1) {
      previewShape.value = null
      return
    }
    pushShape({
      id: nextShapeId(),
      type: 'circle',
      color: props.activeColor,
      cx: startPoint.value.x,
      cy: startPoint.value.y,
      r: Math.round(r * 10) / 10
    })
  }
  previewShape.value = null
}

function finishPolygon() {
  if (polygonDraft.value.length < 3) {
    polygonDraft.value = []
    previewShape.value = null
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
}

function cancelPolygon() {
  polygonDraft.value = []
  previewShape.value = null
}

defineExpose({ finishPolygon, cancelPolygon })
</script>

<template>
  <div class="area-draw-canvas" :class="{ 'is-drawing': !!tool && !readonly }">
    <svg
      ref="svgRef"
      class="area-draw-canvas__svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      @mousedown.prevent="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <defs>
        <template v-for="item in sortedItems" :key="`def-${item.key}`">
          <mask
            :id="maskDomId(item.key)"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100"
            height="100"
          >
            <!-- 外轮廓：可见 -->
            <rect
              v-if="item.shape.type === 'rect'"
              :x="item.shape.x"
              :y="item.shape.y"
              :width="item.shape.width"
              :height="item.shape.height"
              fill="white"
            />
            <circle
              v-else-if="item.shape.type === 'circle'"
              :cx="item.shape.cx"
              :cy="item.shape.cy"
              :r="item.shape.r"
              fill="white"
            />
            <polygon
              v-else-if="item.shape.type === 'polygon' && item.shape.points?.length"
              :points="polygonPointsAttr(item.shape.points)"
              fill="white"
            />
            <!-- 内部低级别区域：镂空 -->
            <template v-for="(hole, hi) in item.holes" :key="`hole-${item.key}-${hi}`">
              <rect
                v-if="hole.type === 'rect'"
                :x="hole.x"
                :y="hole.y"
                :width="hole.width"
                :height="hole.height"
                fill="black"
              />
              <circle
                v-else-if="hole.type === 'circle'"
                :cx="hole.cx"
                :cy="hole.cy"
                :r="hole.r"
                fill="black"
              />
              <polygon
                v-else-if="hole.type === 'polygon' && hole.points?.length"
                :points="polygonPointsAttr(hole.points)"
                fill="black"
              />
            </template>
          </mask>
        </template>
      </defs>

      <g class="area-draw-canvas__effective">
        <rect
          v-for="item in sortedItems"
          :key="`fill-${item.key}`"
          x="0"
          y="0"
          width="100"
          height="100"
          :fill="item.fillColor"
          :mask="`url(#${maskDomId(item.key)})`"
        />
        <!-- 描边画在实际轮廓上，便于辨认环带 -->
        <template v-for="item in sortedItems" :key="`stroke-${item.key}`">
          <rect
            v-if="item.shape.type === 'rect'"
            :x="item.shape.x"
            :y="item.shape.y"
            :width="item.shape.width"
            :height="item.shape.height"
            fill="none"
            :stroke="strokeColor(item.fillColor)"
            stroke-width="0.35"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-else-if="item.shape.type === 'circle'"
            :cx="item.shape.cx"
            :cy="item.shape.cy"
            :r="item.shape.r"
            fill="none"
            :stroke="strokeColor(item.fillColor)"
            stroke-width="0.35"
            vector-effect="non-scaling-stroke"
          />
          <polygon
            v-else-if="item.shape.type === 'polygon' && item.shape.points?.length"
            :points="polygonPointsAttr(item.shape.points)"
            fill="none"
            :stroke="strokeColor(item.fillColor)"
            stroke-width="0.35"
            vector-effect="non-scaling-stroke"
          />
        </template>
      </g>

      <g class="area-draw-canvas__highlight">
        <template v-for="item in highlightItems" :key="`hl-${item.key}`">
          <rect
            v-if="item.shape.type === 'rect'"
            :x="item.shape.x"
            :y="item.shape.y"
            :width="item.shape.width"
            :height="item.shape.height"
            fill="none"
            stroke="#409eff"
            stroke-width="0.55"
            stroke-dasharray="1.2 0.8"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-else-if="item.shape.type === 'circle'"
            :cx="item.shape.cx"
            :cy="item.shape.cy"
            :r="item.shape.r"
            fill="none"
            stroke="#409eff"
            stroke-width="0.55"
            stroke-dasharray="1.2 0.8"
            vector-effect="non-scaling-stroke"
          />
        </template>
      </g>

      <g v-if="previewShape" class="area-draw-canvas__preview">
        <rect
          v-if="previewShape.type === 'rect'"
          :x="previewShape.x"
          :y="previewShape.y"
          :width="previewShape.width"
          :height="previewShape.height"
          fill="none"
          stroke="#409eff"
          stroke-width="0.6"
          stroke-dasharray="0.8 0.5"
          vector-effect="non-scaling-stroke"
        />
        <circle
          v-else-if="previewShape.type === 'circle'"
          :cx="previewShape.cx"
          :cy="previewShape.cy"
          :r="previewShape.r"
          fill="none"
          stroke="#409eff"
          stroke-width="0.6"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>
    <p v-if="tool === 'polygon' && !readonly" class="area-draw-canvas__hint">
      依次点击顶点，完成后点击「完成绘制」
    </p>
    <p v-else-if="tool && !readonly" class="area-draw-canvas__hint">
      在画布上拖拽绘制{{ tool === 'rect' ? '矩形' : '圆形' }}
    </p>
  </div>
</template>

<style scoped lang="less">
.area-draw-canvas {
  position: relative;
  flex: 1;
  min-height: 420px;
  background: #f5f7fa;

  &.is-drawing {
    cursor: crosshair;
  }
}

.area-draw-canvas__svg {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 420px;
  background: #fff;
  border-radius: var(--el-border-radius-base);
}

.area-draw-canvas__hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  margin: 0;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: rgb(255 255 255 / 92%);
  border-radius: 4px;

  &--legend {
    left: 12px;
    right: auto;
    max-width: 320px;
    line-height: 1.45;
  }
}
</style>
