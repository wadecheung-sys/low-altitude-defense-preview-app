<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { onMounted, ref } from 'vue'
import { ElCascader, ElForm, ElFormItem, ElOption, ElSelect } from 'element-plus'
import { getAreaRegionListApi } from '@/api/lad/area'
import { THREAT_LEVEL_OPTIONS } from '@/api/lad/threat/threatLevelUtils'
import { UI } from '../planConstants'
import { allOption } from '../../shared/ladOptionConstants'
import { buildPlanAreaCascaderOptions, type PlanAreaCascaderOption } from '../planAreaOptions'
import type { PlanSimulateFormState } from '../simulateFormUtils'
import PlanWeatherConditionEditor from './PlanWeatherConditionEditor.vue'

defineProps<{
  form: PlanSimulateFormState
}>()

const threatLevelOptions = [allOption, ...THREAT_LEVEL_OPTIONS]

const areaOptions = ref<PlanAreaCascaderOption[]>([])

async function loadAreaOptions() {
  const res = await getAreaRegionListApi({ pageIndex: 1, pageSize: 200 })
  areaOptions.value = buildPlanAreaCascaderOptions(res.data.list)
}

onMounted(() => {
  void loadAreaOptions()
})
</script>

<template>
  <ElForm label-width="96px">
    <ElFormItem :label="UI.threatLevel" required>
      <ElSelect v-model="form.threatLevel" class="w-full" placeholder="请选择威胁等级">
        <ElOption
          v-for="option in threatLevelOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem :label="UI.locatedArea">
      <ElCascader
        v-model="form.areaLevel"
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
      />
    </ElFormItem>
    <ElFormItem :label="UI.weatherElements">
      <PlanWeatherConditionEditor
        v-model="form.weatherConditions"
        v-model:condition-logic="form.weatherConditionLogic"
      />
    </ElFormItem>
  </ElForm>
</template>
