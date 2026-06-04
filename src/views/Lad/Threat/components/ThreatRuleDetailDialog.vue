<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { assessThreatRuleApi } from '@/api/lad/threat'
import type { ThreatAssessResult } from '@/api/lad/threat/types'
import { UI } from '../threatConstants'
import {
  areaRegionTypeDisplay,
  LAD_DICT_AREA_REGION_TYPE,
  threatLevelForRule,
  threatLevelTagTypeForRule
} from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  ruleId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { entries: areaTypeEntries } = useLadDictOptions(LAD_DICT_AREA_REGION_TYPE)

const loading = ref(false)
const data = ref<ThreatAssessResult>()

watch(
  () => [props.modelValue, props.ruleId] as const,
  async ([open, id]) => {
    if (!open || !id) return
    loading.value = true
    try {
      const res = await assessThreatRuleApi({ id })
      data.value = res.data
    } finally {
      loading.value = false
    }
  }
)
</script>

<template>
  <Dialog v-model="visible" :title="UI.dialogDetail" width="640px" max-height="85vh">
    <ElDescriptions v-loading="loading" :column="1" border>
      <ElDescriptionsItem :label="UI.ruleCode">{{ data?.rule.ruleCode }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.ruleName">{{ data?.rule.ruleName }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.threatLevel">
        <ElTag
          v-if="data?.rule"
          :type="threatLevelTagTypeForRule(data.rule)"
          size="small"
          effect="light"
        >
          {{ threatLevelForRule(data.rule) }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.areaRegionType">
        {{ areaRegionTypeDisplay(data?.rule.areaRegionType || '', areaTypeEntries) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.targetType">{{ data?.rule.targetType }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.area">{{ data?.rule.areaName }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.priority">{{ data?.rule.priority }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.conditions">{{ data?.rule.conditionSummary }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.detailAlarmLevel">{{ data?.alarmLevel }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.triggerPlan">
        {{ data?.suggestedPlan }}
        <span v-if="data?.planCode" class="text-[var(--el-text-color-secondary)]">
          （{{ data.planCode }}）
        </span>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.detailDeviceType">{{ data?.planDeviceType || '-' }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.detailDeviceFunction">
        {{ data?.planDeviceFunction || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.detailTriggerNote">{{ data?.triggerNote }}</ElDescriptionsItem>
      <ElDescriptionsItem v-if="data?.swarmNote" label="蜂群处置说明">
        {{ data.swarmNote }}
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.detailRuleSummary">{{ data?.summary }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.enabled">
        <ElTag :type="data?.rule.enabled ? 'success' : 'info'">
          {{ data?.rule.enabled ? UI.statusEnabled : UI.statusDisabled }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.updatedBy">{{ data?.rule.updatedBy }}</ElDescriptionsItem>
      <ElDescriptionsItem label="修改时间">{{ data?.rule.updatedAt }}</ElDescriptionsItem>
    </ElDescriptions>
    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
    </template>
  </Dialog>
</template>
