<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElOption, ElSelect, ElTooltip } from 'element-plus'
import { Icon } from '@/components/Icon'
import deviceSiteCctv from '@/assets/imgs/device-site-cctv.png'
import {
  LAD_EO_DEFAULT_DURATION_SEC,
  LAD_EO_PLAYBACK_RATES
} from './ladVideoConstants'

const props = withDefaults(
  defineProps<{
    channelLabel?: string
    locationLabel?: string
    /** 画面左上角机位说明 */
    cameraLabel?: string
    poster?: string
    /** 录像起始时间（展示） */
    recordStart?: string
    /** 录像结束时间（展示） */
    recordEnd?: string
    /** 是否已接入光电设备（仅影响状态文案） */
    linked?: boolean
    aspectRatio?: string
    screenshotNamePrefix?: string
    /** 快进 / 快退步长（秒） */
    seekStepSec?: number
  }>(),
  {
    channelLabel: '光电-01',
    locationLabel: '事件关联区域',
    cameraLabel: '光电跟踪 / 录像回放',
    poster: '',
    recordStart: '',
    recordEnd: '',
    linked: true,
    aspectRatio: '4 / 3',
    screenshotNamePrefix: '光电录像截图',
    seekStepSec: 10
  }
)

const frameRef = ref<HTMLImageElement | null>(null)
const playing = ref(false)
const capturing = ref(false)
const playbackRate = ref(1)
const progressCurrent = ref(0)

let tickTimer: ReturnType<typeof setInterval> | null = null

const posterSrc = computed(() => props.poster || deviceSiteCctv)

const progressDuration = computed(() => resolveRecordDurationSec(props.recordStart, props.recordEnd))

const statusTag = computed(() => (props.linked ? 'REPLAY' : 'DEMO'))

const statusLabel = computed(() => (props.linked ? '可回放' : '演示回放'))

const recordRangeLabel = computed(() => {
  if (props.recordStart && props.recordEnd) {
    return `${props.recordStart} ~ ${props.recordEnd}`
  }
  if (props.recordStart) return `起 ${props.recordStart}`
  return '事件关联录像'
})

const timeLabel = computed(
  () => `${formatClock(progressCurrent.value)} / ${formatClock(progressDuration.value)}`
)

const playbackIcon = computed(() => (playing.value ? 'vi-ep:video-pause' : 'vi-ep:video-play'))
const playbackLabel = computed(() => (playing.value ? '暂停' : '播放'))

function resolveRecordDurationSec(start: string, end: string) {
  if (start && end) {
    const begin = Date.parse(start.replace(/-/g, '/'))
    const finish = Date.parse(end.replace(/-/g, '/'))
    if (Number.isFinite(begin) && Number.isFinite(finish) && finish > begin) {
      return Math.round((finish - begin) / 1000)
    }
  }
  return LAD_EO_DEFAULT_DURATION_SEC
}

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(progressDuration.value, value))
}

function stopTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function startTick() {
  stopTick()
  tickTimer = setInterval(() => {
    const next = progressCurrent.value + playbackRate.value
    if (next >= progressDuration.value) {
      progressCurrent.value = progressDuration.value
      playing.value = false
      stopTick()
      return
    }
    progressCurrent.value = next
  }, 1000)
}

function seekTo(time: number, autoPlay = false) {
  progressCurrent.value = clampProgress(time)
  if (progressCurrent.value >= progressDuration.value) {
    playing.value = false
    stopTick()
    return
  }
  if (autoPlay) {
    playing.value = true
    startTick()
  }
}

watch(playing, (isPlaying) => {
  if (isPlaying) startTick()
  else stopTick()
})

watch(
  () => [props.recordStart, props.recordEnd] as const,
  () => {
    progressCurrent.value = clampProgress(progressCurrent.value)
    if (playing.value && progressCurrent.value >= progressDuration.value) {
      playing.value = false
    }
  }
)

onBeforeUnmount(() => stopTick())

const togglePlayback = () => {
  if (progressCurrent.value >= progressDuration.value) {
    progressCurrent.value = 0
  }
  playing.value = !playing.value
}

const seekStart = () => seekTo(0, true)

const seekEnd = () => {
  progressCurrent.value = progressDuration.value
  playing.value = false
  stopTick()
}

const rewind = () => {
  seekTo(progressCurrent.value - props.seekStepSec)
}

const forward = () => {
  seekTo(progressCurrent.value + props.seekStepSec)
}

const onRateChange = (rate: number) => {
  playbackRate.value = rate
}

const captureScreenshot = async () => {
  const img = frameRef.value
  if (!img || !img.complete) {
    ElMessage.warning('画面尚未就绪，请稍后再试')
    return
  }

  capturing.value = true
  try {
    const width = img.naturalWidth || 960
    const height = img.naturalHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      ElMessage.error('截图失败')
      return
    }

    ctx.drawImage(img, 0, 0, width, height)
    ctx.fillStyle = 'rgba(4, 14, 18, 0.62)'
    ctx.fillRect(0, height - 32, width, 32)
    ctx.fillStyle = '#d4f4ea'
    ctx.font = '14px monospace'
    ctx.fillText(`${props.channelLabel} · ${timeLabel.value}`, 12, height - 10)

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('empty blob'))
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${props.screenshotNamePrefix}_${Date.now()}.png`
        link.click()
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    })
    ElMessage.success('截图已保存')
  } catch {
    ElMessage.error('截图失败')
  } finally {
    capturing.value = false
  }
}
</script>

<template>
  <div class="lad-video-monitor">
    <div class="lad-video-monitor__topbar">
      <span>
        <i class="lad-video-monitor__replay-dot" :class="{ 'is-demo': !linked }"></i>
        {{ statusTag }} · {{ channelLabel }}
      </span>
      <span>{{ locationLabel }}</span>
    </div>

    <div class="lad-video-monitor__view" :style="{ aspectRatio }">
      <img
        ref="frameRef"
        :src="posterSrc"
        alt="光电录像画面"
        class="lad-video-monitor__frame"
        :class="{ 'is-paused': !playing }"
        crossorigin="anonymous"
      />
      <div class="lad-video-monitor__grain" :class="{ 'is-paused': !playing }"></div>
      <div class="lad-video-monitor__camera-label">{{ cameraLabel }}</div>
      <div v-if="!linked" class="lad-video-monitor__demo-badge">演示录像</div>
      <div v-if="!playing" class="lad-video-monitor__paused-mask">已暂停</div>
    </div>

    <div class="lad-video-monitor__controls">
      <div class="lad-video-monitor__controls-title">录像回放控制</div>
      <div class="lad-video-monitor__controls-row">
        <span class="lad-video-monitor__time">{{ timeLabel }}</span>

        <ElTooltip content="回到开始" placement="top">
          <button type="button" class="lad-video-monitor__action-btn" @click="seekStart">
            <Icon icon="vi-ep:d-arrow-left" :size="16" />
            <span>开始</span>
          </button>
        </ElTooltip>

        <ElTooltip :content="`快退 ${seekStepSec} 秒`" placement="top">
          <button type="button" class="lad-video-monitor__action-btn" @click="rewind">
            <Icon icon="vi-ep:back" :size="16" />
            <span>快退</span>
          </button>
        </ElTooltip>

        <ElTooltip :content="playbackLabel" placement="top">
          <button type="button" class="lad-video-monitor__action-btn" @click="togglePlayback">
            <Icon :icon="playbackIcon" :size="16" />
            <span>{{ playbackLabel }}</span>
          </button>
        </ElTooltip>

        <ElTooltip :content="`快进 ${seekStepSec} 秒`" placement="top">
          <button type="button" class="lad-video-monitor__action-btn" @click="forward">
            <Icon icon="vi-ep:right" :size="16" />
            <span>快进</span>
          </button>
        </ElTooltip>

        <ElTooltip content="跳到结束并暂停" placement="top">
          <button type="button" class="lad-video-monitor__action-btn" @click="seekEnd">
            <Icon icon="vi-ep:d-arrow-right" :size="16" />
            <span>结束</span>
          </button>
        </ElTooltip>

        <div class="lad-video-monitor__rate">
          <span class="lad-video-monitor__rate-label">速率</span>
          <ElSelect
            :model-value="playbackRate"
            size="small"
            class="lad-video-monitor__rate-select"
            @change="onRateChange"
          >
            <ElOption
              v-for="rate in LAD_EO_PLAYBACK_RATES"
              :key="rate"
              :label="`${rate}x`"
              :value="rate"
            />
          </ElSelect>
        </div>

        <ElTooltip content="截图" placement="top">
          <button
            type="button"
            class="lad-video-monitor__action-btn"
            :disabled="capturing"
            @click="captureScreenshot"
          >
            <Icon icon="vi-ep:camera" :size="16" />
            <span>截图</span>
          </button>
        </ElTooltip>
      </div>
    </div>

    <div class="lad-video-monitor__footer">
      <span>通道：{{ channelLabel }}</span>
      <span>录像时段：{{ recordRangeLabel }}</span>
      <span>状态：{{ statusLabel }}</span>
    </div>
  </div>
</template>

<style scoped lang="less">
.lad-video-monitor {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #273e49;
  border-radius: 8px;
  background: #09151a;
  color: #bce7dc;

  &__topbar,
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 10px;
    background: #0d222a;
    font: 11px monospace;
  }

  &__footer {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 16px;
    color: #8fb5ac;
  }

  &__replay-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 5px;
    border-radius: 50%;
    background: #5eb8ff;
    box-shadow: 0 0 6px #5eb8ff;

    &.is-demo {
      background: #e6a23c;
      box-shadow: 0 0 6px #e6a23c;
    }
  }

  &__demo-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(230, 162, 60, 0.88);
    color: #1a1205;
    font: 10px monospace;
    pointer-events: none;
  }

  &__view {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #101820;
  }

  &__frame {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.72) contrast(1.08) brightness(0.84);

    &.is-paused {
      filter: saturate(0.5) contrast(1.02) brightness(0.62);
    }
  }

  &__grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(0deg, transparent 0 3px, rgba(213, 238, 229, 0.055) 4px),
      linear-gradient(
        90deg,
        rgba(8, 26, 31, 0.12),
        transparent 25%,
        transparent 75%,
        rgba(8, 26, 31, 0.16)
      );

    &.is-paused {
      opacity: 0.35;
    }
  }

  &__paused-mask {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(4, 14, 18, 0.28);
    color: #d4f4ea;
    font-size: 14px;
    letter-spacing: 0.12em;
    pointer-events: none;
  }

  &__camera-label {
    position: absolute;
    z-index: 2;
    top: 8px;
    left: 8px;
    padding: 3px 6px;
    background: rgba(4, 14, 18, 0.58);
    color: #d4f4ea;
    font: 10px monospace;
    pointer-events: none;
  }

  &__time {
    min-width: 88px;
    padding: 4px 8px;
    border: 1px solid rgba(188, 231, 220, 0.2);
    border-radius: 4px;
    background: rgba(4, 14, 18, 0.55);
    color: #d4f4ea;
    font: 11px monospace;
  }

  &__controls {
    padding: 8px 10px;
    background: #0a1c22;
    border-top: 1px solid #273e49;
  }

  &__controls-title {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #8fb5ac;
    letter-spacing: 0.06em;
  }

  &__controls-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__rate {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 4px;
  }

  &__rate-label {
    font-size: 11px;
    color: #8fb5ac;
  }

  &__rate-select {
    width: 78px;

    :deep(.el-select__wrapper) {
      min-height: 26px;
      background: rgba(4, 14, 18, 0.72);
      box-shadow: 0 0 0 1px rgba(188, 231, 220, 0.35) inset;
    }

    :deep(.el-select__selected-item) {
      color: #d4f4ea;
      font-size: 11px;
    }
  }

  &__action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 1px solid rgba(188, 231, 220, 0.35);
    border-radius: 4px;
    background: rgba(4, 14, 18, 0.72);
    color: #d4f4ea;
    font-size: 11px;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: background 0.15s ease;

    &:hover:not(:disabled) {
      background: rgba(16, 48, 58, 0.88);
      border-color: rgba(100, 255, 208, 0.55);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }
}
</style>
