<script setup lang="ts">
import type { ThreatSimulateResult } from '@/api/lad/threat/types'
import { UI } from '../threatConstants'
import { ElAlert, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'

defineProps<{
  result?: ThreatSimulateResult
}>()
</script>

<template>
  <ElAlert
    v-if="result"
    class="threat-simulate-result"
    :type="result.matched ? 'success' : 'warning'"
    :title="result.matched ? UI.simulateResultSuccess : UI.simulateResultFail"
    :closable="false"
    show-icon
  >
    <p class="threat-simulate-result__message">{{ result.message }}</p>

    <template v-if="result.matched">
      <ElDescriptions :column="1" border size="small" class="threat-simulate-result__desc">
        <ElDescriptionsItem :label="UI.simulateMatchedRule">
          {{ result.ruleName }}
          <ElTag v-if="result.isMonitorCatchAll" type="info" size="small" effect="plain" class="ml-6px">
            {{ UI.fallbackTag }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.threatLevel">
          {{ result.threatLevel || '—' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.triggerPlan">
          {{ result.planName }}（{{ result.planCode }}）
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateDisposalMode">
          {{ result.disposalModeLabel || '—' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateTriggerStrategy">
          {{ result.triggerStrategyName || '—' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.detailDeviceType">
          {{ result.planDeviceType }} / {{ result.planDeviceFunction }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateDeviceAction">
          {{ result.planDeviceAction || '—' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <p v-if="result.outcomeSummary" class="threat-simulate-result__outcome">
        {{ result.outcomeSummary }}
      </p>
      <p v-if="result.monitorNote" class="threat-simulate-result__note">{{ result.monitorNote }}</p>
      <p v-if="result.swarmNote" class="threat-simulate-result__note">{{ result.swarmNote }}</p>
    </template>
  </ElAlert>
</template>

<style scoped lang="less">
.threat-simulate-result {
  &__message {
    margin: 0 0 10px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.6;
  }

  &__desc {
    margin-bottom: 10px;
  }

  &__outcome {
    margin: 0 0 6px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgb(103 194 58 / 8%);
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.6;
  }

  &__note {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
