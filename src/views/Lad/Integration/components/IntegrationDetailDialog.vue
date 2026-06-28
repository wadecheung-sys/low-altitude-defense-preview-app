<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import {
  getIntegrationDetailApi,
  probeIntegrationApi,
  reconnectIntegrationApi
} from '@/api/lad/integration'
import type { IntegrationDetailResult, IntegrationRunStatus } from '@/api/lad/integration/types'
import { UI, runStatusLabel, runStatusTagType } from '../integrationConstants'
import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag
} from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  endpointId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  probed: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const probing = ref(false)
const reconnecting = ref(false)
const detail = ref<IntegrationDetailResult | null>(null)

function canReconnect(status: IntegrationRunStatus) {
  return status === 'stopped' || status === 'error' || status === 'unknown'
}

async function loadDetail() {
  if (!props.endpointId) return
  loading.value = true
  try {
    const res = await getIntegrationDetailApi({ id: props.endpointId })
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) loadDetail()
  }
)

async function onProbe() {
  if (!props.endpointId) return
  probing.value = true
  try {
    await probeIntegrationApi({ ids: [props.endpointId] })
    ElMessage.success(UI.probeDone)
    await loadDetail()
    emit('probed')
  } finally {
    probing.value = false
  }
}

async function onReconnect() {
  if (!props.endpointId) return
  reconnecting.value = true
  try {
    const res = await reconnectIntegrationApi({ id: props.endpointId })
    if (res.data.success) {
      ElMessage.success(res.data.message)
    } else {
      ElMessage.error(res.data.message)
    }
    await loadDetail()
    emit('probed')
  } finally {
    reconnecting.value = false
  }
}

const ep = computed(() => detail.value?.endpoint)
const showReconnect = computed(() => ep.value && canReconnect(ep.value.runStatus))
</script>

<template>
  <Dialog v-model="visible" :title="UI.dialogTitle" width="720px" max-height="80vh">
    <div v-loading="loading">
      <ElDescriptions v-if="ep" :column="2" border class="mb-16px">
        <ElDescriptionsItem :label="UI.colLinkCode">{{ ep.linkCode }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.colRunStatus">
          <ElTag :type="runStatusTagType[ep.runStatus]" effect="light" round>
            {{ runStatusLabel[ep.runStatus] }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.colDescription" :span="2">
          {{ ep.description }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.colHeartbeat">{{ ep.heartbeatText }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="UI.colDataUpdatedAt">{{ ep.dataUpdatedAt }}</ElDescriptionsItem>
        <ElDescriptionsItem label="API">
          {{ ep.baseUrl }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="Protocol">
          {{ ep.protocol }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="ep.lastError" label="Error" :span="2">
          {{ ep.lastError }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <div class="lad-int-detail__section-title">{{ UI.sectionProbeHistory }}</div>
      <ElTable
        v-if="detail?.recentProbes?.length"
        :data="detail.recentProbes"
        border
        size="small"
        max-height="240"
      >
        <ElTableColumn type="index" label="序号" width="65" align="center" />
        <ElTableColumn prop="checkedAt" :label="UI.colDataUpdatedAt" width="170" />
        <ElTableColumn label="Result" width="80">
          <template #default="{ row }">
            <ElTag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? 'OK' : 'FAIL' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Latency" width="90">
          <template #default="{ row }">
            {{ row.success ? `${row.latencyMs} ms` : '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="message" label="Message" min-width="160" show-overflow-tooltip />
      </ElTable>
      <ElEmpty v-else :description="UI.dialogProbe" :image-size="64" />
    </div>
    <template #footer>
      <BaseButton v-if="showReconnect" type="primary" :loading="reconnecting" @click="onReconnect">
        {{ UI.dialogReconnect }}
      </BaseButton>
      <BaseButton type="primary" :loading="probing" @click="onProbe">{{
        UI.dialogProbe
      }}</BaseButton>
      <BaseButton @click="visible = false">{{ UI.dialogClose }}</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped>
.lad-int-detail__section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
