<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getThreatRuleDetailApi, saveThreatRuleApi } from '@/api/lad/threat'
import { SWARM_TARGET_TYPE } from '@/api/lad/threat/threatSwarm'
import { getPlanOptionsApi } from '@/api/lad/plan'
import type { RuleCondition, ThreatLevelLabel, ThreatRule } from '@/api/lad/threat/types'
import { UI } from '../threatConstants'
import {
  dictEntriesToOptions,
  LAD_DICT_AREA_REGION_TYPE,
  LAD_DICT_THREAT_LEVEL
} from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import {
  conditionOperatorOptions,
  conditionPropertyOptions,
  targetTypeOptions
} from '../../shared/ladOptionConstants'
import {
  ElAlert,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElLink,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch
} from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  row?: ThreatRule
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

const { entries: areaTypeEntries, reload: reloadAreaTypes } = useLadDictOptions(
  LAD_DICT_AREA_REGION_TYPE,
  false
)
const { entries: threatLevelEntries, reload: reloadThreatLevels } = useLadDictOptions(
  LAD_DICT_THREAT_LEVEL,
  false
)

const areaRegionTypeOptions = computed(() => dictEntriesToOptions(areaTypeEntries.value, true))
const threatLevelOptions = computed(() => dictEntriesToOptions(threatLevelEntries.value))

const showSwarmHint = computed(() => form.value.targetType === SWARM_TARGET_TYPE)
const loading = ref(false)
const planOptions = ref<{ id: string; planName: string; planCode: string; enabled: boolean }[]>([])

const form = ref({
  ruleCode: '',
  ruleName: '',
  areaRegionType: '全部' as string,
  threatLevel: '中' as ThreatLevelLabel,
  targetType: '全部',
  areaName: '',
  priority: 10,
  planId: '',
  enabled: true,
  conditions: [] as RuleCondition[]
})

function newCondition(): RuleCondition {
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    property: 'speed',
    operator: '>',
    value: ''
  }
}

function addCondition() {
  form.value.conditions.push(newCondition())
}

function removeCondition(id: string) {
  form.value.conditions = form.value.conditions.filter((c) => c.id !== id)
}

async function loadPlanOptions() {
  const res = await getPlanOptionsApi()
  planOptions.value = res.data
  if (!form.value.planId && res.data.length) {
    form.value.planId = res.data.find((p) => p.enabled)?.id || res.data[0].id
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await Promise.all([reloadAreaTypes(), reloadThreatLevels(), loadPlanOptions()])
    if (props.row?.id) {
      loading.value = true
      try {
        const res = await getThreatRuleDetailApi({ id: props.row.id })
        const row = res.data
        form.value = {
          ruleCode: row.ruleCode,
          ruleName: row.ruleName,
          areaRegionType: row.areaRegionType,
          threatLevel: row.threatLevel,
          targetType: row.targetType,
          areaName: row.areaName,
          priority: row.priority,
          planId: row.planId,
          enabled: row.enabled,
          conditions: row.conditions.map((c) => ({ ...c }))
        }
      } finally {
        loading.value = false
      }
    } else {
      form.value = {
        ruleCode: '',
        ruleName: '',
        areaRegionType: '全部',
        threatLevel: '中',
        targetType: '全部',
        areaName: '',
        priority: 10,
        planId: planOptions.value.find((p) => p.enabled)?.id || '',
        enabled: true,
        conditions: [newCondition(), newCondition()]
      }
    }
  }
)

onMounted(() => {
  if (props.modelValue) {
    reloadAreaTypes()
    reloadThreatLevels()
    loadPlanOptions()
  }
})

async function onSave() {
  if (!form.value.ruleCode.trim() || !form.value.ruleName.trim()) {
    ElMessage.warning('请填写规则编号与名称')
    return
  }
  if (!form.value.planId) {
    ElMessage.warning('请选择触发预案')
    return
  }
  if (!form.value.conditions.length) {
    ElMessage.warning('请至少添加一条目标属性条件')
    return
  }
  if (form.value.conditions.some((c) => !c.value.trim())) {
    ElMessage.warning('请填写条件阈值')
    return
  }
  loading.value = true
  try {
    await saveThreatRuleApi({
      id: props.row?.id,
      ruleCode: form.value.ruleCode.trim(),
      ruleName: form.value.ruleName.trim(),
      areaRegionType: form.value.areaRegionType as ThreatRule['areaRegionType'],
      threatLevel: form.value.threatLevel,
      targetType: form.value.targetType,
      areaName: form.value.areaName.trim() || undefined,
      conditions: form.value.conditions,
      priority: form.value.priority,
      planId: form.value.planId,
      enabled: form.value.enabled
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
    width="640px"
    max-height="85vh"
  >
    <ElAlert
      v-if="showSwarmHint"
      type="warning"
      :closable="false"
      show-icon
      class="mb-12px"
      title="蜂群规则"
      :description="UI.swarmHint"
    />
    <ElForm label-width="100px">
      <ElFormItem :label="UI.ruleCode" required>
        <ElInput v-model="form.ruleCode" :disabled="isEdit" clearable />
      </ElFormItem>
      <ElFormItem :label="UI.ruleName" required>
        <ElInput v-model="form.ruleName" clearable />
      </ElFormItem>
      <ElFormItem :label="UI.threatLevel" required>
        <ElSelect v-model="form.threatLevel" class="w-full">
          <ElOption
            v-for="opt in threatLevelOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.label"
          />
        </ElSelect>
        <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">
          {{ UI.threatLevelHint }}
        </div>
      </ElFormItem>
      <ElFormItem :label="UI.areaRegionType" required>
        <ElSelect v-model="form.areaRegionType" class="w-full">
          <ElOption
            v-for="opt in areaRegionTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">
          {{ UI.areaRegionTypeHint }}
        </div>
      </ElFormItem>
      <ElFormItem :label="UI.targetType" required>
        <ElSelect v-model="form.targetType" class="w-full">
          <ElOption
            v-for="opt in targetTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="UI.area">
        <ElInput v-model="form.areaName" clearable />
      </ElFormItem>
      <ElFormItem :label="UI.targetProperty">
        <div class="w-full">
          <div
            v-for="row in form.conditions"
            :key="row.id"
            class="mb-8px flex items-center gap-8px"
          >
            <ElSelect v-model="row.property" style="width: 120px">
              <ElOption
                v-for="opt in conditionPropertyOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElSelect v-model="row.operator" style="width: 72px">
              <ElOption
                v-for="opt in conditionOperatorOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElInput v-model="row.value" style="width: 120px" clearable />
            <ElLink type="danger" @click="removeCondition(row.id)">{{ UI.conditionDelete }}</ElLink>
          </div>
          <BaseButton type="primary" link @click="addCondition">+ {{ UI.btnAddCondition }}</BaseButton>
        </div>
      </ElFormItem>
      <ElFormItem :label="UI.priority" required>
        <ElInputNumber v-model="form.priority" :min="1" :max="999" class="w-full" />
      </ElFormItem>
      <ElFormItem :label="UI.triggerPlan" required>
        <ElSelect v-model="form.planId" class="w-full" filterable>
          <ElOption
            v-for="p in planOptions"
            :key="p.id"
            :label="`${p.planName} (${p.planCode})`"
            :value="p.id"
          />
        </ElSelect>
        <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">
          {{ UI.triggerPlanHint }}
        </div>
      </ElFormItem>
      <ElFormItem :label="UI.enabled">
        <ElSwitch v-model="form.enabled" inline-prompt active-text="ON" inactive-text="OFF" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSave">{{ UI.btnSave }}</BaseButton>
    </template>
  </Dialog>
</template>
