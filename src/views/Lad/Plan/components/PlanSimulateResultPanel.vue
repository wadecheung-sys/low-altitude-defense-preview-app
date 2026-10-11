<script setup lang="ts">
import { computed } from 'vue'
import type { PlanSimulateResult } from '@/api/lad/plan/types'
import { THREAT_LEVEL_ALL } from '@/api/lad/threat/threatLevelUtils'
import { normalizePlanPriority } from '@/api/lad/plan/planDefaults'
import { UI } from '../planConstants'
import { threatLevelTagType } from '../../shared/ladDictHelpers'
import { ElAlert, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'

const props = defineProps<{
  result?: PlanSimulateResult
  /** 表单所选威胁等级，用于结果展示兜底 */
  inputThreatLevel?: string
}>()

const displayThreatLevel = computed(() => {
  const level = props.result?.threatLevel?.trim() || props.inputThreatLevel?.trim()
  return level || THREAT_LEVEL_ALL
})

const planThreatLevel = computed(() => props.result?.planThreatLevel?.trim() || '全部')

const displayPriority = computed(() => normalizePlanPriority(props.result?.priority))

const deviceActionText = computed(() => {
  if (!props.result?.matched) return '—'
  return props.result.deviceAction || props.result.deviceFunctionLabel || '—'
})

const disposalTagType = computed(() => {
  const mode = props.result?.disposalMode
  if (mode === 'auto') return 'success'
  if (mode === 'manual') return 'warning'
  return 'info'
})

const disposalLabel = computed(() => {
  if (!props.result) return '—'
  return (
    props.result.disposalModeLabel ||
    (props.result.disposalMode === 'auto'
      ? UI.disposalModeAuto
      : props.result.disposalMode === 'manual'
        ? UI.disposalModeManual
        : '—')
  )
})
</script>

<template>
  <ElAlert
    v-if="result"
    class="plan-simulate-result"
    :type="result.matched ? 'success' : 'warning'"
    :title="result.matched ? UI.simulateResultSuccess : UI.simulateResultFail"
    :closable="false"
    show-icon
  >
    <p v-if="result.message" class="plan-simulate-result__message">{{ result.message }}</p>

    <template v-if="result.matched">
      <div class="plan-simulate-result__section">{{ UI.simulateCoreSection }}</div>
      <ElDescriptions :column="1" border size="small" class="plan-simulate-result__desc">
        <ElDescriptionsItem :label="UI.simulateMatchedPlan">
          <span class="plan-simulate-result__highlight">{{ result.planName || '—' }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateMatchedTriggerRule">
          <span class="plan-simulate-result__highlight">{{ result.triggerRuleName || '—' }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.counterDevice">
          <span class="plan-simulate-result__highlight">{{ deviceActionText }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>

      <div class="plan-simulate-result__section">{{ UI.simulateDetailSection }}</div>
      <ElDescriptions :column="1" border size="small" class="plan-simulate-result__desc">
        <ElDescriptionsItem :label="UI.threatLevel">
          <ElTag :type="threatLevelTagType(displayThreatLevel)" size="small" effect="light">
            {{ displayThreatLevel }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.disposalMode">
          <ElTag :type="disposalTagType" size="small" effect="light">
            {{ disposalLabel }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulatePlanThreatLevel">
          <ElTag :type="threatLevelTagType(planThreatLevel)" size="small" effect="plain">
            {{ planThreatLevel }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.planPriority">
          {{ displayPriority }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.locatedArea">
          {{ result.triggerAreaLevel || '全部' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.weatherElements">
          {{ result.triggerWeatherSummary || '全部' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </template>

    <ElDescriptions v-else :column="1" border size="small" class="plan-simulate-result__desc">
      <ElDescriptionsItem :label="UI.threatLevel">
        <ElTag :type="threatLevelTagType(displayThreatLevel)" size="small" effect="light">
          {{ displayThreatLevel }}
        </ElTag>
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElAlert>
</template>

<style scoped lang="less">
.plan-simulate-result {
  &__message {
    margin: 0 0 10px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.6;
  }

  &__section {
    margin: 4px 0 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 500;
  }

  &__desc {
    margin-bottom: 12px;
  }

  &__highlight {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}
</style>
