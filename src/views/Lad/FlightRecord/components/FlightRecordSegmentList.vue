<script setup lang="ts">
import type { FlightRecordSegment } from '@/api/lad/flightRecord/types'
import type { ThreatLevel } from '@/api/lad/incident/types'
import { ElEmpty, ElInput, ElOption, ElSelect, ElTag } from 'element-plus'
import { computed, ref } from 'vue'
import { formatTimeOnly, parseDatetimeMs } from '../flightRecordTime'

export type FlightRecordSegmentFilter = 'all' | '告警' | '主动录制'

const props = defineProps<{
  segments: FlightRecordSegment[]
  selectedId: string
  activeId: string
}>()

const emit = defineEmits<{
  select: [segment: FlightRecordSegment]
}>()

const kindFilter = ref<FlightRecordSegmentFilter>('all')
const targetIdKeyword = ref('')
const targetModelKeyword = ref('')
const zoneFilter = ref('')
const threatFilter = ref<ThreatLevel | ''>('')
const deviceKeyword = ref('')

const kindOptions: { value: FlightRecordSegmentFilter; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: '告警', label: '告警自动录制' },
  { value: '主动录制', label: '主动录制' }
]

const threatOptions: ThreatLevel[] = ['高危', '中危', '低危', '无危']

const zoneOptions = computed(() => {
  const zones = new Set(props.segments.map((item) => item.zoneName).filter(Boolean))
  return [...zones].sort()
})

const modelOptions = computed(() => {
  const models = new Set(props.segments.map((item) => item.targetModel).filter(Boolean))
  return [...models].sort()
})

const filteredSegments = computed(() => {
  const targetIdKw = targetIdKeyword.value.trim().toLowerCase()
  const modelKw = targetModelKeyword.value.trim().toLowerCase()
  const deviceKw = deviceKeyword.value.trim().toLowerCase()

  return props.segments.filter((item) => {
    if (kindFilter.value !== 'all' && item.kind !== kindFilter.value) return false
    if (targetIdKw && !item.targetId.toLowerCase().includes(targetIdKw)) return false
    if (modelKw && !item.targetModel.toLowerCase().includes(modelKw)) return false
    if (zoneFilter.value && item.zoneName !== zoneFilter.value) return false
    if (threatFilter.value && item.threatLevel !== threatFilter.value) return false
    if (deviceKw && !item.detectionDevice.toLowerCase().includes(deviceKw)) return false
    return true
  })
})

const isEmpty = computed(() => filteredSegments.value.length === 0)

function kindLabel(kind: FlightRecordSegment['kind']) {
  return kind === '告警' ? '告警自动录制' : kind
}

function kindTagType(kind: FlightRecordSegment['kind']) {
  return kind === '告警' ? 'danger' : 'success'
}

function isSelected(segment: FlightRecordSegment) {
  return segment.id === props.selectedId
}

function isActive(segment: FlightRecordSegment) {
  return segment.id === props.activeId
}

function onSelect(segment: FlightRecordSegment) {
  emit('select', segment)
}

function resetFilters() {
  kindFilter.value = 'all'
  targetIdKeyword.value = ''
  targetModelKeyword.value = ''
  zoneFilter.value = ''
  threatFilter.value = ''
  deviceKeyword.value = ''
}
</script>

<template>
  <aside class="flight-record-segment-list">
    <div class="flight-record-segment-list__header">
      <div class="flight-record-segment-list__title">时段列表</div>
      <div class="flight-record-segment-list__hint">点击时段联动地图与光电视窗</div>

      <div class="flight-record-segment-list__filters">
        <ElSelect
          v-model="kindFilter"
          size="small"
          class="flight-record-segment-list__filter-field"
          placeholder="录制类型"
        >
          <ElOption
            v-for="option in kindOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>

        <ElInput
          v-model="targetIdKeyword"
          size="small"
          clearable
          class="flight-record-segment-list__filter-field"
          placeholder="目标 ID"
        />

        <ElSelect
          v-model="targetModelKeyword"
          size="small"
          clearable
          filterable
          allow-create
          default-first-option
          class="flight-record-segment-list__filter-field"
          placeholder="目标型号"
        >
          <ElOption v-for="model in modelOptions" :key="model" :label="model" :value="model" />
        </ElSelect>

        <ElSelect
          v-model="zoneFilter"
          size="small"
          clearable
          class="flight-record-segment-list__filter-field"
          placeholder="区域"
        >
          <ElOption v-for="zone in zoneOptions" :key="zone" :label="zone" :value="zone" />
        </ElSelect>

        <ElSelect
          v-model="threatFilter"
          size="small"
          clearable
          class="flight-record-segment-list__filter-field"
          placeholder="威胁等级"
        >
          <ElOption v-for="level in threatOptions" :key="level" :label="level" :value="level" />
        </ElSelect>

        <ElInput
          v-model="deviceKeyword"
          size="small"
          clearable
          class="flight-record-segment-list__filter-field"
          placeholder="探测设备"
        />

        <button
          type="button"
          class="flight-record-segment-list__reset"
          @click="resetFilters"
        >
          重置
        </button>
      </div>
    </div>

    <ElEmpty v-if="isEmpty" description="当前筛选下暂无时段" :image-size="72" />

    <section v-else class="flight-record-segment-list__list">
      <button
        v-for="segment in filteredSegments"
        :key="segment.id"
        type="button"
        class="flight-record-segment-list__item"
        :class="{
          'is-selected': isSelected(segment),
          'is-active': isActive(segment)
        }"
        @click="onSelect(segment)"
      >
        <div class="flight-record-segment-list__item-top">
          <ElTag :type="kindTagType(segment.kind)" size="small" effect="light">
            {{ kindLabel(segment.kind) }}
          </ElTag>
          <span class="flight-record-segment-list__time">
            {{ formatTimeOnly(parseDatetimeMs(segment.startAt)) }}
            ~
            {{ formatTimeOnly(parseDatetimeMs(segment.endAt)) }}
          </span>
        </div>
        <div class="flight-record-segment-list__target">{{ segment.targetId }} · {{ segment.targetModel }}</div>
        <div class="flight-record-segment-list__meta">
          {{ segment.threatLevel }} · {{ segment.zoneName }} · {{ segment.detectionDevice }}
        </div>
      </button>
    </section>
  </aside>
</template>

<style scoped lang="less">
.flight-record-segment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 12px;
  overflow: auto;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);

  &__header {
    flex-shrink: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__hint {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  &__filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 10px;
  }

  &__filter-field {
    width: 100%;
  }

  &__reset {
    grid-column: 1 / -1;
    padding: 6px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-fill-color-blank);
    font-size: 12px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: border-color 0.15s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      background 0.15s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.25);
    }

    &.is-active {
      background: var(--el-color-primary-light-9);
    }
  }

  &__item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__time {
    font-size: 11px;
    font-family: monospace;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  &__target {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
