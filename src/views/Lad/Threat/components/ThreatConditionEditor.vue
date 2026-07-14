<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAreaRegionListApi } from '@/api/lad/area'
import type { RuleCondition, RuleConditionLogic } from '@/api/lad/threat/types'
import { BaseButton } from '@/components/Button'
import { conditionOperatorOptions, conditionPropertyOptions } from '../../shared/ladOptionConstants'
import { ElInput, ElLink, ElOption, ElSelect } from 'element-plus'

type AreaOption = { label: string; value: string }

const props = withDefaults(
  defineProps<{
    mode?: 'rule' | 'simulate'
  }>(),
  { mode: 'rule' }
)

const conditions = defineModel<RuleCondition[]>({ required: true })

const conditionLogic = defineModel<RuleConditionLogic>('conditionLogic', { default: 'and' })

const areaOptions = ref<AreaOption[]>([])

const conditionLogicOptions: { label: string; value: RuleConditionLogic }[] = [
  { label: '且', value: 'and' },
  { label: '或', value: 'or' }
]

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
  if (props.mode === 'simulate') {
    condition.operator = '='
  } else if (!conditionOperatorOptions.some((item) => item.value === condition.operator)) {
    condition.operator = '>'
  }
  condition.value = ''
}

function addCondition() {
  const last = conditions.value[conditions.value.length - 1]
  if (last && !last.nextLogic) {
    last.nextLogic = conditionLogic.value === 'or' ? 'or' : 'and'
  }
  conditions.value.push(newCondition())
}

function removeCondition(id: string) {
  conditions.value = conditions.value.filter((item) => item.id !== id)
  const last = conditions.value[conditions.value.length - 1]
  if (last) last.nextLogic = undefined
}

onMounted(async () => {
  const areaRes = await getAreaRegionListApi({ pageIndex: 1, pageSize: 200 })
  areaOptions.value = areaRes.data.list.map((item) => ({
    label: item.name,
    value: item.id
  }))
})
</script>

<template>
  <div class="w-full">
    <div class="threat-condition-toolbar">
      <BaseButton type="primary" link @click="addCondition">+ 新增</BaseButton>
    </div>
    <div v-for="(condition, index) in conditions" :key="condition.id" class="threat-condition-row">
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

      <template v-else-if="mode === 'simulate'">
        <ElInput v-model="condition.value" class="threat-condition-row__value" clearable />
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
        v-if="index < conditions.length - 1"
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
</style>
