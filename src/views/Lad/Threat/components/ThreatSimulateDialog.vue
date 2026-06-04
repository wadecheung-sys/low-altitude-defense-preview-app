<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { simulateThreatApi } from '@/api/lad/threat'
import { SWARM_TARGET_TYPE } from '@/api/lad/threat/threatSwarm'
import type { ThreatSimulateResult } from '@/api/lad/threat/types'
import { UI } from '../threatConstants'
import {
  dictEntriesToOptions,
  LAD_DICT_AREA_REGION_TYPE
} from '../../shared/ladDictHelpers'
import { useLadDictOptions } from '../../shared/useLadDictOptions'
import { targetTypeOptions, weatherOptions } from '../../shared/ladOptionConstants'
import {
  ElAlert,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElOption,
  ElSelect
} from 'element-plus'

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
  targetType: '目标类型',
  areaRegionType: '区域类型',
  weatherFactor: '天气场景',
  run: '开始模拟'
}

const weatherSimOptions = weatherOptions.filter((o) => o.value !== '')

const form = ref({
  speed: 6,
  stayMinutes: 12,
  intrusionCount: 1,
  swarmCount: 4,
  targetType: SWARM_TARGET_TYPE,
  areaRegionType: 'warning',
  weatherFactor: '全部'
})

const isSwarmMode = computed(
  () => form.value.targetType === SWARM_TARGET_TYPE || form.value.swarmCount >= 3
)

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
    <ElAlert
      v-if="isSwarmMode"
      type="warning"
      :closable="false"
      show-icon
      class="mb-12px"
      title="蜂群模拟"
      :description="UI.swarmHint"
    />
    <ElForm label-width="108px">
      <ElFormItem :label="L.targetType">
        <ElSelect v-model="form.targetType" class="w-full">
          <ElOption
            v-for="opt in targetTypeOptions.filter((o) => o.value !== '全部')"
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
      <ElFormItem :label="L.weatherFactor">
        <ElSelect v-model="form.weatherFactor" class="w-full">
          <ElOption
            v-for="opt in weatherSimOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
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
      <p v-if="result.swarmNote" class="text-13px mb-4px text-[var(--el-color-warning)]">
        {{ result.swarmNote }}
      </p>
      <p v-if="result.matched" class="text-13px mb-4px">
        {{ UI.triggerPlan }}{{ colon }}{{ result.planName }}（{{ result.planCode }}）
      </p>
      <p v-if="result.matched && result.planDeviceType" class="text-13px">
        {{ UI.detailDeviceType }}{{ colon }}{{ result.planDeviceType }} / {{ result.planDeviceFunction }}
      </p>
    </ElAlert>
    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onRun">{{ L.run }}</BaseButton>
    </template>
  </Dialog>
</template>
