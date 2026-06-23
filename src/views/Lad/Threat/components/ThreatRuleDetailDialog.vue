<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { assessThreatRuleApi } from '@/api/lad/threat'
import type { ThreatAssessResult } from '@/api/lad/threat/types'
import { threatLevelForRule, threatLevelTagTypeForRule } from '../../shared/ladDictHelpers'

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
  <Dialog v-model="visible" title="规则详情" width="640px" max-height="85vh">
    <ElDescriptions v-loading="loading" :column="1" border>
      <ElDescriptionsItem label="规则编号">{{ data?.rule.ruleCode }}</ElDescriptionsItem>
      <ElDescriptionsItem label="规则名称">{{ data?.rule.ruleName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="目标类型">{{ data?.rule.targetType }}</ElDescriptionsItem>
      <ElDescriptionsItem label="判级条件">{{ data?.rule.conditionSummary }}</ElDescriptionsItem>
      <ElDescriptionsItem label="威胁等级">
        <ElTag
          v-if="data?.rule"
          :type="threatLevelTagTypeForRule(data.rule)"
          size="small"
          effect="light"
        >
          {{ threatLevelForRule(data.rule) }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="优先级">{{ data?.rule.priority }}</ElDescriptionsItem>
      <ElDescriptionsItem label="告警级别参考">{{ data?.alarmLevel }}</ElDescriptionsItem>
      <ElDescriptionsItem label="规则摘要">{{ data?.summary }}</ElDescriptionsItem>
      <ElDescriptionsItem label="启停">
        <ElTag :type="data?.rule.enabled ? 'success' : 'info'">
          {{ data?.rule.enabled ? '启用' : '停用' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="修改人">{{ data?.rule.updatedBy }}</ElDescriptionsItem>
      <ElDescriptionsItem label="修改时间">{{ data?.rule.updatedAt }}</ElDescriptionsItem>
    </ElDescriptions>
    <template #footer>
      <BaseButton @click="visible = false">关闭</BaseButton>
    </template>
  </Dialog>
</template>
