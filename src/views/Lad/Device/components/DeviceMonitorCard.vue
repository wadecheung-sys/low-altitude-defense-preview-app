<script setup lang="ts">
import type { DeviceMonitorItem } from '@/api/lad/device-monitor/types'
import { getDeviceInfoDetailApi } from '@/api/lad/device-info'
import type { DeviceLinkedArchive } from '@/api/lad/device-info/types'
import { DEVICE_ARCHIVE_PLACEHOLDER } from '../constants'
import productImage from '@/assets/imgs/counter-uas-device.png'
import deviceSiteCctv from '@/assets/imgs/device-site-cctv.png'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { ElCard, ElDialog, ElImage, ElPopover, ElTooltip } from 'element-plus'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  item: DeviceMonitorItem
}>()

const emit = defineEmits<{
  detail: [DeviceMonitorItem]
}>()

const videoVisible = ref(false)
const archiveLoading = ref(false)
const linkedArchiveDetail = ref<DeviceLinkedArchive | null>(null)

const displayImage = computed(() => {
  const image = props.item.imageUrl
  return image && image !== DEVICE_ARCHIVE_PLACEHOLDER ? image : productImage
})

const connectionLabel = computed(() => {
  if (props.item.onlineStatus === '正常') return '设备连接正常'
  if (props.item.onlineStatus === '异常') return '设备链路异常'
  return '设备连接已断开'
})

const linkedArchive = computed(() => linkedArchiveDetail.value ?? props.item.linkedArchive)

async function loadArchiveDetail() {
  archiveLoading.value = true
  try {
    const res = await getDeviceInfoDetailApi(props.item.id)
    linkedArchiveDetail.value = res.data.linkedArchive
  } catch {
    linkedArchiveDetail.value = props.item.linkedArchive
  } finally {
    archiveLoading.value = false
  }
}

async function onPopoverShow() {
  if (!linkedArchiveDetail.value) {
    await loadArchiveDetail()
  }
}

function onPopoverHide() {
  linkedArchiveDetail.value = null
}

watch(
  () => props.item.id,
  () => {
    linkedArchiveDetail.value = null
  }
)
</script>

<template>
  <ElCard class="device-monitor-card" shadow="hover" :body-style="{ padding: '0' }">
    <header class="device-monitor-card__head">
      <button type="button" class="device-monitor-card__name" @click="emit('detail', item)">
        {{ item.deviceName }}
      </button>
      <ElTooltip :content="connectionLabel" placement="top">
        <span class="device-monitor-card__connection" :class="`is-${item.onlineStatus}`">
          <Icon icon="vi-ep:link" :size="18" />
        </span>
      </ElTooltip>
    </header>

    <div class="device-monitor-card__body">
      <div class="device-monitor-card__photo">
        <ElImage :src="displayImage" fit="cover" class="device-monitor-card__img" />
        <ElTooltip content="视频监控" placement="top">
          <button
            type="button"
            class="device-monitor-card__eye"
            aria-label="查看视频监控"
            @click="videoVisible = true"
          >
            <Icon icon="vi-ep:view" :size="18" />
          </button>
        </ElTooltip>
      </div>

      <div class="device-monitor-card__facts">
        <div class="device-monitor-card__runtime">
          <span>连续运行时长：</span>
          <strong>{{ item.runtimeText }}</strong>
        </div>
        <dl class="device-monitor-card__info">
          <div
            ><dt>设备编号：</dt><dd>{{ item.deviceId }}</dd></div
          >
          <div
            ><dt>设备类型：</dt><dd>{{ item.deviceType }}</dd></div
          >
          <div
            ><dt>厂商：</dt><dd>{{ item.manufacturer }}</dd></div
          >
          <div
            ><dt>设备型号：</dt><dd>{{ item.deviceModel }}</dd></div
          >
          <div
            ><dt>区域：</dt><dd>{{ item.deployLocation || '—' }}</dd></div
          >
          <div
            ><dt>IP：</dt><dd>{{ item.ipAddress || '—' }}</dd></div
          >
        </dl>
      </div>

      <ElPopover
        placement="top-end"
        trigger="click"
        :width="460"
        popper-class="device-monitor-popper"
        @show="onPopoverShow"
        @hide="onPopoverHide"
      >
        <template #reference>
          <button
            type="button"
            class="device-monitor-card__expand-button"
            aria-label="展开档案指标"
          >
            <Icon icon="vi-ep:top-right" :size="17" />
          </button>
        </template>

        <div class="device-monitor-detail-popover">
          <div class="device-monitor-detail-popover__title">
            <span>{{ item.deviceName }}</span>
            <BaseButton link type="primary" @click="emit('detail', item)">查看详情</BaseButton>
          </div>

          <div v-loading="archiveLoading" class="device-monitor-detail-popover__archive-pane">
            <div
              v-if="linkedArchive?.indicators.length"
              class="device-monitor-detail-popover__indicators"
            >
              <div class="device-monitor-detail-popover__indicators-head">
                <span>指标项</span>
                <span>单位</span>
                <span>指标值</span>
              </div>
              <div class="device-monitor-detail-popover__indicators-body">
                <div
                  v-for="row in linkedArchive.indicators"
                  :key="row.id"
                  class="device-monitor-detail-popover__indicator-row"
                >
                  <span :title="row.item">{{ row.item }}</span>
                  <span>{{ row.unit || '—' }}</span>
                  <strong :title="row.value || '—'">{{ row.value || '—' }}</strong>
                </div>
              </div>
            </div>
            <p v-else-if="linkedArchive && !archiveLoading" class="device-monitor-detail-popover__empty">
              暂无档案指标
            </p>
            <p v-else-if="!archiveLoading" class="device-monitor-detail-popover__empty">
              未关联基础档案，暂无档案指标
            </p>
          </div>
        </div>
      </ElPopover>
    </div>

    <ElDialog
      v-model="videoVisible"
      :title="`${item.deviceName} · 视频监控`"
      width="760px"
      append-to-body
      destroy-on-close
    >
      <div class="device-video-monitor">
        <div class="device-video-monitor__topbar">
          <span><i></i> LIVE · CAMERA 01</span>
          <span>{{ item.deployLocation || '设备安装区域' }}</span>
        </div>
        <div class="device-video-monitor__view">
          <ElImage :src="deviceSiteCctv" fit="cover" class="device-video-monitor__image" />
          <div class="device-video-monitor__grain"></div>
          <div class="device-video-monitor__camera-label">设备周边监控 / 固定机位</div>
          <div class="device-video-monitor__timestamp">{{ item.lastHeartbeat }}</div>
        </div>
        <div class="device-video-monitor__footer">
          <span>通道：园区监控-01</span>
          <span>画面状态：正常</span>
          <span>录像：持续存储</span>
        </div>
      </div>
    </ElDialog>
  </ElCard>
</template>

<style scoped lang="less">
.device-monitor-card {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-color: #d4dde3;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 36px;
    padding: 6px 10px 6px 12px;
    background: linear-gradient(90deg, #dff7fb, #ecfbfc);
    border-bottom: 1px solid #c6e7eb;
  }

  &__name {
    overflow: hidden;
    border: 0;
    background: none;
    color: #173b4e;
    font-size: 14px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  &__connection {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #40b820;

    &.is-异常 {
      color: #e6a23c;
    }

    &.is-离线 {
      color: #a3abb2;
    }
  }

  &__body {
    position: relative;
    display: grid;
    grid-template-columns: 148px minmax(0, 1fr);
    gap: 14px;
    min-height: 170px;
    padding: 14px 14px 20px;
  }

  &__photo {
    position: relative;
    align-self: start;
    aspect-ratio: 1.22;
    overflow: hidden;
    border: 1px solid #e0e6ea;
    border-radius: 3px;
    background: #101722;
  }

  &__img {
    width: 100%;
    height: 100%;
  }

  &__eye {
    position: absolute;
    top: 6px;
    right: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    color: #4a9c19;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(16, 45, 55, 0.2);

    &:hover {
      color: var(--el-color-primary);
      transform: scale(1.04);
    }
  }

  &__facts {
    min-width: 0;
  }

  &__runtime {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 0 0 7px;
    font-size: 12px;
    color: var(--el-text-color-regular);

    strong {
      color: #d63ca5;
      font:
        700 12px 'JetBrains Mono',
        monospace;
    }
  }

  &__info {
    margin: 0;
    font-size: 12px;
    line-height: 1.62;

    div {
      display: grid;
      grid-template-columns: 72px minmax(0, 1fr);
    }

    dt {
      color: var(--el-text-color-secondary);
    }

    dd {
      overflow: hidden;
      margin: 0;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__expand-button {
    position: absolute;
    right: 8px;
    bottom: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: #1f294c;
    color: #fff;
    cursor: pointer;

    &:hover {
      background: var(--el-color-primary);
    }
  }
}

.device-monitor-detail-popover {
  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    font-weight: 600;
  }

  &__archive-pane {
    min-height: 80px;
    margin-top: 8px;
  }

  &__empty {
    margin: 0;
    padding: 12px 10px;
    border-radius: 5px;
    background: #f5f7f9;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
    text-align: center;
  }

  &__indicators {
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 5px;
  }

  &__indicators-head,
  &__indicator-row {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) 56px minmax(0, 1fr);
    gap: 8px;
    padding: 6px 10px;
    font-size: 11px;
  }

  &__indicators-head {
    background: #eef2f5;
    color: var(--el-text-color-secondary);
    font-weight: 600;
  }

  &__indicators-body {
    max-height: 160px;
    overflow-y: auto;
  }

  &__indicator-row {
    border-top: 1px solid var(--el-border-color-extra-light);

    span,
    strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: var(--el-text-color-regular);
      font-weight: 500;
    }
  }
}

.device-video-monitor {
  overflow: hidden;
  border: 1px solid #273e49;
  border-radius: 7px;
  background: #09151a;
  color: #bce7dc;

  &__topbar,
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 12px;
    background: #0d222a;
    font: 11px monospace;
  }

  &__topbar i {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 5px;
    border-radius: 50%;
    background: #42e3b4;
    box-shadow: 0 0 8px #42e3b4;
  }

  &__view {
    position: relative;
    aspect-ratio: 16 / 8;
    overflow: hidden;
    background: #101820;
  }

  &__image {
    width: 100%;
    height: 100%;
    filter: saturate(0.72) contrast(1.08) brightness(0.84);

    :deep(.el-image__inner) {
      transform: scale(1.045);
    }
  }

  &__grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(0deg, transparent 0 3px, rgba(213, 238, 229, 0.055) 4px),
      linear-gradient(
        90deg,
        rgba(8, 26, 31, 0.12),
        transparent 25%,
        transparent 75%,
        rgba(8, 26, 31, 0.16)
      );
  }

  &__camera-label,
  &__timestamp {
    position: absolute;
    z-index: 2;
    padding: 4px 7px;
    background: rgba(4, 14, 18, 0.58);
    color: #d4f4ea;
    font: 11px monospace;
  }

  &__camera-label {
    top: 10px;
    left: 10px;
  }

  &__timestamp {
    right: 10px;
    bottom: 10px;
  }

  &__footer {
    justify-content: flex-start;
    color: #8fb5ac;
  }
}

@media (max-width: 560px) {
  .device-monitor-card__body {
    grid-template-columns: 118px minmax(0, 1fr);
    gap: 10px;
  }
}
</style>
