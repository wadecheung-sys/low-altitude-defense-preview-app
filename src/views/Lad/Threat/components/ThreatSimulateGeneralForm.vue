<script setup lang="ts">
import { computed } from 'vue'
import type { ThreatSimulateGeneralFormState } from '../simulateFormUtils'
import { LAD_DICT_THREAT_LEVEL } from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import { listTypeOptions } from '../../shared/ladOptionConstants'
import { buildThreatLevelSelectOptions, threatTargetModelSelectOptions } from '../threatConstants'
import ThreatConditionEditor from './ThreatConditionEditor.vue'
import {
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch
} from 'element-plus'

const form = defineModel<ThreatSimulateGeneralFormState>({ required: true })

const { entries: threatLevelEntries } = useLadDictOptions(LAD_DICT_THREAT_LEVEL)
const threatLevelOptions = computed(() => buildThreatLevelSelectOptions(threatLevelEntries.value))
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
    <ElFormItem label="状态">
      <ElSwitch v-model="form.enabled" inline-prompt active-text="ON" inactive-text="OFF" />
    </ElFormItem>
  </ElForm>
</template>

<style scoped lang="less">
.threat-rule-form__tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}
</style>
