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
  normalizeSimulateConditions,
  type ThreatSimulateGeneralFormState
} from '../simulateFormUtils'
import ThreatSimulateGeneralForm from './ThreatSimulateGeneralForm.vue'
import ThreatSimulateSwarmForm, {
  type ThreatSimulateSwarmFormState
} from './ThreatSimulateSwarmForm.vue'
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

function createSwarmForm(): ThreatSimulateSwarmFormState {
  return { swarmCount: 4 }
}

const generalForm = ref<ThreatSimulateGeneralFormState>(createDefaultGeneralSimulateForm())
const swarmForm = ref(createSwarmForm())

function toSwarmPayload(form: ThreatSimulateSwarmFormState) {
  return {
    swarmCount: form.swarmCount,
    swarmMode: true as const
  }
}

async function onRunGeneral() {
  generalLoading.value = true
  generalResult.value = undefined
  try {
    generalForm.value.conditions = normalizeSimulateConditions(
      generalForm.value.conditions,
      generalForm.value.conditionLogic
    )
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
        <ThreatSimulateGeneralForm v-model="generalForm" />
        <ThreatSimulateResultPanel :result="generalResult" class="mt-12px" />

        <div class="threat-simulate-tabs__actions">
          <BaseButton type="primary" :loading="generalLoading" @click="onRunGeneral">
            {{ UI.simulateRun }}
          </BaseButton>
        </div>
      </ElTabPane>

      <ElTabPane :label="UI.simulateTabSwarm" name="swarm">
        <ThreatSimulateSwarmForm v-model="swarmForm" />
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

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}
</style>
