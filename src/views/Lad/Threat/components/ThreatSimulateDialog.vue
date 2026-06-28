<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { simulateThreatApi } from '@/api/lad/threat'
import type { ThreatSimulateResult } from '@/api/lad/threat/types'
import { UI } from '../threatConstants'
import {
  createDefaultGeneralSimulateForm,
  generalFormToSimulateInput,
  type ThreatSimulateGeneralFormState
} from '../simulateFormUtils'
import ThreatSimulateGeneralForm from './ThreatSimulateGeneralForm.vue'
import ThreatSimulateParamForm, {
  type ThreatSimulateFormState
} from './ThreatSimulateParamForm.vue'
import ThreatSimulateResultPanel from './ThreatSimulateResultPanel.vue'
import { ElTabPane, ElTabs } from 'element-plus'

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

const simulateTab = ref<'general' | 'swarm'>('general')
const generalLoading = ref(false)
const swarmLoading = ref(false)
const generalResult = ref<ThreatSimulateResult>()
const swarmResult = ref<ThreatSimulateResult>()

function createSwarmForm(): ThreatSimulateFormState {
  return {
    speed: 4,
    stayMinutes: 5,
    intrusionCount: 1,
    targetType: '未知',
    targetModel: '全部型号',
    areaRegionType: 'nuclear',
    temperature: 28,
    humidity: 50,
    windPower: 2,
    rainfall: 0,
    swarmCount: 4
  }
}

const generalForm = ref<ThreatSimulateGeneralFormState>(createDefaultGeneralSimulateForm())
const swarmForm = ref(createSwarmForm())

function toSwarmPayload(form: ThreatSimulateFormState) {
  return {
    speed: form.speed,
    stayMinutes: form.stayMinutes,
    intrusionCount: form.intrusionCount,
    targetType: form.targetType === '全部' ? undefined : form.targetType,
    targetModel:
      form.targetModel === '全部型号' || form.targetModel === '全部' ? undefined : form.targetModel,
    areaRegionType: form.areaRegionType,
    temperature: form.temperature,
    humidity: form.humidity,
    windPower: form.windPower,
    rainfall: form.rainfall,
    swarmCount: form.swarmCount,
    swarmMode: true as const
  }
}

async function onRunGeneral() {
  generalLoading.value = true
  generalResult.value = undefined
  try {
    const res = await simulateThreatApi(generalFormToSimulateInput(generalForm.value))
    generalResult.value = res.data
  } finally {
    generalLoading.value = false
  }
}

async function onRunSwarm() {
  swarmLoading.value = true
  swarmResult.value = undefined
  try {
    const res = await simulateThreatApi(toSwarmPayload(swarmForm.value))
    swarmResult.value = res.data
  } finally {
    swarmLoading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" :title="UI.dialogSimulate" width="760px" max-height="85vh">
    <ElTabs v-model="simulateTab" class="threat-simulate-tabs">
      <ElTabPane :label="UI.simulateTabGeneral" name="general">
        <p class="threat-simulate-tabs__hint">{{ UI.simulateGeneralPresetHint }}</p>
        <ThreatSimulateGeneralForm v-model="generalForm" />
        <ThreatSimulateResultPanel :result="generalResult" class="mt-12px" />

        <div class="threat-simulate-tabs__actions">
          <BaseButton type="primary" :loading="generalLoading" @click="onRunGeneral">
            {{ UI.simulateRun }}
          </BaseButton>
        </div>
      </ElTabPane>

      <ElTabPane :label="UI.simulateTabSwarm" name="swarm">
        <p class="threat-simulate-tabs__hint">{{ UI.simulateSwarmPresetHint }}</p>
        <ThreatSimulateParamForm v-model="swarmForm" show-swarm-count />
        <ThreatSimulateResultPanel :result="swarmResult" class="mt-12px" />

        <div class="threat-simulate-tabs__actions">
          <BaseButton type="primary" :loading="swarmLoading" @click="onRunSwarm">
            {{ UI.simulateRun }}
          </BaseButton>
        </div>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <BaseButton @click="visible = false">{{ UI.btnCancel }}</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped lang="less">
.threat-simulate-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 14px;
  }

  &__hint {
    margin: 0 0 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}
</style>
