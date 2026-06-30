<script setup lang="ts">
import type { ThreatSimulateGeneralFormState } from '../simulateFormUtils'
import { listTypeOptions } from '../../shared/ladOptionConstants'
import { threatTargetModelSelectOptions } from '../threatConstants'
import ThreatConditionEditor from './ThreatConditionEditor.vue'
import { ElForm, ElFormItem, ElOption, ElSelect } from 'element-plus'

const form = defineModel<ThreatSimulateGeneralFormState>({ required: true })
</script>

<template>
  <ElForm label-width="100px">
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
        mode="simulate"
      />
    </ElFormItem>
  </ElForm>
</template>
