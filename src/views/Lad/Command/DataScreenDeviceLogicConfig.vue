<script setup lang="ts">
import type { DeviceArchiveConfigurableItem } from '@/api/lad/device/types'
import { getDeviceInfoDetailApi, saveDeviceInfoApi } from '@/api/lad/device-info'
import type { DeviceInfoDetail } from '@/api/lad/device-info/types'
import { BaseButton } from '@/components/Button'
import {
  ALL_CATALOG_DEVICES,
  INTERNAL_PLACEHOLDER_DEVICES,
  type DeviceConfigurableItemTemplate
} from '@/constants/deviceCatalog'
import {
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from 'element-plus'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  deviceRecordId?: string
  deviceModel: string
  runtimeConfigItems: Array<DeviceConfigurableItemTemplate & { currentValue: string }>
}>()

const emit = defineEmits<{
  saved: []
}>()

const loading = ref(false)
const saveLoading = ref(false)
const detail = ref<DeviceInfoDetail | null>(null)
const deviceConfigValues = ref<Record<string, string>>({})

function findCatalogEntry(model: string) {
  return (
    ALL_CATALOG_DEVICES.find((item) => item.model === model) ??
    INTERNAL_PLACEHOLDER_DEVICES.find((item) => item.model === model)
  )
}

function toArchiveConfigurableItems(
  items: DeviceConfigurableItemTemplate[]
): DeviceArchiveConfigurableItem[] {
  return items.map((item, index) => ({
    ...item,
    id: `catalog-${props.deviceModel}-${item.key}-${index + 1}`
  }))
}

function syncDeviceConfigDefaults(items: DeviceArchiveConfigurableItem[], preserve = true) {
  const next: Record<string, string> = preserve ? { ...deviceConfigValues.value } : {}
  items
    .filter((item) => item.scope === 'device')
    .forEach((item) => {
      if (next[item.key] === undefined) {
        next[item.key] = item.defaultValue || ''
      }
    })
  Object.keys(next).forEach((key) => {
    if (!items.some((item) => item.scope === 'device' && item.key === key)) {
      delete next[key]
    }
  })
  deviceConfigValues.value = next
}

const configDefinitions = computed((): DeviceArchiveConfigurableItem[] => {
  if (detail.value?.linkedArchive?.configurableItems?.length) {
    return detail.value.linkedArchive.configurableItems
  }
  const entry = findCatalogEntry(props.deviceModel)
  return entry ? toArchiveConfigurableItems(entry.configurableItems) : []
})

const deviceScopeConfigItems = computed(() =>
  configDefinitions.value.filter((item) => item.scope === 'device')
)

function parseSelectOptions(hint?: string): string[] | null {
  if (!hint?.trim()) return null
  const normalized = hint.replace(/\s+/g, ' ').trim()
  if (!normalized.includes(' / ')) return null
  const options = normalized
    .split(' / ')
    .map((part) => part.trim())
    .filter(Boolean)
  return options.length >= 2 ? options : null
}

function isNumericConfig(item: DeviceArchiveConfigurableItem) {
  if (item.unit) return true
  const hint = item.hint?.trim() ?? ''
  return /^\d/.test(hint) || hint.includes('~')
}

function numericBounds(hint?: string): { min?: number; max?: number } {
  const match = hint?.match(/(\d+(?:\.\d+)?)\s*~\s*(\d+(?:\.\d+)?)/)
  if (!match) return {}
  return { min: Number(match[1]), max: Number(match[2]) }
}

function configLabel(item: DeviceArchiveConfigurableItem) {
  return item.unit ? `${item.label}（${item.unit}）` : item.label
}

async function loadDetail() {
  if (!props.deviceRecordId) {
    detail.value = null
    const entry = findCatalogEntry(props.deviceModel)
    syncDeviceConfigDefaults(
      entry ? toArchiveConfigurableItems(entry.configurableItems) : [],
      false
    )
    return
  }

  loading.value = true
  try {
    const res = await getDeviceInfoDetailApi(props.deviceRecordId)
    detail.value = res.data
    deviceConfigValues.value = { ...(res.data.deviceConfigValues || {}) }
    if (res.data.linkedArchive) {
      syncDeviceConfigDefaults(res.data.linkedArchive.configurableItems)
    }
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  if (!props.deviceRecordId || !detail.value) {
    ElMessage.warning('当前设备未关联台账，无法保存配置')
    return
  }

  saveLoading.value = true
  try {
    const current = detail.value
    await saveDeviceInfoApi({
      id: current.id,
      deviceId: current.deviceId,
      deviceName: current.deviceName,
      archiveInfo: current.archiveInfo,
      archiveId: current.archiveId,
      deviceType: current.deviceType,
      deployLocation: current.deployLocation,
      deployAddress: current.deployAddress,
      ipAddress: current.ipAddress,
      serialNo: current.serialNo,
      personInCharge: current.personInCharge,
      contactPhone: current.contactPhone,
      longitude: current.longitude,
      latitude: current.latitude,
      mapX: current.mapX,
      mapY: current.mapY,
      deviceIcon: current.deviceIcon,
      imageUrl: current.imageUrl,
      controlRangeM: current.controlRangeM,
      remark: current.remark,
      extendedFields: current.extendedFields,
      deviceConfigValues: { ...deviceConfigValues.value }
    })
    ElMessage.success('逻辑配置已保存')
    emit('saved')
    await loadDetail()
  } finally {
    saveLoading.value = false
  }
}

watch(
  () => [props.deviceRecordId, props.deviceModel] as const,
  () => {
    void loadDetail()
  },
  { immediate: true }
)
</script>

<template>
  <div v-loading="loading" class="lad-logic-config">
    <section class="lad-device-detail-panel">
      <div class="lad-logic-config__header">
        <h4 class="lad-device-detail-panel__title">设备级配置</h4>
        <BaseButton
          v-if="deviceRecordId"
          type="primary"
          :loading="saveLoading"
          :disabled="!deviceScopeConfigItems.length"
          @click="saveConfig"
        >
          保存配置
        </BaseButton>
      </div>
      <p v-if="deviceScopeConfigItems.length" class="lad-device-detail-panel__hint">
        以下参数可在设备部署后调整；保存后将同步至设备台账。
      </p>
      <ElForm
        v-if="deviceScopeConfigItems.length"
        label-position="top"
        class="lad-logic-config__form"
      >
        <ElFormItem
          v-for="item in deviceScopeConfigItems"
          :key="item.key"
          :label="configLabel(item)"
        >
          <ElSelect
            v-if="parseSelectOptions(item.hint)"
            v-model="deviceConfigValues[item.key]"
            :placeholder="item.hint || '请选择'"
            clearable
            class="lad-logic-config__control"
          >
            <ElOption
              v-for="option in parseSelectOptions(item.hint)"
              :key="option"
              :label="option"
              :value="option"
            />
          </ElSelect>
          <ElInputNumber
            v-else-if="isNumericConfig(item)"
            :model-value="
              deviceConfigValues[item.key] === '' ? undefined : Number(deviceConfigValues[item.key])
            "
            :min="numericBounds(item.hint).min"
            :max="numericBounds(item.hint).max"
            :placeholder="item.hint || '请输入'"
            controls-position="right"
            class="lad-logic-config__control"
            @update:model-value="
              (value: number | undefined) => {
                deviceConfigValues[item.key] = value === undefined ? '' : String(value)
              }
            "
          />
          <ElInput
            v-else
            v-model="deviceConfigValues[item.key]"
            :placeholder="item.hint || '请输入'"
            clearable
            class="lad-logic-config__control"
          />
          <p v-if="item.hint && parseSelectOptions(item.hint)" class="lad-logic-config__field-hint">
            {{ item.hint }}
          </p>
        </ElFormItem>
      </ElForm>
      <ElEmpty v-else description="暂无设备级逻辑配置项" :image-size="72" />
    </section>

    <section class="lad-device-detail-panel">
      <h4 class="lad-device-detail-panel__title">运行时控制项</h4>
      <p class="lad-device-detail-panel__hint">
        转台角度等运行时参数由「控制台」实时下发，不在此持久化。
      </p>
      <ElTable v-if="runtimeConfigItems.length" :data="runtimeConfigItems" border size="small">
        <ElTableColumn prop="label" label="控制项" min-width="160" />
        <ElTableColumn prop="currentValue" label="当前值" min-width="140" />
        <ElTableColumn prop="unit" label="单位" width="80" />
        <ElTableColumn prop="hint" label="说明" min-width="220" show-overflow-tooltip />
      </ElTable>
      <ElEmpty v-else description="暂无运行时控制项" :image-size="72" />
    </section>
  </div>
</template>

<style scoped lang="less">
.lad-logic-config__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  .lad-device-detail-panel__title {
    margin: 0;
  }
}

.lad-logic-config__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}

.lad-logic-config__control {
  width: 100%;
}

.lad-logic-config__field-hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.lad-device-detail-panel {
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.lad-device-detail-panel__title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.lad-device-detail-panel__hint {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

@media (max-width: 720px) {
  .lad-logic-config__form {
    grid-template-columns: 1fr;
  }
}
</style>
