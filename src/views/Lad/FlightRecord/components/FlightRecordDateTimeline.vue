<script setup lang="ts">
import type { FlightRecordDaySummary } from '@/api/lad/flightRecord/types'
import { computed } from 'vue'
import { formatDateLabel } from '../flightRecordTime'

const props = defineProps<{
  days: FlightRecordDaySummary[]
  selectedDate: string
}>()

const emit = defineEmits<{
  select: [date: string]
}>()

const orderedDays = computed(() => [...props.days].sort((a, b) => (a.date < b.date ? -1 : 1)))

function onSelect(date: string) {
  emit('select', date)
}
</script>

<template>
  <div class="flight-record-date-timeline">
    <div class="flight-record-date-timeline__label">日期</div>
    <div class="flight-record-date-timeline__track">
      <button
        v-for="day in orderedDays"
        :key="day.date"
        type="button"
        class="flight-record-date-timeline__chip"
        :class="{ 'is-active': day.date === selectedDate }"
        @click="onSelect(day.date)"
      >
        <span class="flight-record-date-timeline__chip-date">{{ formatDateLabel(day.date) }}</span>
        <span class="flight-record-date-timeline__chip-meta">
          告警 {{ day.alarmCount }} · 录制 {{ day.recordingCount }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
.flight-record-date-timeline {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);

  &__label {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  &__track {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  &__chip {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 132px;
    padding: 8px 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
    cursor: pointer;
    text-align: left;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  &__chip-date {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }

  &__chip-meta {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }
}
</style>
