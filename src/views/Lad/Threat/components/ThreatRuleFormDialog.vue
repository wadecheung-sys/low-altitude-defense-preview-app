<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
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
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getThreatRuleDetailApi, saveThreatRuleApi } from '@/api/lad/threat'
import { getAreaRegionListApi } from '@/api/lad/area'
import { getPlanOptionsApi } from '@/api/lad/plan'
import type {
  RuleCondition,
  RuleConditionLogic,
  ThreatLevelLabel,
  ThreatRule
} from '@/api/lad/threat/types'
import { dictEntriesToOptions, LAD_DICT_THREAT_LEVEL } from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import {
  conditionOperatorOptions,
  conditionPropertyOptions,
  targetTypeOptions
} from '../../shared/ladOptionConstants'

type AreaOption = {
  label: string
  value: string
}

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

const { entries: threatLevelEntries, reload: reloadThreatLevels } = useLadDictOptions(
  LAD_DICT_THREAT_LEVEL,
  false
)

const threatLevelOptions = computed(() => dictEntriesToOptions(threatLevelEntries.value))
const loading = ref(false)
const areaOptions = ref<AreaOption[]>([])
const defaultPlanId = ref('')
const conditionLogicOptions: { label: string; value: RuleConditionLogic }[] = [
  { label: '且', value: 'and' },
  { label: '或', value: 'or' }
]

const form = ref({
  ruleCode: '',
  ruleName: '',
  targetType: '全部',
  threatLevel: '中' as ThreatLevelLabel,
  priority: 500,
  enabled: true,
  conditionLogic: 'and' as RuleConditionLogic,
  conditions: [] as RuleCondition[]
})

function generateThreatRuleCode() {
  const now = new Date()
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')
  return `THREAT-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(Math.floor(Math.random() * 100))}`
}

function newCondition(): RuleCondition {
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    property: 'speed',
    operator: '>',
    value: '',
    nextLogic: undefined
  }
}

function isAreaCondition(condition: RuleCondition) {
  return condition.property === 'locatedArea'
}

function conditionValueArray(condition: RuleCondition) {
  if (!condition.value) return []
  return condition.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function updateConditionValue(condition: RuleCondition, value: string[]) {
  condition.value = value.join(',')
  condition.operator = '='
}

function onPropertyChange(condition: RuleCondition) {
  if (isAreaCondition(condition)) {
    condition.operator = '='
    condition.value = ''
    return
  }
  if (!conditionOperatorOptions.some((item) => item.value === condition.operator)) {
    condition.operator = '>'
  }
  condition.value = ''
}

function addCondition() {
  const last = form.value.conditions[form.value.conditions.length - 1]
  if (last && !last.nextLogic) last.nextLogic = 'and'
  form.value.conditions.push(newCondition())
}

function removeCondition(id: string) {
  form.value.conditions = form.value.conditions.filter((item) => item.id !== id)
  const last = form.value.conditions[form.value.conditions.length - 1]
  if (last) last.nextLogic = undefined
}

async function loadDefaults() {
  const [areaRes, planRes] = await Promise.all([
    getAreaRegionListApi({ pageIndex: 1, pageSize: 200 }),
    getPlanOptionsApi()
  ])
  areaOptions.value = areaRes.data.list.map((item) => ({
    label: item.name,
    value: item.id
  }))
  defaultPlanId.value = planRes.data.find((item) => item.enabled)?.id || planRes.data[0]?.id || ''
}

function resetForm() {
  form.value = {
    ruleCode: generateThreatRuleCode(),
    ruleName: '',
    targetType: '全部',
    threatLevel: '中',
    priority: 500,
    enabled: true,
    conditionLogic: 'and',
    conditions: [newCondition()]
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await Promise.all([reloadThreatLevels(), loadDefaults()])
    if (props.row?.id) {
      loading.value = true
      try {
        const res = await getThreatRuleDetailApi({ id: props.row.id })
        const row = res.data
        form.value = {
          ruleCode: row.ruleCode,
          ruleName: row.ruleName,
          targetType: row.targetType,
          threatLevel: row.threatLevel,
          priority: row.priority,
          enabled: row.enabled,
          conditionLogic: row.conditionLogic || 'and',
          conditions: row.conditions.map((item, index) => ({
            ...item,
            nextLogic:
              index < row.conditions.length - 1
                ? item.nextLogic || row.conditionLogic || 'and'
                : undefined
          }))
        }
      } finally {
        loading.value = false
      }
    } else {
      resetForm()
    }
  }
)

onMounted(() => {
  if (props.modelValue) {
    reloadThreatLevels()
    loadDefaults()
  }
})

async function onSave() {
  if (!form.value.ruleCode.trim() || !form.value.ruleName.trim()) {
    ElMessage.warning('请填写规则编号与名称')
    return
  }
  if (!form.value.conditions.length) {
    ElMessage.warning('请至少添加一条目标属性条件')
    return
  }
  if (
    form.value.conditions.some((item) =>
      isAreaCondition(item) ? conditionValueArray(item).length === 0 : !item.value.trim()
    )
  ) {
    ElMessage.warning('请完善条件值')
    return
  }

  loading.value = true
  try {
    await saveThreatRuleApi({
      id: props.row?.id,
      ruleCode: form.value.ruleCode.trim(),
      ruleName: form.value.ruleName.trim(),
      areaRegionType: '全部',
      targetType: form.value.targetType,
      threatLevel: form.value.threatLevel,
      conditionLogic: form.value.conditionLogic,
      conditions: form.value.conditions.map((item, index) => ({
        ...item,
        operator: isAreaCondition(item) ? '=' : item.operator,
        value: item.value.trim(),
        nextLogic: index < form.value.conditions.length - 1 ? item.nextLogic || 'and' : undefined
      })),
      priority: form.value.priority,
      planId: props.row?.planId || defaultPlanId.value,
      enabled: form.value.enabled
    })
    ElMessage.success('保存成功')
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
    :title="isEdit ? '编辑规则' : '新增规则'"
    width="760px"
    max-height="85vh"
  >
    <ElForm label-width="100px">
      <ElFormItem label="规则编号" required>
        <ElInput v-model="form.ruleCode" disabled />
      </ElFormItem>
      <ElFormItem label="规则名称" required>
        <ElInput v-model="form.ruleName" clearable />
      </ElFormItem>
      <ElFormItem label="目标类型" required>
        <ElSelect v-model="form.targetType" class="w-full">
          <ElOption
            v-for="option in targetTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="目标属性">
        <div class="w-full">
          <div class="threat-condition-toolbar">
            <BaseButton type="primary" link @click="addCondition">+ 新增</BaseButton>
          </div>
          <div
            v-for="(condition, index) in form.conditions"
            :key="condition.id"
            class="threat-condition-row"
          >
            <ElSelect
              v-model="condition.property"
              class="threat-condition-row__property"
              @change="onPropertyChange(condition)"
            >
              <ElOption
                v-for="option in conditionPropertyOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>

            <template v-if="isAreaCondition(condition)">
              <span class="threat-rule-form__operator-label">属于</span>
              <ElSelect
                :model-value="conditionValueArray(condition)"
                multiple
                collapse-tags
                collapse-tags-tooltip
                clearable
                class="threat-condition-row__area"
                placeholder="请选择区域"
                @update:model-value="updateConditionValue(condition, $event)"
              >
                <ElOption
                  v-for="option in areaOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </template>

            <template v-else>
              <ElSelect v-model="condition.operator" class="threat-condition-row__operator">
                <ElOption
                  v-for="option in conditionOperatorOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
              <ElInput v-model="condition.value" class="threat-condition-row__value" clearable />
            </template>

            <ElLink type="danger" @click="removeCondition(condition.id)">删除</ElLink>
            <ElSelect
              v-if="index < form.conditions.length - 1"
              v-model="condition.nextLogic"
              class="threat-condition-row__logic"
            >
              <ElOption
                v-for="option in conditionLogicOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </div>
        </div>
      </ElFormItem>
      <ElFormItem label="威胁等级" required>
        <ElSelect v-model="form.threatLevel" class="w-full">
          <ElOption
            v-for="option in threatLevelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.label"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="优先级" required>
        <ElInputNumber
          v-model="form.priority"
          :min="0"
          :max="999"
          :step="1"
          step-strictly
          controls-position="right"
          class="w-full"
        />
        <div class="threat-rule-form__tip">范围 0-999，数值越大，规则命中优先级越高。</div>
      </ElFormItem>
      <ElFormItem label="启停">
        <ElSwitch v-model="form.enabled" inline-prompt active-text="ON" inactive-text="OFF" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <BaseButton @click="visible = false">取消</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSave">保存</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped lang="less">
.threat-condition-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.threat-condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.threat-condition-row__property {
  width: 140px;
}

.threat-condition-row__operator {
  width: 72px;
}

.threat-condition-row__value {
  width: 160px;
}

.threat-condition-row__area {
  width: 280px;
}

.threat-condition-row__logic {
  width: 76px;
}

.threat-rule-form__operator-label {
  width: 40px;
  color: var(--el-text-color-regular);
  text-align: center;
}

.threat-rule-form__tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}
</style>
