<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ElCascader,
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
  ElTag
} from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getPlanDetailApi, savePlanApi } from '@/api/lad/plan'
import { getAreaRegionListApi } from '@/api/lad/area'
import { getDeviceGroupListApi } from '@/api/lad/device-group'
import { PLAN_DEFAULT_PRIORITY } from '@/api/lad/plan/planStore'
import {
  PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
  planDisposalModeOptions
} from '@/api/lad/plan/planDisposal'
import type {
  PlanConditionOperator,
  PlanDisposalMode,
  PlanStrategy,
  PlanTriggerRule
} from '@/api/lad/plan/types'
import { UI } from '../planConstants'
import { listFunctionsByDeviceGroupType, resolveDeviceFunction } from '../planDeviceConstants'
import {
  buildPlanAreaCascaderOptions,
  normalizePlanAreaIds,
  type PlanAreaCascaderOption
} from '../planAreaOptions'
import { allOption } from '../../shared/ladOptionConstants'

type GroupOption = { label: string; value: string; groupType: string }

const props = defineProps<{ modelValue: boolean; row?: PlanStrategy }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; success: [] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const alarmLevelOptions = [
  { label: allOption.label, value: allOption.value },
  { label: '低', value: '低' },
  { label: '中', value: '中' },
  { label: '高', value: '高' }
]

const logicOperatorOptions: { label: string; value: PlanConditionOperator }[] = [
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '=', value: '=' },
  { label: '≠', value: '!=' }
]

const isEdit = computed(() => !!props.row?.id)
const loading = ref(false)
const detailLoading = ref(false)
const areaOptions = ref<PlanAreaCascaderOption[]>([])
const groupOptions = ref<GroupOption[]>([])

const form = ref({
  planCode: '',
  planName: '',
  planRule: '',
  disposalMode: 'auto' as PlanDisposalMode,
  manualResponseSeconds: PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
  threatLevel: '全部',
  priority: PLAN_DEFAULT_PRIORITY,
  enabled: true
})

const triggerRules = ref<PlanTriggerRule[]>([])

function syncTriggerRuleOrder() {
  triggerRules.value = triggerRules.value.map((item, index) => ({
    ...item,
    sortOrder: index + 1
  }))
}

function getNextSortOrder() {
  return triggerRules.value.length + 1
}

function generatePlanCode() {
  const now = new Date()
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')
  return `PLAN-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(Math.floor(Math.random() * 100))}`
}

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

async function loadBaseOptions() {
  const [areaRes, groupRes] = await Promise.all([
    getAreaRegionListApi({ pageIndex: 1, pageSize: 200 }),
    getDeviceGroupListApi({ pageIndex: 1, pageSize: 200, enabled: true })
  ])
  areaOptions.value = buildPlanAreaCascaderOptions(areaRes.data.list)
  groupOptions.value = groupRes.data.list.map((item) => ({
    label: item.groupName,
    value: item.id,
    groupType: item.groupType
  }))
}

function groupById(id: string) {
  return groupOptions.value.find((item) => item.value === id)
}

function createEmptyRule(): PlanTriggerRule {
  const group = groupOptions.value[0]
  const fn = group ? listFunctionsByDeviceGroupType(group.groupType)[0] : undefined
  return {
    id: `ptr-temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ruleName: '',
    sortOrder: getNextSortOrder(),
    areaLevel: [],
    temperatureOperator: '',
    temperatureValue: null,
    humidityOperator: '',
    humidityValue: null,
    windPowerOperator: '',
    windPowerValue: null,
    rainfallOperator: '',
    rainfallValue: null,
    deviceGroupId: group?.value || '',
    deviceGroupName: group?.label || '',
    deviceGroupType: group?.groupType || '',
    deviceFunction: fn?.value || '',
    deviceAction: fn?.deviceAction || '',
    enabled: true
  }
}

function normalizeAreaLevel(value?: string) {
  return normalizePlanAreaIds(value)
}

function normalizeRuleAreaLevel(value?: string[] | string) {
  if (Array.isArray(value)) return [...new Set(value.filter(Boolean))]
  return normalizeAreaLevel(value)
}

function onRuleAreaLevelChange(rule: PlanTriggerRule, values: string[]) {
  rule.areaLevel = [...new Set(values.filter(Boolean))]
}

function normalizeRule(rule: Partial<PlanTriggerRule>): PlanTriggerRule {
  const base = createEmptyRule()
  const group = groupById(rule.deviceGroupId || base.deviceGroupId)
  const groupType = rule.deviceGroupType || group?.groupType || base.deviceGroupType
  const fn = resolveDeviceFunction(groupType, rule.deviceFunction || base.deviceFunction)
  return {
    ...base,
    ...rule,
    sortOrder: Number(rule.sortOrder) || base.sortOrder,
    areaLevel: normalizeRuleAreaLevel(rule.areaLevel || base.areaLevel),
    temperatureOperator: rule.temperatureOperator || '',
    temperatureValue: rule.temperatureValue ?? null,
    humidityOperator: rule.humidityOperator || '',
    humidityValue: rule.humidityValue ?? null,
    windPowerOperator: rule.windPowerOperator || '',
    windPowerValue: rule.windPowerValue ?? null,
    rainfallOperator: rule.rainfallOperator || '',
    rainfallValue: rule.rainfallValue ?? null,
    weatherFactor: undefined,
    deviceGroupId: group?.value || rule.deviceGroupId || '',
    deviceGroupName: group?.label || rule.deviceGroupName || '',
    deviceGroupType: groupType,
    deviceFunction: fn?.value || '',
    deviceAction: fn?.deviceAction || '',
    ruleName: rule.ruleName || ''
  }
}

function addTriggerRule() {
  triggerRules.value.push(createEmptyRule())
}

function removeTriggerRule(index: number) {
  triggerRules.value.splice(index, 1)
  syncTriggerRuleOrder()
}

function onRowDeviceGroupChange(row: PlanTriggerRule) {
  const group = groupById(row.deviceGroupId)
  row.deviceGroupName = group?.label || ''
  row.deviceGroupType = group?.groupType || ''
  const options = listFunctionsByDeviceGroupType(row.deviceGroupType)
  if (!options.some((item) => item.value === row.deviceFunction)) {
    const first = options[0]
    row.deviceFunction = first?.value || ''
    row.deviceAction = first?.deviceAction || ''
  } else {
    const fn = resolveDeviceFunction(row.deviceGroupType, row.deviceFunction)
    row.deviceAction = fn?.deviceAction || row.deviceAction
  }
}

function onRowFunctionChange(row: PlanTriggerRule) {
  const fn = resolveDeviceFunction(row.deviceGroupType, row.deviceFunction)
  row.deviceAction = fn?.deviceAction || ''
}

function collectPlanAreaLevel() {
  const values = triggerRules.value.flatMap((rule) => rule.areaLevel || [])
  return [...new Set(values.filter(Boolean))]
}

function conditionComplete(operator?: string, value?: number | null) {
  const hasOperator = !!operator
  const hasValue = value !== undefined && value !== null
  return hasOperator === hasValue
}

function ruleConditionComplete(rule: PlanTriggerRule) {
  return (
    conditionComplete(rule.temperatureOperator, rule.temperatureValue) &&
    conditionComplete(rule.humidityOperator, rule.humidityValue) &&
    conditionComplete(rule.windPowerOperator, rule.windPowerValue) &&
    conditionComplete(rule.rainfallOperator, rule.rainfallValue)
  )
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
    threatLevel: plan.threatLevel || '全部',
    priority: Number.isFinite(Number(plan.priority))
      ? Number(plan.priority)
      : PLAN_DEFAULT_PRIORITY,
    enabled: plan.enabled
  }
  triggerRules.value = (plan.triggerRules || []).map((item) => normalizeRule(item))
  const legacyAreaLevel = normalizeAreaLevel(plan.areaLevel)
  if (
    legacyAreaLevel.length &&
    triggerRules.value.length &&
    !triggerRules.value[0].areaLevel?.length
  ) {
    triggerRules.value[0].areaLevel = legacyAreaLevel
  }
  syncTriggerRuleOrder()
}

function resetNewForm() {
  form.value = {
    planCode: generatePlanCode(),
    planName: '',
    planRule: '',
    disposalMode: 'auto',
    manualResponseSeconds: PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
    threatLevel: '全部',
    priority: PLAN_DEFAULT_PRIORITY,
    enabled: true
  }
  triggerRules.value = [createEmptyRule()]
}

watch(
  () => [props.modelValue, props.row?.id] as const,
  async ([open, id]) => {
    if (!open) return
    await loadBaseOptions()
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
  for (const rule of triggerRules.value) {
    if (!rule.ruleName.trim()) {
      ElMessage.warning('请填写每条触发策略的规则名称')
      return
    }
    if (!rule.deviceGroupId || !rule.deviceFunction) {
      ElMessage.warning('请为每条触发策略选择执行设备组与反制动作')
      return
    }
    if (!ruleConditionComplete(rule)) {
      ElMessage.warning('温度、湿度、风力、雨量条件需同时填写逻辑符号和数值')
      return
    }
  }
  const planAreaLevel = collectPlanAreaLevel()
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
      threatLevel: form.value.threatLevel,
      areaLevel: planAreaLevel.length ? planAreaLevel.join(',') : '全部',
      priority: Number.isFinite(Number(form.value.priority))
        ? Number(form.value.priority)
        : PLAN_DEFAULT_PRIORITY,
      triggerRules: triggerRules.value.map((item) => ({ ...item }))
    })
    ElMessage.success(UI.saveOk)
    emit('success')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    v-model="visible"
    :title="isEdit ? UI.dialogEdit : UI.dialogAdd"
    width="980px"
    max-height="90vh"
  >
    <ElForm v-loading="detailLoading" label-width="110px">
      <div class="plan-form-section">
        <div class="plan-form-section__title">基本信息</div>
        <ElFormItem :label="UI.planCode" required>
          <ElInput v-model="form.planCode" disabled />
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
              v-for="option in planDisposalModeOptions"
              :key="option.value"
              :value="option.value"
              class="!mr-20px"
            >
              {{ option.label }}
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
          <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">{{
            UI.manualResponseHint
          }}</div>
        </ElFormItem>
        <ElFormItem v-else label=" ">
          <div class="text-12px text-[var(--el-text-color-secondary)]">{{
            UI.manualResponseManualHint
          }}</div>
        </ElFormItem>
        <ElFormItem :label="UI.alarmLevel">
          <ElSelect v-model="form.threatLevel" class="w-full">
            <ElOption
              v-for="option in alarmLevelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="UI.planPriority">
          <ElInputNumber
            v-model="form.priority"
            :min="0"
            :max="999"
            :step="1"
            step-strictly
            controls-position="right"
            class="!w-160px"
          />
          <div class="plan-form__tip">范围 0-999，数值越大，预案重要性越高。</div>
        </ElFormItem>
        <ElFormItem :label="UI.enabled">
          <ElSwitch v-model="form.enabled" inline-prompt active-text="ON" inactive-text="OFF" />
        </ElFormItem>
      </div>
      <ElFormItem :label="UI.triggerRules" required>
        <div class="w-full">
          <div class="mb-8px flex items-center justify-between">
            <span class="text-12px text-[var(--el-text-color-secondary)]">{{
              UI.triggerRuleHint
            }}</span>
            <BaseButton type="primary" size="small" @click="addTriggerRule">{{
              UI.triggerRuleAdd
            }}</BaseButton>
          </div>
          <div class="trigger-rule-list">
            <div v-for="(rule, index) in triggerRules" :key="rule.id" class="trigger-rule-form">
              <div class="trigger-rule-form__header">
                <div class="flex items-center gap-8px">
                  <span class="trigger-rule-form__title">触发策略 {{ index + 1 }}</span>
                  <ElTag size="small" effect="plain">排序 {{ rule.sortOrder || index + 1 }}</ElTag>
                </div>
                <div class="flex items-center gap-12px">
                  <ElSwitch
                    v-model="rule.enabled"
                    inline-prompt
                    active-text="ON"
                    inactive-text="OFF"
                  />
                  <BaseButton
                    type="danger"
                    link
                    :disabled="triggerRules.length <= 1"
                    @click="removeTriggerRule(index)"
                  >
                    删除
                  </BaseButton>
                </div>
              </div>
              <div class="trigger-rule-form__grid">
                <div class="trigger-rule-form__item">
                  <label>{{ UI.triggerRuleName }}</label>
                  <ElInput v-model="rule.ruleName" placeholder="如：高温高湿反制策略" clearable />
                </div>
                <div class="trigger-rule-form__item">
                  <label>{{ UI.triggerSortOrder }}</label>
                  <ElInputNumber
                    v-model="rule.sortOrder"
                    :min="1"
                    :max="99"
                    :step="1"
                    step-strictly
                    controls-position="right"
                    class="!w-full"
                  />
                </div>
                <div class="trigger-rule-form__item trigger-rule-form__item--wide">
                  <label>{{ UI.locatedArea }}</label>
                  <ElCascader
                    v-model="rule.areaLevel"
                    :options="areaOptions"
                    :props="{
                      multiple: true,
                      emitPath: false,
                      checkStrictly: false
                    }"
                    class="w-full"
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    filterable
                    placeholder="不选默认全部区域"
                    @change="(values: string[]) => onRuleAreaLevelChange(rule, values)"
                  />
                </div>
                <div class="trigger-rule-form__item">
                  <label>{{ UI.temperature }}</label>
                  <div class="condition-editor">
                    <ElSelect
                      v-model="rule.temperatureOperator"
                      clearable
                      class="condition-editor__operator"
                    >
                      <ElOption
                        v-for="option in logicOperatorOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ElSelect>
                    <ElInputNumber
                      v-model="rule.temperatureValue"
                      :step="1"
                      controls-position="right"
                      class="condition-editor__value"
                    />
                  </div>
                </div>
                <div class="trigger-rule-form__item">
                  <label>{{ UI.humidity }}</label>
                  <div class="condition-editor">
                    <ElSelect
                      v-model="rule.humidityOperator"
                      clearable
                      class="condition-editor__operator"
                    >
                      <ElOption
                        v-for="option in logicOperatorOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ElSelect>
                    <ElInputNumber
                      v-model="rule.humidityValue"
                      :min="0"
                      :max="100"
                      :step="1"
                      controls-position="right"
                      class="condition-editor__value"
                    />
                  </div>
                </div>
                <div class="trigger-rule-form__item">
                  <label>{{ UI.windPower }}</label>
                  <div class="condition-editor">
                    <ElSelect
                      v-model="rule.windPowerOperator"
                      clearable
                      class="condition-editor__operator"
                    >
                      <ElOption
                        v-for="option in logicOperatorOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ElSelect>
                    <ElInputNumber
                      v-model="rule.windPowerValue"
                      :min="0"
                      :step="1"
                      controls-position="right"
                      class="condition-editor__value"
                    />
                  </div>
                </div>
                <div class="trigger-rule-form__item">
                  <label>{{ UI.rainfall }}</label>
                  <div class="condition-editor">
                    <ElSelect
                      v-model="rule.rainfallOperator"
                      clearable
                      class="condition-editor__operator"
                    >
                      <ElOption
                        v-for="option in logicOperatorOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ElSelect>
                    <ElInputNumber
                      v-model="rule.rainfallValue"
                      :min="0"
                      :step="1"
                      controls-position="right"
                      class="condition-editor__value"
                    />
                  </div>
                </div>
                <div class="trigger-rule-form__item">
                  <label>{{ UI.deviceGroup }}</label>
                  <ElSelect
                    v-model="rule.deviceGroupId"
                    class="w-full"
                    @change="onRowDeviceGroupChange(rule)"
                  >
                    <ElOption
                      v-for="option in groupOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </div>
                <div class="trigger-rule-form__item">
                  <label>{{ UI.counterDevice }}</label>
                  <ElSelect
                    v-model="rule.deviceFunction"
                    class="w-full"
                    @change="onRowFunctionChange(rule)"
                  >
                    <ElOption
                      v-for="option in listFunctionsByDeviceGroupType(rule.deviceGroupType)"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSave">{{ UI.btnSave }}</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped>
.plan-form__tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

.plan-form-section {
  margin-bottom: 18px;
}

.plan-form-section__title {
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-primary);
}

.trigger-rule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trigger-rule-form {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.trigger-rule-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.trigger-rule-form__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.trigger-rule-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.trigger-rule-form__item {
  min-width: 0;
}

.trigger-rule-form__item--wide {
  grid-column: 1 / -1;
}

.trigger-rule-form__item label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-regular);
}

.condition-editor {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 8px;
}

.condition-editor__operator,
.condition-editor__value {
  width: 100%;
}

@media (max-width: 768px) {
  .trigger-rule-form__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .trigger-rule-form__grid {
    grid-template-columns: 1fr;
  }

  .condition-editor {
    grid-template-columns: 80px minmax(0, 1fr);
  }
}
</style>
