<script setup lang="ts">
import { Icon } from '@/components/Icon'
import { ElButton } from 'element-plus'
import { computed, onBeforeUnmount, ref } from 'vue'
import { formatTimeOnly } from '../flightRecordTime'

const props = defineProps<{
  dayStartMs: number
  dayEndMs: number
  currentTimeMs: number
  dayLabel?: string
  playing?: boolean
}>()

const emit = defineEmits<{
  seek: [timeMs: number]
  'seek-start': []
  'seek-end': []
  'seek-prev-day': []
  'seek-next-day': []
  'toggle-play': []
}>()

const trackRef = ref<HTMLElement | null>(null)
const dragging = ref(false)

const daySpanMs = computed(() => Math.max(props.dayEndMs - props.dayStartMs, 1))

const progressPercent = computed(() => {
  const ratio = (props.currentTimeMs - props.dayStartMs) / daySpanMs.value
  return Math.max(0, Math.min(100, ratio * 100))
})

const playIcon = computed(() => (props.playing ? 'vi-ep:video-pause' : 'vi-ep:video-play'))

function percentFromClientX(clientX: number) {
  const track = trackRef.value
  if (!track) return 0
  const rect = track.getBoundingClientRect()
  const ratio = (clientX - rect.left) / rect.width
  return Math.max(0, Math.min(100, ratio * 100))
}

function seekByPercent(percent: number) {
  emit('seek', props.dayStartMs + (daySpanMs.value * percent) / 100)
}

function onDocPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  seekByPercent(percentFromClientX(event.clientX))
}

function endDrag() {
  if (!dragging.value) return
  dragging.value = false
  document.removeEventListener('pointermove', onDocPointerMove)
  document.removeEventListener('pointerup', endDrag)
  emit('seek-end')
}

function startDrag(event: PointerEvent) {
  dragging.value = true
  emit('seek-start')
  seekByPercent(percentFromClientX(event.clientX))
  document.addEventListener('pointermove', onDocPointerMove)
  document.addEventListener('pointerup', endDrag)
}

function onTrackPointerDown(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('.flight-record-timeline__thumb')) return
  startDrag(event)
}

function onThumbPointerDown(event: PointerEvent) {
  event.stopPropagation()
  startDrag(event)
}

function onTogglePlay() {
  emit('toggle-play')
}

onBeforeUnmount(() => endDrag())
</script>

<template>
  <div class="flight-record-timeline">
    <div class="flight-record-timeline__head">
      <span class="flight-record-timeline__label">时间轴</span>
      <span v-if="dayLabel" class="flight-record-timeline__day">{{ dayLabel }}</span>
    </div>

    <div class="flight-record-timeline__controls">
      <ElButton type="primary" class="flight-record-timeline__play-btn" @click="onTogglePlay">
        <Icon :icon="playIcon" :size="16" class="flight-record-timeline__play-btn-icon" />
        {{ playing ? '暂停' : '开始' }}
      </ElButton>

      <div class="flight-record-timeline__bar" :class="{ 'is-dragging': dragging }">
        <button
          type="button"
          class="flight-record-timeline__pad"
          title="前一天"
          @click="emit('seek-prev-day')"
        />

        <div ref="trackRef" class="flight-record-timeline__track" @pointerdown="onTrackPointerDown">
          <div class="flight-record-timeline__track-bg" />
          <div class="flight-record-timeline__fill" :style="{ width: `${progressPercent}%` }" />
          <div
            class="flight-record-timeline__thumb"
            :style="{ left: `${progressPercent}%` }"
            @pointerdown="onThumbPointerDown"
          />
        </div>

        <button
          type="button"
          class="flight-record-timeline__pad"
          title="后一天"
          @click="emit('seek-next-day')"
        />
      </div>
    </div>

    <div class="flight-record-timeline__times">
      <span>{{ formatTimeOnly(dayStartMs) }}</span>
      <span>{{ formatTimeOnly(dayEndMs) }}</span>
    </div>
  </div>
</template>

<style scoped lang="less">
.flight-record-timeline {
  padding: 12px 16px 8px;
  background: linear-gradient(180deg, var(--el-bg-color) 0%, var(--el-fill-color-blank) 100%);
  border-top: 1px solid var(--el-border-color-lighter);

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__day {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__play-btn {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    min-width: 80px;
    height: 36px;
    padding: 0 16px;
  }

  &__play-btn-icon {
    margin-right: 4px;
    vertical-align: -2px;
  }

  &__bar {
    display: flex;
    flex: 1;
    align-items: stretch;
    min-width: 0;
    height: 22px;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    user-select: none;
    touch-action: none;

    &.is-dragging {
      cursor: grabbing;
    }
  }

  &__pad {
    flex-shrink: 0;
    width: 28px;
    padding: 0;
    border: none;
    background: linear-gradient(180deg, #d8dde6 0%, #c2c9d4 100%);
    cursor: pointer;
    transition: filter 0.15s ease;

    &:hover {
      filter: brightness(0.95);
    }
  }

  &__track {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: visible;
  }

  &__track-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #fafbfc 0%, #f0f2f5 100%);
    border-left: 1px solid rgba(0, 0, 0, 0.06);
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }

  &__fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      var(--el-color-primary-light-3) 0%,
      var(--el-color-primary) 100%
    );
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.2);
    pointer-events: none;
    transition: width 0.05s linear;
  }

  &__thumb {
    position: absolute;
    top: 50%;
    z-index: 2;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: var(--el-color-primary);
    box-shadow:
      0 0 0 1px rgba(64, 158, 255, 0.3),
      0 2px 6px rgba(0, 0, 0, 0.18);
    transform: translateY(-50%);
    cursor: grab;
    transition: box-shadow 0.15s ease;

    &:hover {
      box-shadow:
        0 0 0 3px rgba(64, 158, 255, 0.25),
        0 2px 8px rgba(0, 0, 0, 0.22);
    }

    .is-dragging & {
      cursor: grabbing;
    }
  }

  &__times {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    padding: 0 28px 0 92px;
    font-size: 11px;
    font-family: monospace;
    color: var(--el-text-color-secondary);
  }
}
</style>
