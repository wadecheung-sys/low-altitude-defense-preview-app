<script setup lang="ts">
import { ElForm, ElFormItem, ElInputNumber } from 'element-plus'
import { UI } from '../threatConstants'

export interface ThreatSimulateSwarmFormState {
  swarmCount: number
}

const form = defineModel<ThreatSimulateSwarmFormState>({ required: true })
</script>

<template>
  <ElForm label-width="108px">
    <ElFormItem :label="UI.swarmCount" required>
      <ElInputNumber v-model="form.swarmCount" :min="1" :max="99" class="w-full" />
    </ElFormItem>
  </ElForm>
</template>
