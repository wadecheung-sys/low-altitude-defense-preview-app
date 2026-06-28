<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElTooltip } from 'element-plus'
import { Icon } from '@/components/Icon'
import deviceSiteCctv from '@/assets/imgs/device-site-cctv.png'

const props = withDefaults(
  defineProps<{
    channelLabel?: string
    locationLabel?: string
    /** 画面左上角机位说明 */
    cameraLabel?: string
    imageSrc?: string
    timestamp?: string
    live?: boolean
    showScreenshot?: boolean
    /** 是否显示播放/暂停控制 */
    showPlayback?: boolean
    aspectRatio?: string
    /** 截图文件前缀，默认「视频监控截图」 */
    screenshotNamePrefix?: string
    /** 离线占位文案 */
    emptyText?: string
  }>(),
  {
    channelLabel: '值守监控-01',
    locationLabel: '联动监控位',
    cameraLabel: '固定机位 / 联动监控',
    imageSrc: '',
    timestamp: '',
    live: true,
    showScreenshot: true,
    showPlayback: true,
    aspectRatio: '4 / 3',
    screenshotNamePrefix: '视频监控截图',
    emptyText: '暂无画面，接入视频源后展示'
  }
)

const frameRef = ref<HTMLImageElement | null>(null)
const capturing = ref(false)
const playing = ref(true)

watch(
  () => props.live,
  (online) => {
    if (online) playing.value = true
  }
)

const togglePlayback = () => {
  if (!props.live) {
    ElMessage.warning('光电离线，无法播放')
    return
  }
  playing.value = !playing.value
}

const playbackLabel = computed(() => (playing.value ? '暂停' : '播放'))
const playbackIcon = computed(() => (playing.value ? 'vi-ep:video-pause' : 'vi-ep:video-play'))

const poster = computed(() => props.imageSrc || deviceSiteCctv)

const displayTime = computed(() => {
  if (props.timestamp) return props.timestamp
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
})

const captureScreenshot = async () => {
  if (!props.live) {
    ElMessage.warning('监控离线，无法截图')
    return
  }
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
    ctx.fillText(`${props.channelLabel} · ${displayTime.value}`, 12, height - 10)

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
        <i class="lad-video-monitor__live-dot" :class="{ 'is-offline': !live }"></i>
        {{ live ? 'LIVE' : 'OFFLINE' }} · {{ channelLabel }}
      </span>
      <span>{{ locationLabel }}</span>
    </div>

    <div class="lad-video-monitor__view" :style="{ aspectRatio }">
      <template v-if="live">
        <img
          ref="frameRef"
          :src="poster"
          alt="视频监控画面"
          class="lad-video-monitor__frame"
          :class="{ 'is-paused': !playing }"
          crossorigin="anonymous"
        />
        <div class="lad-video-monitor__grain" :class="{ 'is-paused': !playing }"></div>
        <div class="lad-video-monitor__camera-label">{{ cameraLabel }}</div>
        <div class="lad-video-monitor__timestamp">{{ displayTime }}</div>
        <div v-if="!playing" class="lad-video-monitor__paused-mask">已暂停</div>
      </template>
      <div v-else class="lad-video-monitor__empty">{{ emptyText }}</div>
    </div>

    <div v-if="showPlayback || showScreenshot" class="lad-video-monitor__controls">
      <ElTooltip v-if="showPlayback" :content="playbackLabel" placement="top">
        <button
          type="button"
          class="lad-video-monitor__action-btn"
          aria-label="播放暂停"
          @click="togglePlayback"
        >
          <Icon :icon="playbackIcon" :size="16" />
          <span>{{ playbackLabel }}</span>
        </button>
      </ElTooltip>
      <ElTooltip v-if="showScreenshot" content="截图" placement="top">
        <button
          type="button"
          class="lad-video-monitor__action-btn"
          :disabled="capturing || !live"
          aria-label="截图"
          @click="captureScreenshot"
        >
          <Icon icon="vi-ep:camera" :size="16" />
          <span>截图</span>
        </button>
      </ElTooltip>
    </div>

    <div class="lad-video-monitor__footer">
      <span>通道：{{ channelLabel }}</span>
      <span>画面状态：{{ live ? '正常' : '离线' }}</span>
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
    justify-content: flex-start;
    gap: 16px;
    color: #8fb5ac;
  }

  &__live-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 5px;
    border-radius: 50%;
    background: #42e3b4;
    box-shadow: 0 0 6px #42e3b4;

    &.is-offline {
      background: #909399;
      box-shadow: none;
    }
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

  &__camera-label,
  &__timestamp {
    position: absolute;
    z-index: 2;
    padding: 3px 6px;
    background: rgba(4, 14, 18, 0.58);
    color: #d4f4ea;
    font: 10px monospace;
    pointer-events: none;
  }

  &__camera-label {
    top: 8px;
    left: 8px;
  }

  &__timestamp {
    right: 8px;
    bottom: 8px;
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: #0a1c22;
    border-top: 1px solid #273e49;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 160px;
    padding: 16px;
    color: #8fb5ac;
    font-size: 12px;
    text-align: center;
    background: #101820;
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
