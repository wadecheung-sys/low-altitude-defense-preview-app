<script setup lang="ts">
import type { ThreatSimulateResult } from '@/api/lad/threat/types'
import { UI } from '../threatConstants'
import {
  listTypeTagType,
  threatLevelForRule,
  threatLevelTagTypeForRule
} from '../../shared/ladDictHelpers'
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
    <p v-if="result.message" class="threat-simulate-result__message">{{ result.message }}</p>

    <template v-if="result.matched && result.rule">
      <ElDescriptions :column="1" border size="small" class="threat-simulate-result__desc">
        <ElDescriptionsItem :label="UI.simulateMatchedRule">
          <span class="threat-simulate-result__highlight">{{ result.ruleName }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateThreatLevelConclusion">
          <ElTag :type="threatLevelTagTypeForRule(result.rule)" size="default" effect="dark">
            {{ threatLevelForRule(result.rule) }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateRuleTargetType">
          <ElTag :type="listTypeTagType(result.rule.targetType)" size="small" effect="light">
            {{ result.rule.targetType }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateRuleTargetModel">
          {{ result.rule.targetModel || '—' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.simulateRuleConditions">
          {{ result.rule.conditionSummary || '—' }}
        </ElDescriptionsItem>
      </ElDescriptions>

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

  &__highlight {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__note {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
