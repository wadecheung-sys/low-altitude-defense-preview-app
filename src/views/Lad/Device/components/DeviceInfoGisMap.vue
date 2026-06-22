<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    mapX: number
    mapY: number
    controlRangeM: number
    deviceLabel?: string
    readonly?: boolean
    placing?: boolean
  }>(),
  {
    deviceLabel: '设备',
    readonly: false,
    placing: false
  }
)

const emit = defineEmits<{
  'update:mapX': [value: number]
  'update:mapY': [value: number]
}>()

const mapRef = ref<HTMLElement | null>(null)

const markerStyle = computed(() => ({
  left: `${props.mapX}%`,
  top: `${props.mapY}%`
}))

/** 示意：米 → 像素半径（演示比例） */
const rangeRadiusPx = computed(() => {
  const r = Math.max(40, Math.min(160, props.controlRangeM / 4))
  return r
})

const rangeStyle = computed(() => ({
  width: `${rangeRadiusPx.value * 2}px`,
  height: `${rangeRadiusPx.value * 2}px`,
  left: `${props.mapX}%`,
  top: `${props.mapY}%`
}))

function onMapClick(ev: MouseEvent) {
  if (props.readonly || !props.placing || !mapRef.value) return
  const rect = mapRef.value.getBoundingClientRect()
  const x = ((ev.clientX - rect.left) / rect.width) * 100
  const y = ((ev.clientY - rect.top) / rect.height) * 100
  emit('update:mapX', Math.round(Math.max(8, Math.min(92, x)) * 10) / 10)
  emit('update:mapY', Math.round(Math.max(8, Math.min(92, y)) * 10) / 10)
}
</script>

<template>
  <div
    ref="mapRef"
    class="device-gis-map"
    :class="{ 'is-placing': placing && !readonly, 'is-readonly': readonly }"
    @click="onMapClick"
  >
    <span class="device-gis-map__watermark">GIS地图</span>
    <div v-if="mapX > 0 || mapY > 0" class="device-gis-map__range" :style="rangeStyle"></div>
    <div v-if="mapX > 0 || mapY > 0" class="device-gis-map__marker" :style="markerStyle">
      <span class="device-gis-map__marker-icon">⚡</span>
      <span class="device-gis-map__marker-label">{{ deviceLabel }}</span>
    </div>
    <p v-if="placing && !readonly" class="device-gis-map__hint">点击地图放置设备位置</p>
    <p v-else-if="!readonly" class="device-gis-map__hint">点击「放置设备」后在地图上选点</p>
  </div>
</template>

<style scoped lang="less">
.device-gis-map {
  position: relative;
  width: 100%;
  min-height: 420px;
  height: 100%;
  overflow: hidden;
  cursor: default;
  background: linear-gradient(180deg, #e8edf3 0%, #dfe6ee 100%);
  border-radius: var(--el-border-radius-base);

  &.is-placing {
    cursor: crosshair;
  }
}

.device-gis-map__watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  color: rgb(0 0 0 / 12%);
  font-size: 48px;
  font-weight: 600;
  letter-spacing: 0.2em;
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
}

.device-gis-map__range {
  position: absolute;
  border: 2px dashed var(--el-color-primary);
  border-radius: 50%;
  opacity: 0.75;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.device-gis-map__marker {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -100%);
  pointer-events: none;
}

.device-gis-map__marker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  background: var(--el-color-warning);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgb(0 0 0 / 18%);
}

.device-gis-map__marker-label {
  margin-top: 4px;
  padding: 2px 8px;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  background: var(--el-color-primary);
  border-radius: 4px;
}

.device-gis-map__hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  margin: 0;
  padding: 6px 10px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  background: rgb(255 255 255 / 88%);
  border-radius: 4px;
}
</style>
