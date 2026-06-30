<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElAlert, ElDescriptions, ElDescriptionsItem, ElMessage, ElPagination, ElTag } from 'element-plus'
import { getHistoryEventDetailApi } from '@/api/lad/incident'
import { historyTargetTypeTagType, resolveHistoryTargetType } from '@/api/lad/incident/historyTargetType'
import type {
  DisposalTimelineNode,
  HistoryEventDetail,
  HandlingStatus,
  HistoryTargetType,
  ThreatLevel
} from '@/api/lad/incident/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import { listTypeTagType, threatLevelDisplay, threatLevelTagType, verificationMethodOf, countermeasureDeviceDisplay } from '../shared/ladDictHelpers'
import ManualConfirmDialog from './components/ManualConfirmDialog.vue'
import DisposalTimelinePanel from './components/DisposalTimelinePanel.vue'
import TrajectoryReplay from './components/TrajectoryReplay.vue'
import LadVideoMonitor from '../shared/LadVideoMonitor.vue'
import { buildTrajectoryListRows } from './trajectoryListRows'
import { targetAirframeLabel } from '../shared/ladOptionConstants'

defineOptions({
  name: 'LadIncidentTargetDetail'
})

const route = useRoute()
const { go } = useRouter()

const loading = ref(true)
const detail = ref<HistoryEventDetail | null>(null)
const loadError = ref('')
const replayRef = ref<InstanceType<typeof TrajectoryReplay> | null>(null)
const confirmVisible = ref(false)

const eventId = computed(() => String(route.params.id || ''))

const normalizeText = (text: unknown) =>
  String(text || '')
    .replaceAll('人工确认', '人工核查')
    .replaceAll('SN码', '识别码')
    .replaceAll('SN 码', '识别码')

const normalizedTimeline = (nodes: DisposalTimelineNode[] | undefined) =>
  (nodes || []).map((node) => ({
    ...node,
    title: normalizeText(node.title),
    summary: node.summary ? normalizeText(node.summary) : undefined,
    summaries: node.summaries?.map((line) => normalizeText(line)),
    details: node.details?.map((item) => ({
      ...item,
      label: normalizeText(item.label),
      value: normalizeText(item.value)
    })),
    detailGroups: node.detailGroups?.map((group) => ({
      ...group,
      title: normalizeText(group.title),
      details: group.details.map((item) => ({
        ...item,
        label: normalizeText(item.label),
        value: normalizeText(item.value)
      }))
    })),
    tags: node.tags?.map((tag) => normalizeText(tag))
  }))

const viewDetail = computed<HistoryEventDetail | null>(() => {
  if (!detail.value) return null

  const historyTargetType: HistoryTargetType =
    detail.value.historyTargetType ??
    resolveHistoryTargetType({
      uavSn: detail.value.uavSn,
      manualConfirmStatus: detail.value.manualConfirmStatus
    })

  return {
    ...detail.value,
    historyTargetType,
    targetId: normalizeText(detail.value.targetId),
    targetModel: normalizeText(detail.value.targetModel),
    uavSn: normalizeText(detail.value.uavSn),
    zoneName: normalizeText(detail.value.zoneName),
    frequencyInfo: normalizeText(detail.value.frequencyInfo),
    targetType: normalizeText(detail.value.targetType),
    detectionDevice: normalizeText(detail.value.detectionDevice),
    countermeasureDevice: countermeasureDeviceDisplay(normalizeText(detail.value.countermeasureDevice)),
    disposalDetail: normalizeText(detail.value.disposalDetail),
    remark: normalizeText(detail.value.remark),
    disposalTimeline: normalizedTimeline(detail.value.disposalTimeline)
  }
})

const trajectoryListRows = computed(() =>
  viewDetail.value ? buildTrajectoryListRows(viewDetail.value) : []
)

const TRAJECTORY_PAGE_SIZES = [10, 20, 50, 100]
const trajectoryPageIndex = ref(1)
const trajectoryPageSize = ref(10)

const showTrajectoryPagination = computed(() => trajectoryListRows.value.length > 10)

const paginatedTrajectoryListRows = computed(() => {
  const rows = trajectoryListRows.value
  if (!showTrajectoryPagination.value) return rows
  const start = (trajectoryPageIndex.value - 1) * trajectoryPageSize.value
  return rows.slice(start, start + trajectoryPageSize.value)
})

watch(eventId, () => {
  trajectoryPageIndex.value = 1
})

watch(trajectoryPageSize, () => {
  trajectoryPageIndex.value = 1
})

watch(trajectoryListRows, (rows) => {
  const maxPage = Math.max(1, Math.ceil(rows.length / trajectoryPageSize.value))
  if (trajectoryPageIndex.value > maxPage) {
    trajectoryPageIndex.value = maxPage
  }
})

const exportTrajectoryList = () => {
  const rows = trajectoryListRows.value
  if (!rows.length) {
    ElMessage.warning('暂无航迹数据可导出')
    return
  }
  const headers = [
    '序号',
    '目标ID',
    '时间',
    '高度(m)',
    '经度',
    '纬度',
    '距离(m)',
    '速度(m/s)',
    '方位角(°)',
    '俯仰角(°)'
  ]
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.seq,
        row.targetId,
        row.time,
        row.altitude,
        row.longitude,
        row.latitude,
        row.distance,
        row.speed,
        row.azimuth,
        row.pitch
      ].join(',')
    )
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `航机列表_${eventId.value || 'demo'}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('航机列表已导出')
}

const threatTagType = (level: ThreatLevel) => threatLevelTagType(level)

const statusLabel = (status: HandlingStatus) => {
  if (status === '待处置') return '未处置'
  return status
}

const showManualConfirm = computed(() => {
  const row = detail.value
  if (!row) return false
  return (
    !row.manualConfirmStatus.startsWith('人工-') &&
    row.handlingStatus !== '已处置' &&
    row.handlingStatus !== '已结束'
  )
})

const eoConnected = computed(() => {
  const device = viewDetail.value?.detectionDevice || ''
  return device.includes('光电')
})

const eoChannelLabel = computed(() => {
  const device = viewDetail.value?.detectionDevice || ''
  const match = device.match(/光电[-\w]*/)
  return match?.[0] || '光电-01'
})

const eoLocationLabel = computed(() => {
  const detail = viewDetail.value
  if (!detail) return '事件关联区域'
  return `${detail.targetModel || '--'} · ${detail.targetId || '--'}`
})

const openManualConfirm = () => {
  if (!detail.value) return
  confirmVisible.value = true
}

const onConfirmSuccess = () => {
  ElMessage.success('人工核查已保存')
  fetchDetail()
}

const fetchDetail = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getHistoryEventDetailApi(eventId.value || 'he-10001')
    detail.value = res.data
  } catch (error) {
    try {
      const fallback = await getHistoryEventDetailApi('he-10001')
      detail.value = fallback.data
    } catch {
      detail.value = null
      loadError.value = error instanceof Error ? error.message : '详情加载失败'
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchDetail()
  if (route.query.tab === 'replay') {
    await nextTick()
    replayRef.value?.play()
  }
})
</script>

<template>
  <ContentDetailWrap v-loading="loading" title="">
    <template #header>
      <div class="detail-header">
        <BaseButton @click="go(-1)">返回</BaseButton>
        <BaseButton v-if="showManualConfirm" type="primary" @click="openManualConfirm">
          人工核查
        </BaseButton>
      </div>
    </template>

    <template v-if="viewDetail">
      <el-row :gutter="16" class="detail-info">
        <el-col :span="24">
          <div class="detail-info__desc-title">基本信息</div>
          <ElDescriptions :column="3" border size="small">
            <ElDescriptionsItem label="目标ID">{{ viewDetail.targetId }}</ElDescriptionsItem>
            <ElDescriptionsItem label="目标型号">{{ viewDetail.targetModel }}</ElDescriptionsItem>
            <ElDescriptionsItem label="识别码">{{ viewDetail.uavSn }}</ElDescriptionsItem>

            <ElDescriptionsItem label="发现时间">{{ viewDetail.discoveredAt }}</ElDescriptionsItem>
            <ElDescriptionsItem label="处置时间">
              {{ viewDetail.handledAt === '--' ? '--' : viewDetail.handledAt }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="威胁等级">
              <ElTag :type="threatTagType(viewDetail.threatLevel)" effect="dark" round>
                {{ threatLevelDisplay(viewDetail.threatLevel) }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="验证方式">
              {{ verificationMethodOf(viewDetail.manualConfirmStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="名单类型">
              <ElTag :type="listTypeTagType(viewDetail.listType)" size="small" effect="light">
                {{ viewDetail.listType }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="目标类型">
              <ElTag
                :type="historyTargetTypeTagType(viewDetail.historyTargetType)"
                size="small"
                effect="light"
              >
                {{ viewDetail.historyTargetType }}
              </ElTag>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="飞手位置">
              <template v-if="viewDetail.pilotLocation === '未定位'">未定位</template>
              <template v-else>
                {{ viewDetail.pilotLocation }}
                <span v-if="viewDetail.pilotConfidence !== '--'" class="detail-info__confidence">
                  置信度：{{ viewDetail.pilotConfidence }}
                </span>
              </template>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="频率信息">{{ viewDetail.frequencyInfo }}</ElDescriptionsItem>
            <ElDescriptionsItem :label="targetAirframeLabel">{{ viewDetail.targetType }}</ElDescriptionsItem>
            <ElDescriptionsItem label="探测设备">{{
              viewDetail.detectionDevice
            }}</ElDescriptionsItem>

            <ElDescriptionsItem label="反制设备" :span="3">
              {{ viewDetail.countermeasureDevice }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="处置状态" :span="3">
              {{ statusLabel(viewDetail.handlingStatus) }}
            </ElDescriptionsItem>

            <ElDescriptionsItem v-if="viewDetail.remark" label="备注" :span="3">
              {{ viewDetail.remark }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </el-col>
      </el-row>

      <div v-if="viewDetail.disposalTimeline?.length" class="detail-split-layout">
        <section class="detail-split-layout__timeline detail-timeline-section">
          <div class="detail-timeline-section__title">设备处置时间链</div>
          <p class="detail-timeline-section__hint">
            展示小型低空飞行物从发现、识别、评估、处置到复盘归档的全过程记录。
          </p>
          <DisposalTimelinePanel :nodes="viewDetail.disposalTimeline" />
        </section>
        <section class="detail-split-layout__eo detail-eo-section">
          <div class="detail-eo-section__title">无人机光电</div>
          <LadVideoMonitor
            :linked="eoConnected"
            :channel-label="eoChannelLabel"
            :location-label="eoLocationLabel"
            camera-label="光电跟踪 / 录像回放"
            :record-start="viewDetail.discoveredAt"
            :record-end="viewDetail.endedAt"
            :screenshot-name-prefix="`光电截图_${viewDetail.targetId}`"
          />
        </section>
      </div>

      <div class="detail-map-section">
        <div class="detail-map-section__title">地图轨迹</div>
        <TrajectoryReplay ref="replayRef" :detail="viewDetail" />
      </div>

      <section class="detail-source-section">
        <div class="detail-source-section__header">
          <div class="detail-source-section__title">航机列表</div>
          <BaseButton type="primary" size="small" @click="exportTrajectoryList">导出</BaseButton>
        </div>
        <div class="detail-source-section__table-wrap">
          <table class="detail-source-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>目标ID</th>
                <th>时间</th>
                <th>高度</th>
                <th>经度</th>
                <th>纬度</th>
                <th>距离</th>
                <th>速度</th>
                <th>方位角</th>
                <th>俯仰角</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedTrajectoryListRows" :key="row.seq">
                <td>{{ row.seq }}</td>
                <td>{{ row.targetId }}</td>
                <td>{{ row.time }}</td>
                <td>{{ row.altitude }}m</td>
                <td>{{ row.longitude }}</td>
                <td>{{ row.latitude }}</td>
                <td>{{ row.distance }}m</td>
                <td>{{ row.speed }}m/s</td>
                <td>{{ row.azimuth }}°</td>
                <td>{{ row.pitch }}°</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ElPagination
          v-if="showTrajectoryPagination"
          v-model:current-page="trajectoryPageIndex"
          v-model:page-size="trajectoryPageSize"
          class="detail-source-section__pagination"
          :page-sizes="TRAJECTORY_PAGE_SIZES"
          :total="trajectoryListRows.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </section>
    </template>

    <ElAlert v-else-if="loadError" :title="loadError" type="warning" :closable="false" show-icon />
    <div v-else class="detail-empty">暂无飞行记录详情</div>

    <ManualConfirmDialog
      v-model="confirmVisible"
      :row="detail ?? undefined"
      @success="onConfirmSuccess"
    />
  </ContentDetailWrap>
</template>

<style scoped lang="less">
.detail-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.detail-info {
  margin-bottom: 20px;

  &__desc-title {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__confidence {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-color-primary);
  }
}

.detail-split-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  width: 100%;
  margin-bottom: 20px;

  &__timeline,
  &__eo {
    min-width: 0;
    width: 100%;
  }

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
  }
}

.detail-eo-section {
  &__title {
    margin-bottom: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.detail-timeline-section {
  height: 100%;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  &__title {
    margin-bottom: 6px;
    font-size: 15px;
    font-weight: 600;
  }

  &__hint {
    margin: 0 0 12px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

.detail-map-section {
  margin-bottom: 20px;

  &__title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
  }
}

.detail-source-section {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__table-wrap {
    overflow-x: auto;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

.detail-source-table {
  width: 100%;
  min-width: 1080px;
  font-size: 13px;
  border-spacing: 0;
  border-collapse: collapse;

  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border: 1px solid var(--el-border-color-lighter);
  }

  th {
    font-weight: 600;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
  }

  td {
    color: var(--el-text-color-primary);
    background: var(--el-bg-color);
  }
}

.detail-empty {
  padding: 24px;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
</style>
