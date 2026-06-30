<script setup lang="ts">
import type { HistoryEventDetail, TrajectoryPoint } from '@/api/lad/incident/types'
import { BaseButton } from '@/components/Button'
import { ElOption, ElSelect, ElSlider } from 'element-plus'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  getTrajectorySnapshotAtProgress,
  sampleTrajectoryAtProgress
} from '../trajectoryListRows'

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
  return sampleTrajectoryAtProgress(props.detail.trajectory, pct)
}

const currentSample = computed(() => sampleAt(progress.value))

const trajectorySnapshot = computed(
  () => getTrajectorySnapshotAtProgress(props.detail, progress.value)
)

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
      <div v-if="trajectorySnapshot" class="trajectory-replay__coords">
        <span>目标ID {{ trajectorySnapshot.targetId }}</span>
        <span>时间 {{ trajectorySnapshot.time }}</span>
        <span>高度 {{ trajectorySnapshot.altitude }}m</span>
        <span>经度 E {{ trajectorySnapshot.longitude }}</span>
        <span>纬度 N {{ trajectorySnapshot.latitude }}</span>
        <span>距离 {{ trajectorySnapshot.distance }}m</span>
        <span>速度 {{ trajectorySnapshot.speed }}m/s</span>
        <span>方位角 {{ trajectorySnapshot.azimuth }}°</span>
        <span>俯仰角 {{ trajectorySnapshot.pitch }}°</span>
      </div>
    </div>

    <div class="trajectory-replay__controls">
      <div class="trajectory-replay__slider-wrap">
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
    top: 12px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px 14px;
    max-width: calc(100% - 24px);
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.4;
    color: #e2e8f0;
    background: rgba(15, 23, 42, 0.82);
    border-radius: 6px;
  }

  &__controls {
    margin-top: 12px;
    padding: 12px 16px 16px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__slider-wrap {
    padding: 0 8px;
    margin-bottom: 4px;
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

@media (max-width: 768px) {
  .trajectory-replay {
    &__coords {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}
</style>
