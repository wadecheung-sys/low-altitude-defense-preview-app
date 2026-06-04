<script setup lang="ts">
import type { DeviceMonitorItem } from '@/api/lad/device-monitor/types'
import { DEVICE_ARCHIVE_PLACEHOLDER } from '../constants'
import { ElCard, ElDescriptions, ElDescriptionsItem, ElImage, ElLink, ElTag } from 'element-plus'

defineProps<{
  item: DeviceMonitorItem
}>()

const emit = defineEmits<{
  detail: [DeviceMonitorItem]
}>()

function runStatusTagType(status: string) {
  if (status === '正常') return 'success'
  if (status === '异常') return 'warning'
  return 'info'
}
</script>

<template>
  <ElCard
    class="device-monitor-card"
    shadow="hover"
    :body-style="{ padding: '12px' }"
    @click="emit('detail', item)"
  >
    <div class="device-monitor-card__photo">
      <ElImage
        :src="item.imageUrl || DEVICE_ARCHIVE_PLACEHOLDER"
        fit="contain"
        class="device-monitor-card__img"
      >
        <template #error>
          <div class="device-monitor-card__img-fallback">暂无设备照片</div>
        </template>
      </ElImage>
    </div>

    <div class="device-monitor-card__head">
      <ElLink type="primary" :underline="false" @click.stop="emit('detail', item)">
        {{ item.deviceName }}
      </ElLink>
      <ElTag size="small" :type="runStatusTagType(item.onlineStatus)" effect="light">
        {{ item.onlineStatus }}
      </ElTag>
    </div>

    <ElDescriptions :column="1" size="small" border class="device-monitor-card__desc">
      <ElDescriptionsItem label="设备编号">{{ item.deviceId }}</ElDescriptionsItem>
      <ElDescriptionsItem label="设备类型">{{ item.deviceType }}</ElDescriptionsItem>
      <ElDescriptionsItem label="厂商">{{ item.manufacturer }}</ElDescriptionsItem>
      <ElDescriptionsItem label="设备型号">{{ item.deviceModel }}</ElDescriptionsItem>
      <ElDescriptionsItem label="场地">{{ item.deployLocation }}</ElDescriptionsItem>
      <ElDescriptionsItem label="IP 地址">{{ item.ipAddress }}</ElDescriptionsItem>
      <ElDescriptionsItem label="连续运行">{{ item.runtimeText }}</ElDescriptionsItem>
      <ElDescriptionsItem label="今日统计">
        探测 {{ item.metrics.detectCount }} / 告警 {{ item.metrics.alertCount }} / 处置
        {{ item.metrics.handleCount }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="最后心跳">{{ item.lastHeartbeat }}</ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
</template>

<style scoped lang="less">
.device-monitor-card {
  height: 100%;
  cursor: pointer;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  &__photo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 140px;
    margin-bottom: 10px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
  }

  &__img {
    width: 100%;
    height: 100%;
  }

  &__img-fallback {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__head {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__desc {
    flex: 1;

    :deep(.el-descriptions__label) {
      width: 72px;
    }
  }
}
</style>
