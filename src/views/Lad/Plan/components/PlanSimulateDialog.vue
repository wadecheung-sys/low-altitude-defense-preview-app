<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { simulatePlanApi } from '@/api/lad/plan'
import type { PlanSimulateResult } from '@/api/lad/plan/types'
import { UI } from '../planConstants'
import {
  createDefaultPlanSimulateForm,
  normalizePlanSimulateWeather,
  planFormToSimulateInput,
  planSimulateFormComplete,
  type PlanSimulateFormState
} from '../simulateFormUtils'
import PlanSimulateForm from './PlanSimulateForm.vue'
import PlanSimulateResultPanel from './PlanSimulateResultPanel.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const result = ref<PlanSimulateResult>()
const form = ref<PlanSimulateFormState>(createDefaultPlanSimulateForm())

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    result.value = undefined
    form.value = createDefaultPlanSimulateForm()
  },
  { immediate: true }
)

async function onRun() {
  form.value.weatherConditions = normalizePlanSimulateWeather(
    form.value.weatherConditions,
    form.value.weatherConditionLogic
  )
  if (!planSimulateFormComplete(form.value)) {
    if (!form.value.threatLevel?.trim()) {
      ElMessage.warning('请选择威胁等级')
      return
    }
    ElMessage.warning('请完整填写天气要素条件')
    return
  }

  loading.value = true
  result.value = undefined
  try {
    const res = await simulatePlanApi(planFormToSimulateInput(form.value))
    result.value = res.data
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" :title="UI.dialogSimulate" width="720px" max-height="85vh">
    <PlanSimulateForm :form="form" />
    <PlanSimulateResultPanel
      :result="result"
      :input-threat-level="form.threatLevel"
      class="mt-12px"
    />

    <div class="plan-simulate-dialog__actions">
      <BaseButton type="primary" :loading="loading" @click="onRun">
        {{ UI.simulateRun }}
      </BaseButton>
    </div>

    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped lang="less">
.plan-simulate-dialog__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
