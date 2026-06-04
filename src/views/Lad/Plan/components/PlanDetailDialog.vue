<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getPlanDetailApi } from '@/api/lad/plan'
import { formatDisposalModeDetail } from '@/api/lad/plan/planDisposal'
import type { PlanStrategy } from '@/api/lad/plan/types'
import { functionLabel } from '../planDeviceConstants'
import { UI } from '../planConstants'
import {
  ElDescriptions,
  ElDescriptionsItem,
  ElTable,
  ElTableColumn,
  ElTag
} from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  planId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const detail = ref<PlanStrategy>()

const execNoteDisplay = computed(() => {
  const text = detail.value?.planRule
  if (!text || text === '-') return '-'
  return text.replace(/\\n/g, '\n')
})

const disposalDetail = computed(() => {
  if (!detail.value) return ''
  return formatDisposalModeDetail(
    detail.value.disposalMode,
    detail.value.manualResponseSeconds
  )
})

watch(
  () => [props.modelValue, props.planId] as const,
  async ([open, id]) => {
    if (!open || !id) return
    loading.value = true
    try {
      const res = await getPlanDetailApi({ id })
      detail.value = res.data
    } finally {
      loading.value = false
    }
  }
)
</script>

<template>
  <Dialog v-model="visible" :title="UI.dialogDetail" width="800px" max-height="90vh">
    <ElDescriptions v-loading="loading" :column="2" border class="mb-12px">
      <ElDescriptionsItem :label="UI.planCode">{{ detail?.planCode }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.planName">{{ detail?.planName }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.disposalMode" :span="2">
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
        <p class="text-12px text-[var(--el-text-color-secondary)] mt-6px mb-0 whitespace-pre-line">
          {{ disposalDetail }}
        </p>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="detail?.disposalMode === 'auto'"
        :label="UI.manualResponseSeconds"
      >
        {{
          detail.manualResponseSeconds > 0
            ? `${detail.manualResponseSeconds} ${UI.manualResponseUnit}`
            : '0（立即自动执行）'
        }}
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.enabled">
        <ElTag :type="detail?.enabled ? 'success' : 'info'">
          {{ detail?.enabled ? '启用' : '停用' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.updatedAt">{{ detail?.updatedAt }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.updatedBy">{{ detail?.updatedBy }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="UI.planRule" :span="2">
        <span class="whitespace-pre-line">{{ execNoteDisplay }}</span>
      </ElDescriptionsItem>
    </ElDescriptions>

    <div class="text-14px font-500 mb-8px">
      {{ UI.triggerRules }}（{{ detail?.triggerRules?.length || 0 }}条）
    </div>
    <ElTable v-loading="loading" :data="detail?.triggerRules || []" border size="small">
      <ElTableColumn prop="ruleName" :label="UI.triggerRuleName" min-width="110" />
      <ElTableColumn prop="priority" :label="UI.triggerPriority" width="96" align="center" />
      <ElTableColumn prop="weatherFactor" :label="UI.weather" width="88" />
      <ElTableColumn prop="deviceType" :label="UI.deviceType" min-width="120" show-overflow-tooltip />
      <ElTableColumn :label="UI.deviceFunction" min-width="130" show-overflow-tooltip>
        <template #default="{ row }">
          {{ functionLabel(row.deviceType, row.deviceFunction) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="deviceAction" label="处置动作" width="100" />
      <ElTableColumn :label="UI.enabled" width="72" align="center">
        <template #default="{ row }">
          <ElTag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? '启用' : '停用' }}
          </ElTag>
        </template>
      </ElTableColumn>
    </ElTable>

    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
    </template>
  </Dialog>
</template>
