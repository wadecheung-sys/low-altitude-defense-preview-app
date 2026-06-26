<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { simulateThreatApi } from '@/api/lad/threat'
import type { ThreatSimulateResult } from '@/api/lad/threat/types'
import { UI } from '../threatConstants'
import { dictEntriesToOptions, LAD_DICT_AREA_REGION_TYPE } from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import { listTypeOptions, targetModelOptions } from '../../shared/ladOptionConstants'
import { ElAlert, ElForm, ElFormItem, ElInputNumber, ElOption, ElSelect } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { entries: areaTypeEntries } = useLadDictOptions(LAD_DICT_AREA_REGION_TYPE)

const areaRegionTypeOptions = computed(() =>
  dictEntriesToOptions(areaTypeEntries.value).filter((o) => o.value !== '全部')
)

const loading = ref(false)
const result = ref<ThreatSimulateResult>()

const colon = '：'

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
  rainfall: '雨量',
  run: '开始模拟'
}

const simulateTargetTypeOptions = listTypeOptions.filter((o) => o.value !== '全部')

const form = ref({
  speed: 6,
  stayMinutes: 12,
  intrusionCount: 1,
  swarmCount: 4,
  targetType: simulateTargetTypeOptions[0]?.value || '未知',
  targetModel: 'DJI Mavic 3',
  areaRegionType: 'warning',
  temperature: 30,
  humidity: 60,
  windPower: 3,
  rainfall: 0
})

async function onRun() {
  loading.value = true
  result.value = undefined
  try {
    const res = await simulateThreatApi({ ...form.value })
    result.value = res.data
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" :title="UI.dialogSimulate" width="560px" max-height="85vh">
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
            v-for="opt in targetModelOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="L.swarmCount">
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
    <ElAlert
      v-if="result"
      class="mt-12px"
      :type="result.matched ? 'success' : 'warning'"
      :title="result.message"
      :closable="false"
      show-icon
    >
      <p v-if="result.matched" class="text-13px mb-4px">
        {{ UI.triggerPlan }}{{ colon }}{{ result.planName }}（{{ result.planCode }}）
      </p>
      <p v-if="result.matched && result.planDeviceType" class="text-13px">
        {{ UI.detailDeviceType }}{{ colon }}{{ result.planDeviceType }} /
        {{ result.planDeviceFunction }}
      </p>
    </ElAlert>
    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onRun">{{ L.run }}</BaseButton>
    </template>
  </Dialog>
</template>
