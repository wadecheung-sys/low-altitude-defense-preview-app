<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getPlanDetailApi, savePlanApi } from '@/api/lad/plan'
import { PLAN_DEFAULT_RULE_PRIORITY } from '@/api/lad/plan/planStore'
import {
  PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
  planDisposalModeOptions
} from '@/api/lad/plan/planDisposal'
import type { PlanDisposalMode, PlanStrategy, PlanTriggerRule } from '@/api/lad/plan/types'
import { UI } from '../planConstants'
import {
  listFunctionsByDeviceType,
  planDeviceTypeOptions,
  resolveDeviceFunction
} from '../planDeviceConstants'
import { weatherOptions } from '../../shared/ladOptionConstants'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn
} from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  row?: PlanStrategy
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.row?.id)
const loading = ref(false)
const detailLoading = ref(false)

const weatherRuleOptions = weatherOptions.filter((o) => o.value !== '')

const form = ref({
  planCode: '',
  planName: '',
  planRule: '',
  disposalMode: 'auto' as PlanDisposalMode,
  manualResponseSeconds: PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
  enabled: true
})

const isAutoDisposal = computed(() => form.value.disposalMode === 'auto')

watch(
  () => form.value.disposalMode,
  (mode) => {
    if (mode === 'manual') {
      form.value.manualResponseSeconds = 0
    } else if (!form.value.manualResponseSeconds) {
      form.value.manualResponseSeconds = PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS
    }
  }
)

const triggerRules = ref<PlanTriggerRule[]>([])

function createEmptyRule(priority = PLAN_DEFAULT_RULE_PRIORITY): PlanTriggerRule {
  const deviceType = planDeviceTypeOptions[0].value
  const fn = listFunctionsByDeviceType(deviceType)[0]
  return {
    id: `ptr-temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ruleName: '',
    priority,
    weatherFactor: '全部',
    areaLevel: '全部',
    deviceType,
    deviceFunction: fn?.value || '',
    deviceAction: fn?.deviceAction || '',
    enabled: true
  }
}

function addTriggerRule() {
  triggerRules.value.push(createEmptyRule(10 + triggerRules.value.length * 5))
}

function removeTriggerRule(index: number) {
  triggerRules.value.splice(index, 1)
}

function onRowDeviceTypeChange(row: PlanTriggerRule) {
  const opts = listFunctionsByDeviceType(row.deviceType)
  if (!opts.some((o) => o.value === row.deviceFunction)) {
    const first = opts[0]
    row.deviceFunction = first?.value || ''
    row.deviceAction = first?.deviceAction || ''
  } else {
    const fn = resolveDeviceFunction(row.deviceType, row.deviceFunction)
    row.deviceAction = fn?.deviceAction || row.deviceAction
  }
}

function onRowFunctionChange(row: PlanTriggerRule) {
  const fn = resolveDeviceFunction(row.deviceType, row.deviceFunction)
  row.deviceAction = fn?.deviceAction || ''
}

function fillFormFromPlan(plan: PlanStrategy) {
  form.value = {
    planCode: plan.planCode,
    planName: plan.planName,
    planRule: plan.planRule === '-' ? '' : plan.planRule,
    disposalMode: plan.disposalMode || 'auto',
    manualResponseSeconds:
      plan.disposalMode === 'manual'
        ? 0
        : plan.manualResponseSeconds || PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
    enabled: plan.enabled
  }
  triggerRules.value = (plan.triggerRules || []).map((r) => ({ ...r }))
}

function resetNewForm() {
  form.value = {
    planCode: '',
    planName: '',
    planRule: '',
    disposalMode: 'auto',
    manualResponseSeconds: PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
    enabled: true
  }
  triggerRules.value = [createEmptyRule(PLAN_DEFAULT_RULE_PRIORITY)]
}

watch(
  () => [props.modelValue, props.row?.id] as const,
  async ([open, id]) => {
    if (!open) return
    if (!id) {
      resetNewForm()
      return
    }
    detailLoading.value = true
    try {
      const res = await getPlanDetailApi({ id })
      fillFormFromPlan(res.data)
    } catch {
      if (props.row) fillFormFromPlan(props.row)
    } finally {
      detailLoading.value = false
    }
  }
)

async function onSave() {
  if (!form.value.planCode.trim() || !form.value.planName.trim()) {
    ElMessage.warning('请填写预案编号与名称')
    return
  }
  if (!triggerRules.value.length) {
    ElMessage.warning(UI.triggerRuleEmpty)
    return
  }
  for (const r of triggerRules.value) {
    if (!r.ruleName.trim()) {
      ElMessage.warning('请填写每条触发规则的名称')
      return
    }
    if (!r.deviceType || !r.deviceFunction) {
      ElMessage.warning('请为每条触发规则选择设备类型与功能')
      return
    }
  }
  loading.value = true
  try {
    await savePlanApi({
      id: props.row?.id,
      planCode: form.value.planCode.trim(),
      planName: form.value.planName.trim(),
      planRule: form.value.planRule.trim() || undefined,
      enabled: form.value.enabled,
      disposalMode: form.value.disposalMode,
      manualResponseSeconds: isAutoDisposal.value
        ? Number(form.value.manualResponseSeconds) || 0
        : 0,
      triggerRules: triggerRules.value.map((r) => ({ ...r }))
    })
    ElMessage.success(UI.saveOk)
    emit('success')
    visible.value = false
  } catch {
    /* axios */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    v-model="visible"
    :title="isEdit ? UI.dialogEdit : UI.dialogAdd"
    width="920px"
    max-height="90vh"
  >
    <ElForm v-loading="detailLoading" label-width="110px">
      <ElFormItem :label="UI.planCode" required>
        <ElInput v-model="form.planCode" :disabled="isEdit" clearable />
      </ElFormItem>
      <ElFormItem :label="UI.planName" required>
        <ElInput v-model="form.planName" clearable />
      </ElFormItem>
      <ElFormItem :label="UI.planRule">
        <ElInput
          v-model="form.planRule"
          type="textarea"
          :rows="3"
          :placeholder="UI.planRulePlaceholder"
        />
      </ElFormItem>
      <ElFormItem :label="UI.disposalMode" required>
        <ElRadioGroup v-model="form.disposalMode">
          <ElRadio
            v-for="opt in planDisposalModeOptions"
            :key="opt.value"
            :value="opt.value"
            class="!mr-20px"
          >
            {{ opt.label }}
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem v-if="isAutoDisposal" :label="UI.manualResponseSeconds">
        <div class="flex items-center gap-8px w-full">
          <ElInputNumber
            v-model="form.manualResponseSeconds"
            :min="0"
            :max="600"
            :step="5"
            controls-position="right"
            class="!w-160px"
          />
          <span class="text-13px">{{ UI.manualResponseUnit }}</span>
        </div>
        <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">
          {{ UI.manualResponseHint }}
        </div>
      </ElFormItem>
      <ElFormItem v-else label=" ">
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          {{ UI.manualResponseManualHint }}
        </div>
      </ElFormItem>
      <ElFormItem :label="UI.enabled">
        <ElSwitch v-model="form.enabled" inline-prompt active-text="ON" inactive-text="OFF" />
      </ElFormItem>
      <ElFormItem :label="UI.triggerRules" required>
        <div class="w-full">
          <div class="mb-8px flex items-center justify-between">
            <span class="text-12px text-[var(--el-text-color-secondary)]">
              {{ UI.triggerRuleHint }}
            </span>
            <BaseButton type="primary" size="small" @click="addTriggerRule">
              {{ UI.triggerRuleAdd }}
            </BaseButton>
          </div>
          <ElTable :data="triggerRules" border size="small" max-height="320">
            <ElTableColumn :label="UI.triggerRuleName" min-width="120">
              <template #default="{ row }">
                <ElInput v-model="row.ruleName" size="small" placeholder="如：大雾天" clearable />
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.triggerPriority" width="100" align="center">
              <template #default="{ row }">
                <ElInputNumber
                  v-model="row.priority"
                  size="small"
                  :min="1"
                  :max="99"
                  controls-position="right"
                  class="w-full"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.weather" width="108">
              <template #default="{ row }">
                <ElSelect v-model="row.weatherFactor" size="small" class="w-full">
                  <ElOption
                    v-for="opt in weatherRuleOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.deviceType" min-width="130">
              <template #default="{ row }">
                <ElSelect
                  v-model="row.deviceType"
                  size="small"
                  class="w-full"
                  @change="onRowDeviceTypeChange(row)"
                >
                  <ElOption
                    v-for="opt in planDeviceTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.deviceFunction" min-width="150">
              <template #default="{ row }">
                <ElSelect
                  v-model="row.deviceFunction"
                  size="small"
                  class="w-full"
                  @change="onRowFunctionChange(row)"
                >
                  <ElOption
                    v-for="opt in listFunctionsByDeviceType(row.deviceType)"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.enabled" width="72" align="center">
              <template #default="{ row }">
                <ElSwitch v-model="row.enabled" size="small" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="72" align="center" fixed="right">
              <template #default="{ $index }">
                <BaseButton
                  type="danger"
                  link
                  :disabled="triggerRules.length <= 1"
                  @click="removeTriggerRule($index)"
                >
                  删除
                </BaseButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSave">{{ UI.btnSave }}</BaseButton>
    </template>
  </Dialog>
</template>
