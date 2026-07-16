<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import DeviceRemoteControlPanel from '@/views/Lad/shared/DeviceRemoteControlPanel.vue'
import DataScreenDeviceLogicConfig from './DataScreenDeviceLogicConfig.vue'
import {
  buildDataScreenDeviceView,
  type DataScreenDetailTab,
  type DataScreenDeviceView,
  type DataScreenMetricItem
} from './dataScreenDeviceModel'
import {
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElTabPane,
  ElTabs,
  ElTag
} from 'element-plus'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  deviceModel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const activeTab = ref<DataScreenDetailTab>('monitor')
const deviceView = ref<DataScreenDeviceView | null>(null)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const dialogTitle = computed(() =>
  deviceView.value ? `${deviceView.value.deviceName} · 设备详情` : '设备详情'
)

function refreshDeviceView() {
  if (!props.deviceModel) return
  deviceView.value = buildDataScreenDeviceView(props.deviceModel)
}

watch(
  () => [props.modelValue, props.deviceModel] as const,
  ([open, model]) => {
    if (!open || !model) {
      deviceView.value = null
      return
    }
    activeTab.value = 'monitor'
    refreshDeviceView()
  },
  { immediate: true }
)

function formatMetric(item: DataScreenMetricItem) {
  return item.unit ? `${item.value} ${item.unit}` : item.value
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="960px"
    top="6vh"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="deviceView = null"
  >
    <div v-if="deviceView" class="lad-device-detail-modal">
      <div class="lad-device-detail-modal__summary">
        <p class="lad-device-detail-modal__meta">
          <span>{{ deviceView.model }}</span>
          <span> · {{ deviceView.deviceType }}</span>
          <span> · {{ deviceView.vendor }}</span>
          <span> · 编号 {{ deviceView.deviceCode }}</span>
        </p>
        <div class="lad-device-detail-modal__status">
          <ElTag type="success" size="small">{{ deviceView.onlineStatus }}</ElTag>
        </div>
      </div>

      <ElTabs v-model="activeTab">
        <ElTabPane label="监测数据" name="monitor">
          <section class="lad-device-detail-panel">
            <h4 class="lad-device-detail-panel__title">运行概览</h4>
            <ElDescriptions :column="3" border size="small">
              <ElDescriptionsItem
                v-for="item in deviceView.overviewMetrics"
                :key="item.label"
                :label="item.label"
              >
                <span :class="{ 'is-emphasis': item.emphasis }">{{ formatMetric(item) }}</span>
              </ElDescriptionsItem>
            </ElDescriptions>
          </section>

          <section class="lad-device-detail-panel">
            <h4 class="lad-device-detail-panel__title">实时监测</h4>
            <ElDescriptions :column="3" border size="small">
              <ElDescriptionsItem
                v-for="item in deviceView.liveMetrics"
                :key="item.label"
                :label="item.label"
              >
                <span :class="{ 'is-emphasis': item.emphasis }">{{ formatMetric(item) }}</span>
              </ElDescriptionsItem>
            </ElDescriptions>
          </section>

          <section class="lad-device-detail-panel">
            <h4 class="lad-device-detail-panel__title">设备规格</h4>
            <ElDescriptions :column="2" border size="small">
              <ElDescriptionsItem
                v-for="item in deviceView.specifications"
                :key="item.label"
                :label="item.label"
              >
                {{ formatMetric(item) }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </section>
        </ElTabPane>

        <ElTabPane label="操作台" name="console">
          <DeviceRemoteControlPanel
            :device-record-id="deviceView.deviceRecordId"
            :device-name="deviceView.deviceName"
            :device-type="deviceView.deviceType"
            :device-model="deviceView.model"
            :device-code="deviceView.deviceCode"
            :online="deviceView.onlineStatus === '在线'"
          />
        </ElTabPane>

        <ElTabPane label="逻辑配置" name="logic">
          <DataScreenDeviceLogicConfig
            v-if="deviceView"
            :device-record-id="deviceView.deviceRecordId"
            :device-model="deviceView.model"
            :runtime-config-items="deviceView.runtimeConfigItems"
            @saved="refreshDeviceView"
          />
        </ElTabPane>
      </ElTabs>
    </div>

    <ElEmpty v-else description="未找到设备数据" :image-size="88" />

    <template #footer>
      <BaseButton @click="visible = false">关闭</BaseButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="less">
.lad-device-detail-modal__summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.lad-device-detail-modal__meta {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.lad-device-detail-modal__status {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
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

.is-emphasis {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
