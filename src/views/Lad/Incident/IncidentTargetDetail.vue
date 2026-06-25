<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElAlert, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { getHistoryEventDetailApi } from '@/api/lad/incident'
import type {
  DisposalTimelineNode,
  HistoryEventDetail,
  HandlingStatus,
  ThreatLevel
} from '@/api/lad/incident/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import DisposalTimelinePanel from './components/DisposalTimelinePanel.vue'
import TrajectoryReplay from './components/TrajectoryReplay.vue'

defineOptions({
  name: 'LadIncidentTargetDetail'
})

const route = useRoute()
const { go } = useRouter()

const loading = ref(true)
const detail = ref<HistoryEventDetail | null>(null)
const loadError = ref('')
const replayRef = ref<InstanceType<typeof TrajectoryReplay> | null>(null)

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
    summary: normalizeText(node.summary),
    detail: normalizeText(node.detail),
    tags: node.tags?.map((tag) => normalizeText(tag))
  }))

const viewDetail = computed<HistoryEventDetail | null>(() => {
  if (!detail.value) return null

  return {
    ...detail.value,
    targetId: normalizeText(detail.value.targetId),
    targetModel: normalizeText(detail.value.targetModel),
    uavSn: normalizeText(detail.value.uavSn),
    zoneName: normalizeText(detail.value.zoneName),
    frequencyInfo: normalizeText(detail.value.frequencyInfo),
    targetType: normalizeText(detail.value.targetType),
    detectionDevice: normalizeText(detail.value.detectionDevice),
    countermeasureDevice: normalizeText(detail.value.countermeasureDevice),
    handlingResult: normalizeText(detail.value.handlingResult),
    disposalDetail: normalizeText(detail.value.disposalDetail),
    manualConfirmStatus: normalizeText(detail.value.manualConfirmStatus).replace(
      /^人工-/,
      '人工核查-'
    ),
    remark: normalizeText(detail.value.remark),
    disposalTimeline: normalizedTimeline(detail.value.disposalTimeline)
  }
})

const threatTagType = (level: ThreatLevel) => {
  const map: Record<ThreatLevel, 'danger' | 'warning' | 'success' | 'info'> = {
    高: 'danger',
    中: 'warning',
    低: 'success',
    未知: 'info'
  }
  return map[level]
}

const statusLabel = (status: HandlingStatus) => {
  if (status === '待处置') return '未处置'
  return status
}

const lastAltitude = computed(() => {
  const points = viewDetail.value?.trajectory
  if (!points?.length) return '--'
  return `${points[points.length - 1].altitude}m`
})

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
      </div>
    </template>

    <template v-if="viewDetail">
      <el-row :gutter="16" class="detail-info">
        <el-col :xs="24" :md="7" :lg="6">
          <div class="detail-info__image">
            <span class="detail-info__image-label">无人机光电图像</span>
            <span class="detail-info__image-hint">暂无图像，接入光电后展示</span>
          </div>
        </el-col>
        <el-col :xs="24" :md="17" :lg="18">
          <div class="detail-info__desc-title">基本信息</div>
          <ElDescriptions :column="3" border size="small">
            <ElDescriptionsItem label="目标ID">{{ viewDetail.targetId }}</ElDescriptionsItem>
            <ElDescriptionsItem label="品牌型号">{{ viewDetail.targetModel }}</ElDescriptionsItem>
            <ElDescriptionsItem label="识别码">{{ viewDetail.uavSn }}</ElDescriptionsItem>

            <ElDescriptionsItem label="发现时间">{{ viewDetail.discoveredAt }}</ElDescriptionsItem>
            <ElDescriptionsItem label="处置时间">
              {{ viewDetail.handledAt === '--' ? '--' : viewDetail.handledAt }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前状态">
              {{ statusLabel(viewDetail.handlingStatus) }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="威胁等级">
              <ElTag :type="threatTagType(viewDetail.threatLevel)" effect="dark" round>
                {{ viewDetail.threatLevel }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="威胁识别">
              {{ viewDetail.manualConfirmStatus }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="最新高度">
              {{ lastAltitude }}
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
            <ElDescriptionsItem label="区域">{{ viewDetail.zoneName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="持续时长">{{ viewDetail.duration }}</ElDescriptionsItem>

            <ElDescriptionsItem label="频率信息">{{ viewDetail.frequencyInfo }}</ElDescriptionsItem>
            <ElDescriptionsItem label="目标类型">{{ viewDetail.targetType }}</ElDescriptionsItem>
            <ElDescriptionsItem label="处置结果">{{
              viewDetail.handlingResult
            }}</ElDescriptionsItem>

            <ElDescriptionsItem label="探测设备">{{
              viewDetail.detectionDevice
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="反制设备">
              {{ viewDetail.countermeasureDevice }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="处置详情">{{
              viewDetail.disposalDetail
            }}</ElDescriptionsItem>

            <ElDescriptionsItem v-if="viewDetail.relatedEventCount > 1" label="关联事件">
              同目标共 {{ viewDetail.relatedEventCount }} 条飞行记录
            </ElDescriptionsItem>
            <ElDescriptionsItem
              v-if="viewDetail.remark"
              label="备注"
              :span="viewDetail.relatedEventCount > 1 ? 2 : 3"
            >
              {{ viewDetail.remark }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </el-col>
      </el-row>

      <section v-if="viewDetail.disposalTimeline?.length" class="detail-timeline-section">
        <div class="detail-timeline-section__title">设备处置时间链</div>
        <p class="detail-timeline-section__hint">
          {{
            viewDetail.handlingStatus === '待处置'
              ? '当前处于威胁评估阶段，后续节点将在实际发生后展示。'
              : viewDetail.handlingStatus === '处置中'
                ? '当前处置指令正在执行，结果节点将在设备回传后展示。'
                : '从设备发现、威胁识别、评估、人工核查、处置执行到结果归档的全过程记录。'
          }}
        </p>
        <DisposalTimelinePanel :nodes="viewDetail.disposalTimeline" />
      </section>

      <div class="detail-map-section">
        <div class="detail-map-section__title">地图轨迹</div>
        <TrajectoryReplay ref="replayRef" :detail="viewDetail" />
      </div>
    </template>

    <ElAlert v-else-if="loadError" :title="loadError" type="warning" :closable="false" show-icon />
    <div v-else class="detail-empty">暂无飞行记录详情</div>
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

  &__image {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 16px;
    text-align: center;
    background: var(--el-fill-color-light);
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
  }

  &__image-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__image-hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__confidence {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-color-primary);
  }
}

.detail-timeline-section {
  margin-bottom: 20px;
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

.detail-empty {
  padding: 24px;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
</style>
