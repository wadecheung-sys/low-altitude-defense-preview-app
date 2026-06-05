<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElIcon,
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
import { Rank } from '@element-plus/icons-vue'
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
import type { PlanDisposalMode, PlanStrategy, PlanTriggerRule } from '@/api/lad/plan/types'
import { UI } from '../planConstants'
import { listFunctionsByDeviceGroupType, resolveDeviceFunction } from '../planDeviceConstants'
import { allOption, weatherOptions } from '../../shared/ladOptionConstants'

type AreaOption = { label: string; value: string }
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

const isEdit = computed(() => !!props.row?.id)
const loading = ref(false)
const detailLoading = ref(false)
const areaOptions = ref<AreaOption[]>([])
const groupOptions = ref<GroupOption[]>([])
const triggerTableRef = ref<InstanceType<typeof ElTable>>()
let dragSourceIndex = -1

const weatherRuleOptions = weatherOptions.filter((item) => item.value !== '')

const form = ref({
  planCode: '',
  planName: '',
  planRule: '',
  disposalMode: 'auto' as PlanDisposalMode,
  manualResponseSeconds: PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS,
  threatLevel: '全部',
  areaLevel: [] as string[],
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
  areaOptions.value = areaRes.data.list.map((item) => ({ label: item.name, value: item.id }))
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
    weatherFactor: '全部',
    deviceGroupId: group?.value || '',
    deviceGroupName: group?.label || '',
    deviceGroupType: group?.groupType || '',
    deviceFunction: fn?.value || '',
    deviceAction: fn?.deviceAction || '',
    enabled: true
  }
}

function normalizeAreaLevel(value?: string) {
  if (!value || value === '全部') return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function onAreaLevelChange(values: string[]) {
  form.value.areaLevel = [...new Set(values.filter(Boolean))]
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
    weatherFactor: rule.weatherFactor || '全部',
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
  void nextTick(bindDragRows)
}

function removeTriggerRule(index: number) {
  triggerRules.value.splice(index, 1)
  syncTriggerRuleOrder()
  void nextTick(bindDragRows)
}

function moveRule(fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= triggerRules.value.length ||
    toIndex >= triggerRules.value.length
  ) {
    return
  }
  const list = [...triggerRules.value]
  const [moved] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, moved)
  triggerRules.value = list
  syncTriggerRuleOrder()
}

function clearRowDragHandlers() {
  const rows = triggerTableRef.value?.$el?.querySelectorAll?.('.el-table__body-wrapper tbody tr')
  rows?.forEach((row: HTMLElement) => {
    row.draggable = false
    row.ondragstart = null
    row.ondragover = null
    row.ondrop = null
    row.ondragend = null
    row.classList.remove('is-dragging')
  })
}

async function bindDragRows() {
  await nextTick()
  clearRowDragHandlers()
  const rows = triggerTableRef.value?.$el?.querySelectorAll?.('.el-table__body-wrapper tbody tr')
  rows?.forEach((row: HTMLElement, index: number) => {
    row.draggable = true
    row.ondragstart = (event: DragEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('.trigger-rule-sort')) {
        event.preventDefault()
        return
      }
      dragSourceIndex = index
      event.dataTransfer?.setData('text/plain', String(index))
      event.dataTransfer!.effectAllowed = 'move'
      row.classList.add('is-dragging')
    }
    row.ondragover = (event: DragEvent) => {
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    }
    row.ondrop = (event: DragEvent) => {
      event.preventDefault()
      const fromIndex = Number(event.dataTransfer?.getData('text/plain') ?? dragSourceIndex)
      moveRule(fromIndex, index)
      void nextTick(bindDragRows)
    }
    row.ondragend = () => {
      dragSourceIndex = -1
      row.classList.remove('is-dragging')
      clearRowDragHandlers()
      void nextTick(bindDragRows)
    }
  })
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
    areaLevel: normalizeAreaLevel(plan.areaLevel),
    priority: Number(plan.priority) || PLAN_DEFAULT_PRIORITY,
    enabled: plan.enabled
  }
  triggerRules.value = (plan.triggerRules || []).map((item) => normalizeRule(item))
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
    areaLevel: [],
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
      void nextTick(bindDragRows)
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
      void nextTick(bindDragRows)
    }
  }
)

watch(
  () => triggerRules.value.length,
  () => {
    void nextTick(bindDragRows)
  }
)

onBeforeUnmount(() => {
  clearRowDragHandlers()
})

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
      ElMessage.warning('请为每条触发策略选择执行设备组与设备功能')
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
      threatLevel: form.value.threatLevel,
      areaLevel: form.value.areaLevel.length ? form.value.areaLevel.join(',') : '全部',
      priority: Number(form.value.priority) || PLAN_DEFAULT_PRIORITY,
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
      <ElFormItem :label="UI.locatedArea">
        <ElSelect
          v-model="form.areaLevel"
          class="w-full"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
          placeholder="不选默认全部区域"
          @change="onAreaLevelChange"
        >
          <ElOption
            v-for="option in areaOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="UI.planPriority">
        <ElInputNumber
          v-model="form.priority"
          :min="1"
          :max="99"
          controls-position="right"
          class="!w-160px"
        />
      </ElFormItem>
      <ElFormItem :label="UI.enabled">
        <ElSwitch v-model="form.enabled" inline-prompt active-text="ON" inactive-text="OFF" />
      </ElFormItem>
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
          <ElTable ref="triggerTableRef" :data="triggerRules" border size="small" max-height="340">
            <ElTableColumn :label="UI.triggerRuleName" min-width="120">
              <template #default="{ row }">
                <ElInput
                  v-model="row.ruleName"
                  size="small"
                  placeholder="如：大雾天气设备切换策略"
                  clearable
                />
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.triggerSortOrder" width="90" align="center">
              <template #default="{ row }">
                <div class="flex items-center justify-center gap-6px trigger-rule-sort">
                  <ElIcon class="cursor-move text-14px text-[var(--el-text-color-secondary)]">
                    <Rank />
                  </ElIcon>
                  <span>{{ row.sortOrder }}</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.weather" width="108">
              <template #default="{ row }">
                <ElSelect v-model="row.weatherFactor" size="small" class="w-full">
                  <ElOption
                    v-for="option in weatherRuleOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.deviceGroup" min-width="160">
              <template #default="{ row }">
                <ElSelect
                  v-model="row.deviceGroupId"
                  size="small"
                  class="w-full"
                  @change="onRowDeviceGroupChange(row)"
                >
                  <ElOption
                    v-for="option in groupOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
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
                    v-for="option in listFunctionsByDeviceGroupType(row.deviceGroupType)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.enabled" width="72" align="center">
              <template #default="{ row }">
                <ElSwitch v-model="row.enabled" size="small" />
              </template>
            </ElTableColumn>
            <ElTableColumn :label="UI.action" width="72" align="center" fixed="right">
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

<style scoped>
:deep(.el-table__body-wrapper tbody tr) {
  cursor: default;
}

:deep(.el-table__body-wrapper tbody tr.is-dragging) {
  opacity: 0.65;
}

.trigger-rule-sort {
  cursor: move;
  user-select: none;
}
</style>
