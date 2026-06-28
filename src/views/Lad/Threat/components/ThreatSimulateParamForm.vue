<script setup lang="ts">
import { computed } from 'vue'
import { dictEntriesToOptions, LAD_DICT_AREA_REGION_TYPE } from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import { listTypeOptions } from '../../shared/ladOptionConstants'
import { threatTargetModelSelectOptions } from '../threatConstants'
import { ElForm, ElFormItem, ElInputNumber, ElOption, ElSelect } from 'element-plus'

export interface ThreatSimulateFormState {
  speed: number
  stayMinutes: number
  intrusionCount: number
  targetType: string
  targetModel: string
  areaRegionType: string
  temperature: number
  humidity: number
  windPower: number
  rainfall: number
  swarmCount: number
}

defineProps<{
  showSwarmCount?: boolean
}>()

const form = defineModel<ThreatSimulateFormState>({ required: true })

const { entries: areaTypeEntries } = useLadDictOptions(LAD_DICT_AREA_REGION_TYPE)

const areaRegionTypeOptions = computed(() =>
  dictEntriesToOptions(areaTypeEntries.value).filter((o) => o.value !== '全部')
)

const simulateTargetTypeOptions = listTypeOptions

const simulateTargetModelOptions = threatTargetModelSelectOptions

const L = {
  speed: '速度 (m/s)',
  stay: '逗留 (min)',
  intrusion: '入侵次数',
  swarmCount: '蜂群机数',
  targetType: '名单类型',
  targetModel: '目标型号',
  areaRegionType: '区域类型',
  temperature: '温度',
  humidity: '湿度',
  windPower: '风力',
  rainfall: '雨量'
}
</script>

<template>
  <ElForm label-width="108px">
    <ElFormItem :label="L.targetType">
      <ElSelect v-model="form.targetType" class="w-full">
        <ElOption
          v-for="opt in simulateTargetTypeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem :label="L.targetModel">
      <ElSelect v-model="form.targetModel" class="w-full" filterable>
        <ElOption
          v-for="opt in simulateTargetModelOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem v-if="showSwarmCount" :label="L.swarmCount">
      <ElInputNumber v-model="form.swarmCount" :min="1" :max="99" class="w-full" />
    </ElFormItem>
    <ElFormItem :label="L.speed">
      <ElInputNumber v-model="form.speed" :min="0" :max="200" class="w-full" />
    </ElFormItem>
    <ElFormItem :label="L.stay">
      <ElInputNumber v-model="form.stayMinutes" :min="0" :max="999" class="w-full" />
    </ElFormItem>
    <ElFormItem :label="L.intrusion">
      <ElInputNumber v-model="form.intrusionCount" :min="0" :max="99" class="w-full" />
    </ElFormItem>
    <ElFormItem :label="L.areaRegionType">
      <ElSelect v-model="form.areaRegionType" class="w-full">
        <ElOption
          v-for="opt in areaRegionTypeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem :label="L.temperature">
      <ElInputNumber v-model="form.temperature" :min="-50" :max="80" class="w-full" />
    </ElFormItem>
    <ElFormItem :label="L.humidity">
      <ElInputNumber v-model="form.humidity" :min="0" :max="100" class="w-full" />
    </ElFormItem>
    <ElFormItem :label="L.windPower">
      <ElInputNumber v-model="form.windPower" :min="0" :max="20" class="w-full" />
    </ElFormItem>
    <ElFormItem :label="L.rainfall">
      <ElInputNumber v-model="form.rainfall" :min="0" :max="999" class="w-full" />
    </ElFormItem>
  </ElForm>
</template>
