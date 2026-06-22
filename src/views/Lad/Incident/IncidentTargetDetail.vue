<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElAlert,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElMessageBox,
  ElTag
} from 'element-plus'
import { deleteHistoryEventApi, getHistoryEventDetailApi } from '@/api/lad/incident'
import type { HistoryEventDetail, HandlingStatus, ThreatLevel } from '@/api/lad/incident/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import DisposalTimelinePanel from './components/DisposalTimelinePanel.vue'
import TrajectoryReplay from './components/TrajectoryReplay.vue'

defineOptions({
  name: 'LadIncidentTargetDetail'
})

const route = useRoute()
const { push, go } = useRouter()

const loading = ref(true)
const detail = ref<HistoryEventDetail | null>(null)
const loadError = ref('')
const replayRef = ref<InstanceType<typeof TrajectoryReplay> | null>(null)

const eventId = computed(() => route.params.id as string)

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
  const points = detail.value?.trajectory
  if (!points?.length) return '--'
  return `${points[points.length - 1].altitude}m`
})

const fetchDetail = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getHistoryEventDetailApi(eventId.value)
    detail.value = res.data
  } catch (error) {
    detail.value = null
    loadError.value = error instanceof Error ? error.message : '详情加载失败'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  push('/lad/incident/history')
}

const onDownload = () => {
  ElMessage.info('轨迹与事件数据打包下载（预览占位）')
}

const exportTrajectory = (format: 'word' | 'excel') => {
  const label = format === 'word' ? 'Word' : 'Excel'
  ElMessage.success(`已导出轨迹合并报告（${label}，演示）`)
}

const onReplay = () => {
  replayRef.value?.play()
}

const onDelete = async () => {
  await ElMessageBox.confirm('删除后不可恢复，是否继续？', '删除事件', { type: 'warning' })
  await deleteHistoryEventApi([eventId.value])
  ElMessage.success('已删除')
  goBack()
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
        <div v-if="detail" class="detail-header__actions">
          <BaseButton type="primary" @click="onDownload">下载数据</BaseButton>
          <BaseButton @click="exportTrajectory('excel')">导出 Excel</BaseButton>
          <BaseButton @click="exportTrajectory('word')">导出 Word</BaseButton>
          <BaseButton type="primary" @click="onReplay">回放</BaseButton>
          <BaseButton type="warning" @click="onDelete">删除</BaseButton>
        </div>
      </div>
    </template>

    <template v-if="detail">
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
            <ElDescriptionsItem label="目标ID">{{ detail.targetId }}</ElDescriptionsItem>
            <ElDescriptionsItem label="品牌型号">{{ detail.targetModel }}</ElDescriptionsItem>
            <ElDescriptionsItem label="SN 码">{{ detail.uavSn }}</ElDescriptionsItem>

            <ElDescriptionsItem label="发现时间">{{ detail.discoveredAt }}</ElDescriptionsItem>
            <ElDescriptionsItem label="处置时间">
              {{ detail.handledAt === '--' ? '--' : detail.handledAt }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前状态">
              {{ statusLabel(detail.handlingStatus) }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="威胁等级">
              <ElTag :type="threatTagType(detail.threatLevel)" effect="dark" round>
                {{ detail.threatLevel }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="人工确认">
              {{ detail.manualConfirmStatus }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="最新高度">
              {{ lastAltitude }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="飞手位置">
              <template v-if="detail.pilotLocation === '未定位'">未定位</template>
              <template v-else>
                {{ detail.pilotLocation }}
                <span v-if="detail.pilotConfidence !== '--'" class="detail-info__confidence">
                  置信度：{{ detail.pilotConfidence }}
                </span>
              </template>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="区域">{{ detail.zoneName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="持续时长">{{ detail.duration }}</ElDescriptionsItem>

            <ElDescriptionsItem label="频率信息">{{ detail.frequencyInfo }}</ElDescriptionsItem>
            <ElDescriptionsItem label="目标类型">{{ detail.targetType }}</ElDescriptionsItem>
            <ElDescriptionsItem label="处置结果">{{ detail.handlingResult }}</ElDescriptionsItem>

            <ElDescriptionsItem label="探测设备">{{ detail.detectionDevice }}</ElDescriptionsItem>
            <ElDescriptionsItem label="反制设备">{{
              detail.countermeasureDevice
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="处置详情">{{ detail.disposalDetail }}</ElDescriptionsItem>

            <ElDescriptionsItem v-if="detail.relatedEventCount > 1" label="关联事件">
              同目标共 {{ detail.relatedEventCount }} 条飞行记录
            </ElDescriptionsItem>
            <ElDescriptionsItem
              v-if="detail.remark"
              label="备注"
              :span="detail.relatedEventCount > 1 ? 2 : 3"
            >
              {{ detail.remark }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </el-col>
      </el-row>

      <section v-if="detail.disposalTimeline?.length" class="detail-timeline-section">
        <div class="detail-timeline-section__title">设备处置时间链</div>
        <p class="detail-timeline-section__hint">
          {{
            detail.handlingStatus === '待处置'
              ? '当前处于威胁评估阶段，后续节点将在实际发生后展示。'
              : detail.handlingStatus === '处置中'
                ? '当前处置指令正在执行，结果节点将在设备回传后展示。'
                : '从设备发现、威胁识别、评估、人工确认、处置执行到结果归档的全过程记录。'
          }}
        </p>
        <DisposalTimelinePanel :nodes="detail.disposalTimeline" />
      </section>

      <ElAlert
        v-if="detail.trajectoryMergeNote || detail.relatedEventCount > 1"
        type="info"
        :closable="false"
        show-icon
        class="detail-merge-alert"
        :title="detail.trajectoryMergeNote || '已按同架次合并多源探测轨迹（演示）'"
      />

      <div class="detail-map-section">
        <div class="detail-map-section__title">地图轨迹</div>
        <TrajectoryReplay ref="replayRef" :detail="detail" />
      </div>
    </template>

    <ElAlert v-else-if="loadError" :title="loadError" type="warning" :closable="false" show-icon />
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

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
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

.detail-merge-alert {
  margin-bottom: 12px;
}

.detail-map-section {
  &__title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
  }
}
</style>
