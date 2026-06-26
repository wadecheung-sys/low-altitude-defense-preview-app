<script setup lang="ts">
import type { HistoryEventDetail, TrajectoryPoint } from '@/api/lad/incident/types'
import { BaseButton } from '@/components/Button'
import { ElOption, ElSelect, ElSlider } from 'element-plus'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  detail: HistoryEventDetail
}>()

const MAP_W = 800
const MAP_H = 400

const progress = ref(0)
const playing = ref(false)
const speed = ref(10)
const speedOptions = [1, 2, 5, 10, 20]

let rafId = 0
let lastTs = 0

const toPx = (p: { x: number; y: number }) => ({
  x: p.x * MAP_W,
  y: p.y * MAP_H
})

function sampleAt(pct: number): TrajectoryPoint {
  const pts = props.detail.trajectory
  if (!pts.length) {
    return { progress: pct, x: 0.5, y: 0.5, altitude: 0 }
  }
  if (pct <= pts[0].progress) return { ...pts[0], progress: pct }
  for (let i = 1; i < pts.length; i++) {
    if (pct <= pts[i].progress) {
      const a = pts[i - 1]
      const b = pts[i]
      const ratio = (pct - a.progress) / (b.progress - a.progress || 1)
      return {
        progress: pct,
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
        altitude: Math.round(a.altitude + (b.altitude - a.altitude) * ratio)
      }
    }
  }
  return { ...pts[pts.length - 1], progress: pct }
}

const currentSample = computed(() => sampleAt(progress.value))
const currentIndex = computed(() => {
  const pts = props.detail.trajectory
  if (!pts.length) return 0
  return Math.max(
    0,
    pts.findIndex((item) => item.progress >= progress.value)
  )
})

const previousSample = computed(() => {
  const pts = props.detail.trajectory
  if (!pts.length) return currentSample.value
  return pts[Math.max(0, currentIndex.value - 1)] || currentSample.value
})

const currentLng = computed(() => (113.39 + currentSample.value.x * 0.05).toFixed(4))
const currentLat = computed(() => (23.09 + currentSample.value.y * 0.04).toFixed(4))
const currentSpeed = computed(() => {
  const deltaX = currentSample.value.x - previousSample.value.x
  const deltaY = currentSample.value.y - previousSample.value.y
  const distanceFactor = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  return Math.max(2, Math.round(8 + distanceFactor * 180 + progress.value * 0.04))
})
const currentHeading = computed(() => {
  const deltaX = currentSample.value.x - previousSample.value.x
  const deltaY = currentSample.value.y - previousSample.value.y
  const angle = (Math.atan2(deltaX, -deltaY) * 180) / Math.PI
  return Math.round((angle + 360) % 360)
})
const currentStatus = computed(() => {
  if (props.detail.handlingStatus === '已结束') return '已结束'
  if (props.detail.handlingStatus === '已处置')
    return progress.value >= 92 ? '处置完成' : '持续跟踪'
  if (props.detail.handlingStatus === '处置中')
    return progress.value >= 52 ? '处置执行中' : '持续跟踪'
  return '监视待处置'
})
const currentRecordTime = computed(() => {
  const markers = props.detail.markers
  if (!markers.length) return props.detail.discoveredAt
  const matched = [...markers].reverse().find((item) => progress.value >= item.progress)
  return matched?.time || props.detail.discoveredAt
})

const pathD = computed(() => {
  const pts = props.detail.trajectory
  if (pts.length < 2) return ''
  return pts
    .map((p, i) => {
      const { x, y } = toPx(p)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})

const pathPlayedD = computed(() => {
  const pts = props.detail.trajectory.filter((p) => p.progress <= progress.value)
  if (pts.length < 2) {
    const s = sampleAt(progress.value)
    const { x, y } = toPx(s)
    return `M ${x} ${y}`
  }
  return pts
    .map((p, i) => {
      const { x, y } = toPx(p)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})

const dronePx = computed(() => toPx(currentSample.value))
const pilotPx = computed(() => toPx(props.detail.pilotPos))
const devicePx = computed(() => toPx(props.detail.devicePos))

const tick = (ts: number) => {
  if (!playing.value) return
  if (!lastTs) lastTs = ts
  const deltaSec = (ts - lastTs) / 1000
  lastTs = ts
  progress.value = Math.min(100, progress.value + deltaSec * speed.value)
  if (progress.value >= 100) {
    playing.value = false
    lastTs = 0
    return
  }
  rafId = requestAnimationFrame(tick)
}

const play = () => {
  if (progress.value >= 100) {
    progress.value = 0
  }
  playing.value = true
  lastTs = 0
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(tick)
}

const pause = () => {
  playing.value = false
  lastTs = 0
  cancelAnimationFrame(rafId)
}

const togglePlay = () => {
  if (playing.value) pause()
  else play()
}

watch(playing, (v) => {
  if (!v) cancelAnimationFrame(rafId)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
})

defineExpose({ play, pause, togglePlay })
</script>

<template>
  <div class="trajectory-replay">
    <div class="trajectory-replay__map">
      <svg
        class="trajectory-replay__svg"
        :viewBox="`0 0 ${MAP_W} ${MAP_H}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              stroke-width="1"
            />
          </pattern>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#a78bfa" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect x="480" y="60" width="200" height="120" fill="rgba(239,68,68,0.18)" rx="4" />
        <rect x="120" y="200" width="180" height="100" fill="rgba(249,115,22,0.15)" rx="4" />
        <circle
          :cx="devicePx.x"
          :cy="devicePx.y"
          r="90"
          fill="none"
          stroke="rgba(96,165,250,0.45)"
          stroke-width="2"
          stroke-dasharray="8 6"
        />
        <circle
          :cx="devicePx.x"
          :cy="devicePx.y"
          r="140"
          fill="none"
          stroke="rgba(96,165,250,0.25)"
          stroke-width="1"
          stroke-dasharray="6 8"
        />
        <path
          :d="pathD"
          fill="none"
          stroke="rgba(167,139,250,0.35)"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path
          :d="pathPlayedD"
          fill="none"
          stroke="#a78bfa"
          stroke-width="4"
          stroke-linecap="round"
          marker-end="url(#arrowhead)"
        />
        <line
          :x1="pilotPx.x"
          :y1="pilotPx.y"
          :x2="dronePx.x"
          :y2="dronePx.y"
          stroke="rgba(167,139,250,0.25)"
          stroke-width="1"
          stroke-dasharray="4 4"
        />
        <g :transform="`translate(${devicePx.x - 18}, ${devicePx.y - 36})`">
          <rect width="36" height="36" rx="6" fill="#1e3a5f" stroke="#60a5fa" stroke-width="1.5" />
          <text x="18" y="22" text-anchor="middle" fill="#93c5fd" font-size="11">设备</text>
        </g>
        <g :transform="`translate(${pilotPx.x - 18}, ${pilotPx.y - 36})`">
          <rect width="36" height="36" rx="6" fill="#422006" stroke="#fbbf24" stroke-width="1.5" />
          <text x="18" y="22" text-anchor="middle" fill="#fde68a" font-size="11">飞手</text>
        </g>
        <g :transform="`translate(${dronePx.x - 20}, ${dronePx.y - 44})`">
          <circle cx="20" cy="20" r="18" fill="#4c1d95" stroke="#c4b5fd" stroke-width="2" />
          <text x="20" y="24" text-anchor="middle" fill="#ede9fe" font-size="10">无人机</text>
        </g>
      </svg>
      <div class="trajectory-replay__coords">
        <span>当前：E {{ currentLng }} N {{ currentLat }}</span>
        <span>高度 {{ currentSample.altitude }}m</span>
        <span>速度 {{ currentSpeed }}m/s</span>
        <span>航向 {{ currentHeading }}°</span>
        <span>状态 {{ currentStatus }}</span>
        <span>进度 {{ progress.toFixed(0) }}%</span>
        <span>时间 {{ currentRecordTime }}</span>
        <span>来源 {{ detail.dataSource }}</span>
      </div>
    </div>

    <div class="trajectory-replay__controls">
      <div class="trajectory-replay__times">
        <span>{{ detail.discoveredAt }}</span>
        <span>{{ detail.endedAt }}</span>
      </div>
      <div class="trajectory-replay__slider-wrap">
        <div class="trajectory-replay__markers">
          <span
            v-for="m in detail.markers"
            :key="m.key"
            class="trajectory-replay__marker"
            :style="{ left: `${m.progress}%` }"
          >
            <i class="trajectory-replay__marker-tick"></i>
            <span class="trajectory-replay__marker-label">{{ m.label }}</span>
          </span>
        </div>
        <ElSlider
          v-model="progress"
          class="trajectory-replay__slider"
          :min="0"
          :max="100"
          :step="0.5"
          :format-tooltip="(v: number) => `${v.toFixed(0)}%`"
          @change="pause"
        />
      </div>
      <div class="trajectory-replay__toolbar">
        <BaseButton type="primary" size="small" @click="togglePlay">
          {{ playing ? '暂停' : progress >= 100 ? '重新播放' : '播放' }}
        </BaseButton>
        <span class="trajectory-replay__speed-label">速率</span>
        <ElSelect v-model="speed" size="small" class="trajectory-replay__speed-select">
          <ElOption v-for="s in speedOptions" :key="s" :label="`${s}X`" :value="s" />
        </ElSelect>
        <span class="trajectory-replay__progress-text">{{ progress.toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.trajectory-replay {
  &__map {
    position: relative;
    height: 420px;
    border-radius: 8px;
    overflow: hidden;
    background: linear-gradient(160deg, #0f172a 0%, #1e293b 45%, #134e4a 100%);
    border: 1px solid var(--el-border-color);
  }

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__coords {
    position: absolute;
    left: 12px;
    bottom: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    max-width: calc(100% - 24px);
    padding: 4px 10px;
    font-size: 12px;
    color: #e2e8f0;
    background: rgba(15, 23, 42, 0.75);
    border-radius: 4px;
  }

  &__controls {
    margin-top: 12px;
    padding: 12px 16px 16px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__times {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__slider-wrap {
    position: relative;
    padding: 0 8px;
    margin-bottom: 4px;
  }

  &__markers {
    position: relative;
    height: 32px;
    margin-bottom: 2px;
  }

  &__marker {
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
    pointer-events: none;
  }

  &__marker-tick {
    display: block;
    width: 0;
    height: 0;
    margin-bottom: 2px;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid var(--el-color-primary);
  }

  &__marker-label {
    font-size: 11px;
    line-height: 1.2;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  &__slider {
    :deep(.el-slider__runway) {
      margin: 8px 0;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 4px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__speed-label {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__speed-select {
    width: 88px;
  }

  &__progress-text {
    margin-left: auto;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

@media (max-width: 1200px) {
  .trajectory-replay {
    &__telemetry {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .trajectory-replay {
    &__telemetry {
      grid-template-columns: 1fr;
    }
  }
}
</style>
