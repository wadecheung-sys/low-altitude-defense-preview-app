<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import {
  createPlanWeatherCondition,
  planConditionOperatorOptions,
  planWeatherConditionLogicOptions,
  planWeatherPropertyOptions
} from '@/api/lad/plan/planWeatherConditions'
import type {
  PlanWeatherCondition,
  PlanWeatherConditionLogic,
  PlanWeatherConditionProperty
} from '@/api/lad/plan/types'
import { ElInputNumber, ElLink, ElOption, ElSelect } from 'element-plus'

const conditions = defineModel<PlanWeatherCondition[]>({ required: true })

const conditionLogic = defineModel<PlanWeatherConditionLogic>('conditionLogic', {
  default: 'and'
})

const valueBounds: Record<
  PlanWeatherConditionProperty,
  { min?: number; max?: number; step?: number }
> = {
  temperature: { min: -50, max: 80, step: 1 },
  humidity: { min: 0, max: 100, step: 1 },
  windPower: { min: 0, step: 1 },
  rainfall: { min: 0, step: 1 }
}

function conditionNumberValue(condition: PlanWeatherCondition) {
  if (condition.value === '') return undefined
  const value = Number(condition.value)
  return Number.isFinite(value) ? value : undefined
}

function updateConditionNumber(condition: PlanWeatherCondition, value?: number | null) {
  condition.value = value === undefined || value === null ? '' : String(value)
}

function onPropertyChange(condition: PlanWeatherCondition) {
  condition.value = ''
}

function addCondition() {
  const last = conditions.value[conditions.value.length - 1]
  if (last && !last.nextLogic) last.nextLogic = conditionLogic.value || 'and'
  conditions.value.push(createPlanWeatherCondition())
}

function removeCondition(id: string) {
  conditions.value = conditions.value.filter((item) => item.id !== id)
  const last = conditions.value[conditions.value.length - 1]
  if (last) last.nextLogic = undefined
}
</script>

<template>
  <div class="w-full">
    <div class="plan-weather-condition-toolbar">
      <BaseButton type="primary" link @click="addCondition">+ 新增</BaseButton>
    </div>
    <div
      v-for="(condition, index) in conditions"
      :key="condition.id"
      class="plan-weather-condition-row"
    >
      <ElSelect
        v-model="condition.property"
        class="plan-weather-condition-row__property"
        @change="onPropertyChange(condition)"
      >
        <ElOption
          v-for="option in planWeatherPropertyOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>

      <ElSelect v-model="condition.operator" class="plan-weather-condition-row__operator">
        <ElOption
          v-for="option in planConditionOperatorOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>

      <ElInputNumber
        :model-value="conditionNumberValue(condition)"
        v-bind="valueBounds[condition.property]"
        controls-position="right"
        class="plan-weather-condition-row__value"
        @update:model-value="updateConditionNumber(condition, $event)"
      />

      <ElLink type="danger" @click="removeCondition(condition.id)">删除</ElLink>

      <ElSelect
        v-if="index < conditions.length - 1"
        v-model="condition.nextLogic"
        class="plan-weather-condition-row__logic"
      >
        <ElOption
          v-for="option in planWeatherConditionLogicOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
    </div>
  </div>
</template>

<style scoped lang="less">
.plan-weather-condition-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.plan-weather-condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.plan-weather-condition-row__property {
  width: 100px;
}

.plan-weather-condition-row__operator {
  width: 72px;
}

.plan-weather-condition-row__value {
  width: 140px;
}

.plan-weather-condition-row__logic {
  width: 76px;
}
</style>
