<script setup lang="ts">
import type { DeviceMonitorItem } from '@/api/lad/device-monitor/types'
import { getDeviceRuntimeSnapshotApi } from '@/api/lad/device-monitor'
import type {
  DeviceRuntimeMetric,
  DeviceRuntimeMetricLevel,
  DeviceRuntimeSnapshot
} from '@/api/lad/device-monitor'
import {
  buildMonitorVideoChannels,
  findLinkageByMasterDeviceId,
  type DeviceMonitorVideoChannel
} from '@/api/lad/device-monitor/videoChannels'
import { getDeviceLinkageListApi } from '@/api/lad/device-group'
import { getDeviceInfoListApi } from '@/api/lad/device-info'
import { DEVICE_ARCHIVE_PLACEHOLDER } from '../constants'
import productImage from '@/assets/imgs/counter-uas-device.png'
import deviceSiteCctv from '@/assets/imgs/device-site-cctv.png'
import { BaseButton } from '@/components/Button'
import { Link, TopRight, View } from '@element-plus/icons-vue'
import {
  ElCard,
  ElDialog,
  ElIcon,
  ElImage,
  ElOption,
  ElPagination,
  ElPopover,
  ElSelect,
  ElTooltip
} from 'element-plus'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const VIDEO_GRID_SIZE = 4

const props = defineProps<{
  item: DeviceMonitorItem
}>()

const emit = defineEmits<{
  detail: [DeviceMonitorItem]
}>()

const videoVisible = ref(false)
const videoLoading = ref(false)
const videoChannels = ref<DeviceMonitorVideoChannel[]>([])
const activeChannelId = ref('')
const videoPage = ref(1)
const runtimeLoading = ref(false)
const runtimeSnapshot = ref<DeviceRuntimeSnapshot | null>(null)

let runtimeRefreshTimer: number | undefined

const isMultiChannelView = computed(() => videoChannels.value.length > 1)

const videoPageCount = computed(() =>
  Math.max(1, Math.ceil(videoChannels.value.length / VIDEO_GRID_SIZE))
)

const pagedVideoChannels = computed(() => {
  const start = (videoPage.value - 1) * VIDEO_GRID_SIZE
  return videoChannels.value.slice(start, start + VIDEO_GRID_SIZE)
})

const activeChannel = computed(
  () => videoChannels.value.find((item) => item.id === activeChannelId.value) ?? null
)

const liveStatusClass = computed(() => channelLiveStatusClass(activeChannel.value))

function channelLiveStatusClass(channel: DeviceMonitorVideoChannel | null | undefined) {
  if (!channel?.online) return 'is-offline'
  if (props.item.onlineStatus === '异常') return 'is-warning'
  return 'is-live'
}

const displayImage = computed(() => {
  const image = props.item.imageUrl
  return image && image !== DEVICE_ARCHIVE_PLACEHOLDER ? image : productImage
})

const connectionLabel = computed(() => {
  if (props.item.onlineStatus === '正常') return '设备连接正常'
  if (props.item.onlineStatus === '异常') return '设备链路异常'
  return '设备连接已断开'
})

async function loadRuntimeSnapshot() {
  runtimeLoading.value = true
  try {
    const res = await getDeviceRuntimeSnapshotApi(props.item.id)
    runtimeSnapshot.value = res.data
  } finally {
    runtimeLoading.value = false
  }
}

async function onPopoverShow() {
  window.clearInterval(runtimeRefreshTimer)
  await loadRuntimeSnapshot()
  runtimeRefreshTimer = window.setInterval(() => void loadRuntimeSnapshot(), 5000)
}

function onPopoverHide() {
  window.clearInterval(runtimeRefreshTimer)
  runtimeRefreshTimer = undefined
}

function runtimeLevelLabel(level: DeviceRuntimeMetricLevel | undefined) {
  const labels: Record<DeviceRuntimeMetricLevel, string> = {
    normal: '正常',
    running: '运行',
    warning: '注意',
    fault: '故障',
    unknown: '未知'
  }
  return labels[level ?? 'unknown']
}

function runtimeMetricValue(metric: DeviceRuntimeMetric) {
  if (!metric.unit) return String(metric.value)
  const compactUnits = new Set(['°', '%'])
  return `${metric.value}${compactUnits.has(metric.unit) ? '' : ' '}${metric.unit}`
}

async function loadVideoChannels() {
  videoLoading.value = true
  try {
    const [linkageRes, infoRes] = await Promise.all([
      getDeviceLinkageListApi({ pageIndex: 1, pageSize: 999 }),
      getDeviceInfoListApi({ pageIndex: 1, pageSize: 999 })
    ])
    const linkage = findLinkageByMasterDeviceId(linkageRes.data.list, props.item.id)
    videoChannels.value = buildMonitorVideoChannels(props.item, linkage, infoRes.data.list)
    activeChannelId.value = videoChannels.value[0]?.id ?? ''
    videoPage.value = 1
  } finally {
    videoLoading.value = false
  }
}

async function openVideoMonitor() {
  videoVisible.value = true
  await loadVideoChannels()
}

watch(videoVisible, (visible) => {
  if (!visible) {
    videoChannels.value = []
    activeChannelId.value = ''
    videoPage.value = 1
  }
})

watch(
  () => props.item.id,
  () => {
    runtimeSnapshot.value = null
    onPopoverHide()
  }
)

onBeforeUnmount(onPopoverHide)
</script>

<template>
  <ElCard class="device-monitor-card" shadow="hover" :body-style="{ padding: '0' }">
    <header class="device-monitor-card__head">
      <button type="button" class="device-monitor-card__name" @click="emit('detail', item)">
        {{ item.deviceName }}
      </button>
      <ElTooltip :content="connectionLabel" placement="top">
        <span class="device-monitor-card__connection" :class="`is-${item.onlineStatus}`">
          <ElIcon :size="18"><Link /></ElIcon>
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
            @click="openVideoMonitor"
          >
            <ElIcon :size="18"><View /></ElIcon>
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
            aria-label="查看实时运行状态"
          >
            <ElIcon :size="17"><TopRight /></ElIcon>
          </button>
        </template>

        <div class="device-monitor-detail-popover">
          <div class="device-monitor-detail-popover__title">
            <span>{{ item.deviceName }}</span>
            <BaseButton link type="primary" @click="emit('detail', item)">查看详情</BaseButton>
          </div>

          <div v-loading="runtimeLoading" class="device-monitor-detail-popover__runtime-pane">
            <div
              v-if="runtimeSnapshot?.metrics.length"
              class="device-monitor-detail-popover__metrics"
            >
              <div class="device-monitor-detail-popover__metrics-head">
                <span>状态项</span>
                <span>当前值</span>
                <span>状态</span>
              </div>
              <div class="device-monitor-detail-popover__metrics-body">
                <div
                  v-for="row in runtimeSnapshot.metrics"
                  :key="row.key"
                  class="device-monitor-detail-popover__metric-row"
                >
                  <span :title="row.label">{{ row.label }}</span>
                  <strong :title="runtimeMetricValue(row)">{{ runtimeMetricValue(row) }}</strong>
                  <em :class="`is-${row.level || 'unknown'}`">
                    {{ runtimeLevelLabel(row.level) }}
                  </em>
                </div>
              </div>
              <div class="device-monitor-detail-popover__updated-at">
                <span>型号：{{ runtimeSnapshot.model }}</span>
                <span>数据更新：{{ runtimeSnapshot.updatedAt }}</span>
              </div>
            </div>
            <p v-else-if="!runtimeLoading" class="device-monitor-detail-popover__empty">
              暂无实时运行状态
            </p>
          </div>
        </div>
      </ElPopover>
    </div>

    <ElDialog
      v-model="videoVisible"
      :title="`${item.deviceName} · 视频监控`"
      :width="isMultiChannelView ? '960px' : '820px'"
      append-to-body
      destroy-on-close
    >
      <div v-loading="videoLoading" class="device-video-monitor">
        <template v-if="!videoLoading && !videoChannels.length">
          <p class="device-video-monitor__empty">未配置关联摄像头，请前往设备关联配置</p>
        </template>
        <template v-else>
          <div v-if="!isMultiChannelView" class="device-video-monitor__switcher">
            <span class="device-video-monitor__switcher-label">监控机位</span>
            <ElSelect
              v-model="activeChannelId"
              class="device-video-monitor__switcher-select"
              placeholder="请选择监控机位"
            >
              <ElOption
                v-for="channel in videoChannels"
                :key="channel.id"
                :label="channel.label"
                :value="channel.id"
              />
            </ElSelect>
          </div>
          <div v-else class="device-video-monitor__switcher device-video-monitor__switcher--grid">
            <span class="device-video-monitor__switcher-label">
              共 {{ videoChannels.length }} 路监控 · 四宫格预览
            </span>
            <span v-if="videoPageCount > 1" class="device-video-monitor__switcher-page">
              第 {{ videoPage }} / {{ videoPageCount }} 页
            </span>
          </div>

          <template v-if="!isMultiChannelView && activeChannel">
            <div class="device-video-monitor__topbar">
              <span :class="liveStatusClass">
                <i></i>
                {{ activeChannel.online ? 'LIVE' : 'OFFLINE' }} · {{ activeChannel.deviceCode }}
              </span>
              <span>{{ activeChannel.deployLocation }}</span>
            </div>
            <div class="device-video-monitor__view">
              <ElImage :src="deviceSiteCctv" fit="cover" class="device-video-monitor__image" />
              <div class="device-video-monitor__grain"></div>
              <div class="device-video-monitor__camera-label">{{ activeChannel.deviceName }}</div>
              <div class="device-video-monitor__timestamp">{{ activeChannel.lastHeartbeat }}</div>
            </div>
            <div class="device-video-monitor__footer">
              <span>通道：{{ activeChannel.deviceName }}</span>
              <span>编号：{{ activeChannel.deviceCode }}</span>
              <span>画面状态：{{ activeChannel.online ? '正常' : '无信号' }}</span>
            </div>
          </template>

          <template v-else-if="isMultiChannelView && pagedVideoChannels.length">
            <div class="device-video-monitor__grid">
              <article
                v-for="(channel, index) in pagedVideoChannels"
                :key="channel.id"
                class="device-video-monitor__cell"
              >
                <div class="device-video-monitor__cell-head">
                  <span :class="channelLiveStatusClass(channel)">
                    <i></i>
                    {{ channel.online ? 'LIVE' : 'OFFLINE' }} · {{ channel.deviceCode }}
                  </span>
                  <span>{{ (videoPage - 1) * VIDEO_GRID_SIZE + index + 1 }}</span>
                </div>
                <div class="device-video-monitor__cell-view">
                  <ElImage :src="deviceSiteCctv" fit="cover" class="device-video-monitor__image" />
                  <div class="device-video-monitor__grain"></div>
                  <div class="device-video-monitor__camera-label">{{ channel.deviceName }}</div>
                  <div class="device-video-monitor__timestamp">{{ channel.lastHeartbeat }}</div>
                </div>
                <div class="device-video-monitor__cell-foot">
                  <span>{{ channel.deployLocation }}</span>
                  <span>{{ channel.online ? '正常' : '无信号' }}</span>
                </div>
              </article>
            </div>
            <div v-if="videoPageCount > 1" class="device-video-monitor__pager">
              <ElPagination
                v-model:current-page="videoPage"
                :page-size="VIDEO_GRID_SIZE"
                :total="videoChannels.length"
                layout="prev, pager, next"
                background
                small
              />
            </div>
          </template>
        </template>
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
    margin: 0 0 10px;
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

  &__runtime-pane {
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

  &__metrics {
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 5px;
  }

  &__metrics-head,
  &__metric-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr) 54px;
    gap: 8px;
    padding: 6px 10px;
    font-size: 11px;
  }

  &__metrics-head {
    background: #eef2f5;
    color: var(--el-text-color-secondary);
    font-weight: 600;
  }

  &__metrics-body {
    max-height: 220px;
    overflow-y: auto;
  }

  &__metric-row {
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

    em {
      justify-self: end;
      padding: 1px 6px;
      border-radius: 8px;
      background: var(--el-fill-color);
      color: var(--el-text-color-secondary);
      font-style: normal;
      font-size: 10px;

      &.is-normal {
        background: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }

      &.is-running {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &.is-warning {
        background: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }

      &.is-fault {
        background: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }
  }

  &__updated-at {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 10px;
    border-top: 1px solid var(--el-border-color-extra-light);
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-secondary);
    font-size: 10px;
  }
}

.device-video-monitor {
  overflow: hidden;
  border: 1px solid #273e49;
  border-radius: 7px;
  background: #09151a;
  color: #bce7dc;

  &__switcher {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #0b1a21;
    border-bottom: 1px solid #1a333d;

    &--grid {
      justify-content: space-between;
    }
  }

  &__switcher-page {
    color: #8fb5ac;
    font: 11px monospace;
  }

  &__switcher-label {
    flex-shrink: 0;
    color: #8fb5ac;
    font-size: 12px;
  }

  &__switcher-select {
    flex: 1;
    min-width: 0;
    max-width: 420px;
  }

  &__empty {
    margin: 0;
    padding: 28px 16px;
    color: #8fb5ac;
    font-size: 13px;
    text-align: center;
  }

  &__topbar,
  &__footer,
  &__cell-head,
  &__cell-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 12px;
    background: #0d222a;
    font: 11px monospace;
  }

  &__cell-head,
  &__cell-foot {
    padding: 6px 8px;
    font-size: 10px;
  }

  &__cell-foot {
    justify-content: space-between;
    color: #8fb5ac;
  }

  &__topbar i,
  &__cell-head i {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 5px;
    border-radius: 50%;
  }

  &__topbar .is-live i,
  &__cell-head .is-live i {
    background: #42e3b4;
    box-shadow: 0 0 8px #42e3b4;
  }

  &__topbar .is-warning i,
  &__cell-head .is-warning i {
    background: #e6a23c;
    box-shadow: 0 0 8px #e6a23c;
  }

  &__topbar .is-offline i,
  &__cell-head .is-offline i {
    background: #7a8790;
    box-shadow: none;
  }

  &__topbar .is-live,
  &__cell-head .is-live {
    color: #d4f4ea;
  }

  &__topbar .is-warning,
  &__cell-head .is-warning {
    color: #f3d19e;
  }

  &__topbar .is-offline,
  &__cell-head .is-offline {
    color: #9aa8b0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2px;
    background: #1a333d;
  }

  &__cell {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #09151a;
  }

  &__cell-view {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #101820;
  }

  &__pager {
    display: flex;
    justify-content: center;
    padding: 10px 12px 12px;
    background: #0b1a21;
    border-top: 1px solid #1a333d;

    :deep(.el-pagination) {
      --el-pagination-bg-color: #13242c;
      --el-pagination-button-bg-color: #13242c;
      --el-pagination-hover-color: #42e3b4;
      --el-pagination-text-color: #8fb5ac;
    }
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
    max-width: calc(100% - 16px);
    overflow: hidden;
    padding: 4px 7px;
    background: rgba(4, 14, 18, 0.58);
    color: #d4f4ea;
    font: 11px monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__cell-view &__camera-label,
  &__cell-view &__timestamp {
    font-size: 10px;
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
