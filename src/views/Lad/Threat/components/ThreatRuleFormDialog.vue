<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch
} from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getThreatRuleDetailApi, saveThreatRuleApi } from '@/api/lad/threat'
import { getPlanOptionsApi } from '@/api/lad/plan'
import type {
  RuleCondition,
  RuleConditionLogic,
  ThreatLevelScope,
  ThreatRule
} from '@/api/lad/threat/types'
import { LAD_DICT_THREAT_LEVEL } from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import { buildThreatLevelFormOptions, threatTargetModelSelectOptions } from '../threatConstants'
import ThreatConditionEditor from './ThreatConditionEditor.vue'
import { listTypeOptions } from '../../shared/ladOptionConstants'

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

const threatLevelOptions = computed(() => buildThreatLevelFormOptions(threatLevelEntries.value))
const loading = ref(false)
const defaultPlanId = ref('')

const form = ref({
  ruleCode: '',
  ruleName: '',
  targetType: '全部',
  targetModel: '全部型号',
  threatLevel: '中危' as ThreatLevelScope,
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

async function loadDefaults() {
  const planRes = await getPlanOptionsApi()
  defaultPlanId.value = planRes.data.find((item) => item.enabled)?.id || planRes.data[0]?.id || ''
}

function resetForm() {
  form.value = {
    ruleCode: generateThreatRuleCode(),
    ruleName: '',
    targetType: '全部',
    targetModel: '全部型号',
    threatLevel: '中危',
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
          targetModel: row.targetModel || '',
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
  if (!form.value.ruleName.trim()) {
    ElMessage.warning('请填写规则名称')
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
      targetModel: form.value.targetModel.trim() || '全部型号',
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
      <ElFormItem label="规则名称" required>
        <ElInput v-model="form.ruleName" clearable />
      </ElFormItem>
      <ElFormItem label="名单类型" required>
        <ElSelect v-model="form.targetType" class="w-full">
          <ElOption
            v-for="option in listTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="目标型号">
        <ElSelect v-model="form.targetModel" class="w-full" filterable>
          <ElOption
            v-for="option in threatTargetModelSelectOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="目标属性">
        <ThreatConditionEditor
          v-model="form.conditions"
          v-model:condition-logic="form.conditionLogic"
          mode="rule"
        />
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
        <div class="threat-rule-form__tip">规则条件命中后输出的威胁等级结论。</div>
      </ElFormItem>
      <ElFormItem label="状态">
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
.threat-rule-form__tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}
</style>
