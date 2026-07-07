<script setup lang="ts">
import {
  getFlightRecordDayDetailApi,
  getFlightRecordDaySummariesApi,
  getFlightRecordEventDetailApi
} from '@/api/lad/flightRecord'
import type { FlightRecordDayDetail, FlightRecordDaySummary, FlightRecordSegment } from '@/api/lad/flightRecord/types'
import type { HistoryEventDetail } from '@/api/lad/incident/types'
import { Icon } from '@/components/Icon'
import LadVideoMonitor from '@/views/Lad/shared/LadVideoMonitor.vue'
import { ElOption, ElSelect } from 'element-plus'
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import FlightRecordDateTimeline from './components/FlightRecordDateTimeline.vue'
import FlightRecordMap from './components/FlightRecordMap.vue'
import FlightRecordSegmentList from './components/FlightRecordSegmentList.vue'
import FlightRecordTimeline from './components/FlightRecordTimeline.vue'
import type { FlightRecordMapItem } from './flightRecordMapTypes'
import {
  formatDateLabel,
  formatDatetime,
  formatTimeOnly,
  parseDatetimeMs,
  resolveSegmentBounds,
  resolveSegmentProgress
} from './flightRecordTime'

defineOptions({ name: 'LadFlightRecord' })

const speedOptions = [1, 2, 5, 10, 20]

const loading = ref(false)
const daySummaries = ref<FlightRecordDaySummary[]>([])
const dayDetail = ref<FlightRecordDayDetail | null>(null)
const selectedDate = ref('')
const selectedSegmentId = ref('')
const activeSegmentId = ref('')
const eventDetail = ref<HistoryEventDetail | null>(null)
const eventDetailCache = ref<Record<string, HistoryEventDetail>>({})
const currentTimeMs = ref(0)
const playing = ref(false)
const speed = ref(5)
const trajectoryProgress = ref(0)
const videoExpanded = ref(false)
const scrubbing = ref(false)

const videoRef = ref<InstanceType<typeof LadVideoMonitor> | null>(null)

let rafId = 0
let lastTs = 0

const segments = computed(() => dayDetail.value?.segments || [])

function getSelectedSegment(): FlightRecordSegment | null {
  return segments.value.find((segment) => segment.id === selectedSegmentId.value) || null
}

const activeSegment = computed(
  () => segments.value.find((item) => item.id === activeSegmentId.value) || null
)

const playbackSegment = computed(() => getSelectedSegment() || activeSegment.value)

const dayStartMs = computed(() =>
  dayDetail.value ? parseDatetimeMs(dayDetail.value.dayStartAt) : 0
)
const dayEndMs = computed(() => (dayDetail.value ? parseDatetimeMs(dayDetail.value.dayEndAt) : 0))

const selectedDateLabel = computed(() =>
  selectedDate.value ? formatDateLabel(selectedDate.value) : ''
)

const orderedDates = computed(() =>
  [...daySummaries.value].sort((a, b) => (a.date < b.date ? -1 : 1)).map((item) => item.date)
)

const currentTimeLabel = computed(() => formatDatetime(currentTimeMs.value))

const videoRecordStart = computed(() => playbackSegment.value?.startAt || '')
const videoRecordEnd = computed(() => playbackSegment.value?.endAt || '')
const videoChannelLabel = computed(
  () => playbackSegment.value?.detectionDevice || '光电-01'
)
const videoLocationLabel = computed(() => playbackSegment.value?.zoneName || '厂区空域')

function isSegmentActiveAtTime(segment: FlightRecordSegment, timeMs: number) {
  const startMs = parseDatetimeMs(segment.startAt)
  const endMs = parseDatetimeMs(segment.endAt)
  return timeMs >= startMs && timeMs <= endMs
}

const MAX_MAP_DRONES = 4

/** 装饰用无人机固定散布点位（与真实轨迹无关） */
const DECORATIVE_DRONE_POSITIONS = [
  { x: 0.16, y: 0.22 },
  { x: 0.84, y: 0.26 },
  { x: 0.58, y: 0.76 }
] as const

function buildMapSegmentList(
  segmentList: FlightRecordSegment[],
  selectedSegment: FlightRecordSegment | undefined
): FlightRecordSegment[] {
  const uniqueSegments = new Map<string, FlightRecordSegment>()

  segmentList.forEach((segment) => {
    if (!uniqueSegments.has(segment.eventId)) {
      uniqueSegments.set(segment.eventId, segment)
    }
  })

  if (selectedSegment) {
    uniqueSegments.set(selectedSegment.eventId, selectedSegment)
  }

  const ordered: FlightRecordSegment[] = []
  if (selectedSegment) {
    ordered.push(selectedSegment)
  }

  for (const segment of uniqueSegments.values()) {
    if (selectedSegment && segment.eventId === selectedSegment.eventId) continue
    if (ordered.length >= MAX_MAP_DRONES) break
    ordered.push(segment)
  }

  if (!selectedSegment) {
    return [...uniqueSegments.values()].slice(0, MAX_MAP_DRONES)
  }

  return ordered
}

const mapItems = computed((): FlightRecordMapItem[] => {
  const timeMs = currentTimeMs.value
  const selectedSegment = segments.value.find((segment) => segment.id === selectedSegmentId.value)
  const selectedEventId = selectedSegment?.eventId

  return buildMapSegmentList(segments.value, selectedSegment)
    .map((segment, index) => {
      const detail = eventDetailCache.value[segment.eventId]
      if (!detail) return null
      const isSelected = Boolean(selectedEventId && segment.eventId === selectedEventId)
      const decorativeIndex = isSelected ? -1 : index - (selectedSegment ? 1 : 0)
      return {
        segmentId: segment.id,
        targetId: segment.targetId,
        detail,
        progress: isSelected
          ? resolveSegmentProgress(segment.startAt, segment.endAt, timeMs)
          : 0,
        showTrail: isSelected,
        decorativePos:
          decorativeIndex >= 0
            ? DECORATIVE_DRONE_POSITIONS[decorativeIndex % DECORATIVE_DRONE_POSITIONS.length]
            : undefined
      }
    })
    .filter((item): item is FlightRecordMapItem => item !== null)
})

async function ensureEventDetail(eventId: string): Promise<HistoryEventDetail | null> {
  const cached = eventDetailCache.value[eventId]
  if (cached) return cached

  try {
    const res = await getFlightRecordEventDetailApi(eventId)
    eventDetailCache.value = { ...eventDetailCache.value, [eventId]: res.data }
    return res.data
  } catch {
    return null
  }
}

async function preloadDayEventDetails(segmentList: FlightRecordSegment[]) {
  const selectedSegment = segments.value.find((segment) => segment.id === selectedSegmentId.value)
  const mapSegments = buildMapSegmentList(segmentList, selectedSegment)
  const eventIds = [...new Set(mapSegments.map((segment) => segment.eventId))]
  await Promise.all(eventIds.map((eventId) => ensureEventDetail(eventId)))
}

async function loadSummaries() {
  const res = await getFlightRecordDaySummariesApi()
  daySummaries.value = res.data
  if (!selectedDate.value && res.data.length) {
    selectedDate.value = res.data[0].date
  }
}

function findSegmentAtTimeInList(
  list: FlightRecordSegment[],
  timeMs: number
): FlightRecordSegment | null {
  return (
    list.find((segment) => {
      const startMs = parseDatetimeMs(segment.startAt)
      const endMs = parseDatetimeMs(segment.endAt)
      return timeMs >= startMs && timeMs <= endMs
    }) || null
  )
}

async function loadDayDetail(date: string, options: { timeMs?: number; keepPlaying?: boolean } = {}) {
  if (!date) return
  const wasPlaying = options.keepPlaying ?? playing.value
  loading.value = true
  try {
    const res = await getFlightRecordDayDetailApi(date)
    dayDetail.value = res.data
    const targetTimeMs = options.timeMs ?? parseDatetimeMs(res.data.dayStartAt)
    const segment = findSegmentAtTimeInList(res.data.segments, targetTimeMs) || res.data.segments[0]

    if (segment) {
      selectedSegmentId.value = segment.id
      activeSegmentId.value = segment.id
    } else {
      selectedSegmentId.value = ''
      activeSegmentId.value = ''
    }

    await preloadDayEventDetails(res.data.segments)

    if (segment) {
      await loadEventDetail(segment.eventId)
      currentTimeMs.value =
        options.timeMs != null ? targetTimeMs : parseDatetimeMs(segment.startAt)
      syncPlaybackVisuals()
    } else {
      eventDetail.value = null
      currentTimeMs.value = targetTimeMs
      trajectoryProgress.value = 0
    }

    if (wasPlaying) {
      play()
    }
  } finally {
    loading.value = false
  }
}

async function loadEventDetail(eventId: string) {
  const detail = await ensureEventDetail(eventId)
  eventDetail.value = detail
}

function syncPlaybackVisuals() {
  const segment = playbackSegment.value
  if (!segment) {
    trajectoryProgress.value = 0
    return
  }

  trajectoryProgress.value = resolveSegmentProgress(
    segment.startAt,
    segment.endAt,
    currentTimeMs.value
  )

  const segmentStartMs = parseDatetimeMs(segment.startAt)
  const offsetSec = Math.max(0, Math.floor((currentTimeMs.value - segmentStartMs) / 1000))
  nextTick(() => {
    videoRef.value?.seekTo(offsetSec, playing.value)
    if (playing.value) {
      videoRef.value?.play()
    }
  })
}

function findSegmentAtTime(timeMs: number): FlightRecordSegment | null {
  return (
    segments.value.find((segment) => {
      const startMs = parseDatetimeMs(segment.startAt)
      const endMs = parseDatetimeMs(segment.endAt)
      return timeMs >= startMs && timeMs <= endMs
    }) || null
  )
}

async function activateSegmentAtTime(timeMs: number) {
  const segment = findSegmentAtTime(timeMs)
  if (!segment) {
    activeSegmentId.value = ''
    trajectoryProgress.value = 0
    return
  }

  if (segment.id !== activeSegmentId.value) {
    activeSegmentId.value = segment.id
    if (segment.eventId !== eventDetail.value?.id) {
      await loadEventDetail(segment.eventId)
    }
  }

  syncPlaybackVisuals()
}

async function selectSegment(
  segment: FlightRecordSegment,
  options: { resetTime?: boolean } = {}
) {
  selectedSegmentId.value = segment.id
  activeSegmentId.value = segment.id
  if (options.resetTime) {
    currentTimeMs.value = parseDatetimeMs(segment.startAt)
  }
  await loadEventDetail(segment.eventId)
  syncPlaybackVisuals()
}

function pause() {
  playing.value = false
  lastTs = 0
  cancelAnimationFrame(rafId)
  videoRef.value?.pause()
}

function suspendLoop() {
  lastTs = 0
  cancelAnimationFrame(rafId)
  videoRef.value?.pause()
  // 保留 playing 状态：仅暂停循环，用于切页后按原状态决定是否恢复
}

function play() {
  const selected = getSelectedSegment()
  if (selected) {
    const { startMs, endMs } = resolveSegmentBounds(selected.startAt, selected.endAt)
    activeSegmentId.value = selected.id
    if (currentTimeMs.value < startMs || currentTimeMs.value >= endMs) {
      currentTimeMs.value = startMs
    }
    syncPlaybackVisuals()
  } else if (currentTimeMs.value >= dayEndMs.value) {
    currentTimeMs.value = dayStartMs.value
  }

  playing.value = true
  lastTs = 0
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(tick)
  nextTick(() => {
    videoRef.value?.setPlaybackRate(speed.value)
    videoRef.value?.play()
  })
}

function resumeIfPlaying() {
  if (playing.value && !scrubbing.value) {
    play()
  }
}

function togglePlay() {
  if (playing.value) pause()
  else play()
}

const tick = async (ts: number) => {
  if (!playing.value || scrubbing.value) return
  if (!lastTs) lastTs = ts
  const deltaSec = (ts - lastTs) / 1000
  lastTs = ts

  const selected = getSelectedSegment()
  const nextMs = currentTimeMs.value + deltaSec * speed.value * 1000

  if (selected) {
    const { endMs } = resolveSegmentBounds(selected.startAt, selected.endAt)
    if (nextMs >= endMs) {
      currentTimeMs.value = endMs
      syncPlaybackVisuals()
      pause()
      return
    }
    currentTimeMs.value = nextMs
    syncPlaybackVisuals()
  } else {
    if (nextMs >= dayEndMs.value) {
      currentTimeMs.value = dayEndMs.value
      pause()
      return
    }
    currentTimeMs.value = nextMs
    await activateSegmentAtTime(currentTimeMs.value)
  }

  rafId = requestAnimationFrame(tick)
}

function onTimelineSeekStart() {
  scrubbing.value = true
  suspendLoop()
}

async function onTimelineSeek(timeMs: number) {
  currentTimeMs.value = timeMs
  await activateSegmentAtTime(timeMs)
}

function onTimelineSeekEnd() {
  scrubbing.value = false
  resumeIfPlaying()
}

async function shiftTimelineDay(direction: -1 | 1) {
  const dates = orderedDates.value
  const index = dates.indexOf(selectedDate.value)
  if (index < 0) return
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= dates.length) return
  const nextDate = dates[nextIndex]
  const timeMs =
    direction < 0
      ? parseDatetimeMs(`${nextDate} 23:00:00`)
      : parseDatetimeMs(`${nextDate} 00:00:00`)
  selectedDate.value = nextDate
  await loadDayDetail(nextDate, { timeMs, keepPlaying: playing.value })
}

async function onTimelineSeekPrevDay() {
  await shiftTimelineDay(-1)
}

async function onTimelineSeekNextDay() {
  await shiftTimelineDay(1)
}

async function onDateSelect(date: string) {
  selectedDate.value = date
  await loadDayDetail(date, {
    timeMs: parseDatetimeMs(`${date} 00:00:00`),
    keepPlaying: playing.value
  })
}

function toggleVideoExpanded() {
  videoExpanded.value = !videoExpanded.value
  if (!videoExpanded.value) {
    videoRef.value?.pause()
    return
  }
  nextTick(() => syncPlaybackVisuals())
}

async function onSegmentSelect(segment: FlightRecordSegment) {
  const keepPlaying = playing.value
  if (keepPlaying) suspendLoop()
  currentTimeMs.value = parseDatetimeMs(segment.startAt)
  await selectSegment(segment)
  await ensureEventDetail(segment.eventId)
  await preloadDayEventDetails(segments.value)
  if (keepPlaying) play()
}

async function initPage() {
  loading.value = true
  try {
    await loadSummaries()
    if (selectedDate.value) {
      await loadDayDetail(selectedDate.value)
    }
  } finally {
    loading.value = false
  }
}

watch(speed, () => {
  if (playing.value) {
    videoRef.value?.setPlaybackRate(speed.value)
  }
})

onBeforeUnmount(() => {
  pause()
})

onDeactivated(() => {
  if (playing.value) suspendLoop()
})

onActivated(() => {
  resumeIfPlaying()
})

initPage()
</script>

<template>
  <div v-loading="loading" class="flight-record-page">
    <header class="flight-record-page__toolbar">
      <div class="flight-record-page__toolbar-left">
        <div class="flight-record-page__title">飞行记录</div>
        <div class="flight-record-page__subtitle">地图化回放过往飞行记录，联动光电视频与时段列表</div>
      </div>
      <div class="flight-record-page__toolbar-right">
        <div class="flight-record-page__clock">
          <span class="flight-record-page__clock-label">当前时间</span>
          <strong>{{ currentTimeLabel }}</strong>
        </div>
        <span class="flight-record-page__speed-label">倍速</span>
        <ElSelect v-model="speed" size="small" class="flight-record-page__speed-select">
          <ElOption v-for="item in speedOptions" :key="item" :label="`${item}X`" :value="item" />
        </ElSelect>
      </div>
    </header>

    <div class="flight-record-page__body">
      <FlightRecordSegmentList
        :segments="segments"
        :selected-id="selectedSegmentId"
        :active-id="activeSegmentId"
        @select="onSegmentSelect"
      />

      <div class="flight-record-page__stage">
        <FlightRecordMap :items="mapItems" />

        <div
          v-if="playbackSegment"
          class="flight-record-page__video-panel"
          :class="{ 'is-collapsed': !videoExpanded }"
        >
          <div class="flight-record-page__video-header">
            <div class="flight-record-page__video-header-main">
              <span class="flight-record-page__video-title">光电视频</span>
              <span v-if="videoExpanded" class="flight-record-page__video-range">
                {{ formatTimeOnly(parseDatetimeMs(playbackSegment.startAt)) }}
                ~
                {{ formatTimeOnly(parseDatetimeMs(playbackSegment.endAt)) }}
              </span>
              <span v-else class="flight-record-page__video-range is-compact">
                {{ playbackSegment.targetId }}
              </span>
            </div>
            <button
              type="button"
              class="flight-record-page__video-toggle"
              :title="videoExpanded ? '收起光电视窗' : '展开光电视窗'"
              @click="toggleVideoExpanded"
            >
              <Icon :icon="videoExpanded ? 'vi-ep:arrow-up' : 'vi-ep:arrow-down'" :size="14" />
              <span>{{ videoExpanded ? '收起' : '展开' }}</span>
            </button>
          </div>
          <div v-show="videoExpanded" class="flight-record-page__video-body">
            <LadVideoMonitor
              ref="videoRef"
              :key="playbackSegment.id"
              :linked="true"
              :channel-label="videoChannelLabel"
              :location-label="videoLocationLabel"
              camera-label="光电跟踪 / 录像回放"
              :record-start="videoRecordStart"
              :record-end="videoRecordEnd"
              :screenshot-name-prefix="`飞行记录_${playbackSegment.targetId}`"
              aspect-ratio="16 / 9"
              compact
            />
          </div>
        </div>
      </div>
    </div>

    <div class="flight-record-page__playback">
      <FlightRecordTimeline
        v-if="dayDetail"
        :day-start-ms="dayStartMs"
        :day-end-ms="dayEndMs"
        :current-time-ms="currentTimeMs"
        :day-label="selectedDateLabel"
        :playing="playing"
        @seek="onTimelineSeek"
        @seek-start="onTimelineSeekStart"
        @seek-end="onTimelineSeekEnd"
        @toggle-play="togglePlay"
        @seek-prev-day="onTimelineSeekPrevDay"
        @seek-next-day="onTimelineSeekNextDay"
      />
      <FlightRecordDateTimeline
        :days="daySummaries"
        :selected-date="selectedDate"
        @select="onDateSelect"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.flight-record-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 118px);
  min-height: 640px;
  margin: -10px;
  background: var(--el-bg-color-page);

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__toolbar-left {
    min-width: 0;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__clock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-right: 8px;
    font-family: monospace;

    strong {
      font-size: 15px;
      color: var(--el-color-primary);
    }
  }

  &__clock-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  &__speed-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__speed-select {
    width: 88px;
  }

  &__body {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  }

  &__stage {
    position: relative;
    min-width: 0;
    min-height: 0;
    padding: 12px;
  }

  &__video-panel {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 600;
    width: min(360px, 34vw);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.28);
    border-radius: 10px;
    overflow: hidden;
    background: #09151a;
    transition:
      width 0.2s ease,
      box-shadow 0.2s ease;

    &.is-collapsed {
      width: auto;
      min-width: 220px;
      max-width: min(320px, 40vw);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);
    }
  }

  &__video-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 10px;
    font-size: 12px;
    color: #bce7dc;
    background: #0d222a;
    border-bottom: 1px solid #273e49;
  }

  &__video-panel.is-collapsed &__video-header {
    border-bottom: none;
  }

  &__video-header-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__video-title {
    font-weight: 600;
  }

  &__video-range {
    font-size: 11px;
    font-family: monospace;
    color: #8fb5ac;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.is-compact {
      font-family: inherit;
    }
  }

  &__video-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding: 4px 8px;
    border: 1px solid rgba(188, 231, 220, 0.35);
    border-radius: 4px;
    background: rgba(4, 14, 18, 0.72);
    color: #d4f4ea;
    font-size: 11px;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(16, 48, 58, 0.88);
    }
  }

  &__video-body {
    max-height: min(52vh, 420px);
    overflow: auto;
  }

  &__playback {
    flex-shrink: 0;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-light);
  }
}

@media (max-width: 1100px) {
  .flight-record-page {
    height: auto;
    min-height: calc(100vh - 118px);

    &__body {
      grid-template-columns: 1fr;
      grid-template-rows: auto minmax(420px, 1fr);
    }

    &__video-panel {
      position: static;
      width: 100%;
      margin-top: 12px;
      box-shadow: none;
    }
  }
}
</style>
