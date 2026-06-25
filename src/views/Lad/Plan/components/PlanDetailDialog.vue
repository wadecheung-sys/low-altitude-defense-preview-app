<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElDescriptions, ElDescriptionsItem, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getPlanDetailApi } from '@/api/lad/plan'
import { getAreaRegionListApi } from '@/api/lad/area'
import { formatDisposalModeDetail } from '@/api/lad/plan/planDisposal'
import { formatTriggerCondition } from '@/api/lad/plan/planTrigger'
import type { PlanStrategy } from '@/api/lad/plan/types'
import { functionLabel } from '../planDeviceConstants'
import { createPlanAreaLabelMap, formatPlanAreaLabel } from '../planAreaOptions'
import { UI } from '../planConstants'

const props = defineProps<{ modelValue: boolean; planId?: string }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const detail = ref<PlanStrategy>()
const areaLabelMap = ref<Record<string, string>>({})

function formatAreaLabel(value?: string) {
  return formatPlanAreaLabel(value, areaLabelMap.value)
}

function formatRuleAreaLabel(value?: string[]) {
  if (!value?.length) return '全部'
  return value.map((id) => areaLabelMap.value[id] || id).join('、')
}

const execNoteDisplay = computed(() => {
  const text = detail.value?.planRule
  if (!text || text === '-') return '-'
  return text.replace(/\\n/g, '\n')
})

const disposalDetail = computed(() => {
  if (!detail.value) return ''
  return formatDisposalModeDetail(detail.value.disposalMode, detail.value.manualResponseSeconds)
})

watch(
  () => [props.modelValue, props.planId] as const,
  async ([open, id]) => {
    if (!open || !id) return
    loading.value = true
    try {
      const [planRes, areaRes] = await Promise.all([
        getPlanDetailApi({ id }),
        getAreaRegionListApi({ pageIndex: 1, pageSize: 200 })
      ])
      detail.value = planRes.data
      areaLabelMap.value = createPlanAreaLabelMap(areaRes.data.list)
    } finally {
      loading.value = false
    }
  }
)
</script>

<template>
  <Dialog v-model="visible" :title="UI.dialogDetail" width="860px" max-height="90vh">
    <ElDescriptions v-loading="loading" :column="2" border class="mb-12px">
      <ElDescriptionsItem :label="UI.planCode">{{ detail?.planCode }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.planName">{{ detail?.planName }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.planRule" :span="2">
        <span class="whitespace-pre-line">{{ execNoteDisplay }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.alarmLevel">{{ detail?.threatLevel }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.locatedArea">{{
        formatAreaLabel(detail?.areaLevel)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.planPriority">{{ detail?.priority }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.disposalMode">
        <ElTag
          size="small"
          effect="light"
          :type="detail?.disposalMode === 'auto' ? 'success' : 'warning'"
        >
          {{
            detail?.disposalModeLabel ||
            (detail?.disposalMode === 'auto' ? UI.disposalModeAuto : UI.disposalModeManual)
          }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.manualResponseSeconds" :span="2">
        <div class="whitespace-pre-line">{{ disposalDetail }}</div>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.enabled">
        <ElTag :type="detail?.enabled ? 'success' : 'info'">{{
          detail?.enabled ? '启用' : '停用'
        }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.updatedAt">{{ detail?.updatedAt }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.updatedBy">{{ detail?.updatedBy }}</ElDescriptionsItem>
    </ElDescriptions>

    <div class="text-14px font-500 mb-8px"
      >{{ UI.triggerRules }}（{{ detail?.triggerRules?.length || 0 }}条）</div
    >
    <ElTable v-loading="loading" :data="detail?.triggerRules || []" border size="small">
      <ElTableColumn prop="ruleName" :label="UI.triggerRuleName" min-width="140" />
      <ElTableColumn prop="sortOrder" :label="UI.triggerSortOrder" width="88" align="center" />
      <ElTableColumn :label="UI.locatedArea" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ formatRuleAreaLabel(row.areaLevel) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="触发条件" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          {{ formatTriggerCondition(row) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        prop="deviceGroupName"
        :label="UI.deviceGroup"
        min-width="150"
        show-overflow-tooltip
      />
      <ElTableColumn :label="UI.counterDevice" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          {{ functionLabel(row.deviceGroupType, row.deviceFunction) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="deviceAction" label="处置动作" width="100" />
      <ElTableColumn :label="UI.enabled" width="72" align="center">
        <template #default="{ row }">
          <ElTag :type="row.enabled ? 'success' : 'info'" size="small">{{
            row.enabled ? '启用' : '停用'
          }}</ElTag>
        </template>
      </ElTableColumn>
    </ElTable>

    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
    </template>
  </Dialog>
</template>
