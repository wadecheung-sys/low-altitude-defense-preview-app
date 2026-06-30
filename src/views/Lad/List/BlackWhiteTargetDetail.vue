<script setup lang="tsx">
import {
  deleteBlackWhiteApi,
  getBlackWhiteDetailApi,
  updateBlackWhiteListTypeApi
} from '@/api/lad/list'
import type { BlackWhiteTargetDetail, ListType } from '@/api/lad/list/types'
import { formatValidUntilDisplay } from '@/api/lad/list/validUntilUtils'
import { historyTargetTypeTagType, displayBlackWhiteTargetKind } from '@/api/lad/list/listTargetKind'
import { deleteHistoryEventApi, getHistoryEventListApi } from '@/api/lad/incident'
import type { HandlingStatus, HistoryEventItem, ThreatLevel } from '@/api/lad/incident/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import { ContentWrap } from '@/components/ContentWrap'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  ElAlert,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTag
} from 'element-plus'
import { computed, reactive, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { targetAirframeLabel } from '../shared/ladOptionConstants'

defineOptions({
  name: 'LadBlackWhiteTargetDetail'
})

const route = useRoute()
const { push } = useRouter()

const loading = ref(true)
const detail = ref<BlackWhiteTargetDetail | null>(null)
const loadError = ref('')

const recordId = computed(() => route.params.id as string)

const eventFilters = reactive({
  discoveredAtRange: [] as string[],
  zoneName: '',
  dataSource: ''
})

const zoneOptions = [
  { label: '全部区域', value: '' },
  { label: '核心保护区-A区', value: '核心保护区-A区' },
  { label: '缓冲区-B区', value: '缓冲区-B区' },
  { label: '管制空域-C区', value: '管制空域-C区' },
  { label: '公共区域', value: '公共区域' }
]

const dataSourceOptions = [
  { label: '全部数据来源', value: '' },
  { label: '雷达+无线电融合', value: '雷达+无线电融合' },
  { label: '雷达单源', value: '雷达单源' },
  { label: '无线电侦测', value: '无线电侦测' },
  { label: '光电跟踪', value: '光电跟踪' },
  { label: '多源融合节点', value: '多源融合节点' }
]

const threatTagType = (level: ThreatLevel) => {
  const map: Record<ThreatLevel, 'danger' | 'warning' | 'success' | 'info'> = {
    高危: 'danger',
    中危: 'warning',
    低危: 'success',
    无危: 'info'
  }
  return map[level] ?? 'info'
}

const listTypeTag = (type: ListType) => {
  const map: Record<ListType, 'danger' | 'success' | 'info'> = {
    黑名单: 'danger',
    白名单: 'success',
    未知: 'info'
  }
  return map[type]
}

const statusLabel = (status: HandlingStatus) => {
  if (status === '待处置') return '未处置'
  return status
}

/** 待处置时尚无处置记录，说明为「未处置」或留空 */
function disposalDetailText(row: BlackWhiteTargetDetail): string {
  if (row.handlingStatus === '待处置') {
    return row.disposalDetail?.trim() || '未处置'
  }
  return row.disposalDetail?.trim() || '—'
}

const fetchDetail = async () => {
  if (!recordId.value) {
    detail.value = null
    loadError.value = '缺少目标标识，无法加载详情'
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const res = await getBlackWhiteDetailApi(recordId.value)
    detail.value = res.data
  } catch (error) {
    detail.value = null
    loadError.value = error instanceof Error ? error.message : '详情加载失败，请返回列表重试'
  } finally {
    loading.value = false
  }
}

const eventQueryParams = computed(() => {
  const d = detail.value
  if (!d) return {}
  const range = eventFilters.discoveredAtRange
  return {
    targetId: d.targetId,
    uavSn: d.sn !== '未解析' ? d.sn : undefined,
    discoveredAtStart: range?.[0],
    discoveredAtEnd: range?.[1],
    zoneName: eventFilters.zoneName || undefined,
    dataSource: eventFilters.dataSource || undefined
  }
})

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    if (!detail.value) {
      return { list: [], total: 0 }
    }
    const { currentPage, pageSize } = tableState
    const res = await getHistoryEventListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...eventQueryParams.value
    })
    return {
      list: res.data.list,
      total: res.data.total
    }
  },
  immediate: false
})

const { getList, refresh } = tableMethods
const { loading: tableLoading, dataList, total, currentPage, pageSize } = tableState

const applyEventFilters = () => {
  currentPage.value = 1
  getList()
}

const resetEventFilters = () => {
  eventFilters.discoveredAtRange = []
  eventFilters.zoneName = ''
  eventFilters.dataSource = ''
  applyEventFilters()
}

watch(
  () => detail.value?.targetId,
  (id) => {
    if (id) {
      currentPage.value = 1
      getList()
    }
  }
)

const goBackList = () => {
  push('/lad/list/black-white')
}

const onSetListType = async (listType: ListType) => {
  if (!detail.value) return
  if (detail.value.historyTargetType === '黑飞无人机') {
    ElMessage.warning('黑飞无人机名单类型固定为「未知」')
    return
  }
  if (detail.value.listType === listType) {
    ElMessage.info(`当前已是${listType}`)
    return
  }
  await ElMessageBox.confirm(`确认将该目标设为「${listType}」？`, '名单调整', { type: 'warning' })
  const res = await updateBlackWhiteListTypeApi({ id: detail.value.id, listType })
  detail.value = res.data
  ElMessage.success(`已加入${listType}`)
}

const onDeleteTarget = async () => {
  if (!detail.value) return
  await ElMessageBox.confirm('删除主数据后不可恢复，是否继续？', '删除目标', { type: 'warning' })
  await deleteBlackWhiteApi([detail.value.id])
  ElMessage.success('已删除')
  goBackList()
}

const onReplay = (row: HistoryEventItem) => {
  push({
    path: `/lad/list/incident/target/${row.id}`,
    query: { tab: 'replay' }
  })
}

const onDeleteEvent = async (row: HistoryEventItem) => {
  await ElMessageBox.confirm('删除该条历史事件后不可恢复，是否继续？', '删除事件', {
    type: 'warning'
  })
  await deleteHistoryEventApi([row.id])
  ElMessage.success('已删除')
  await fetchDetail()
  refresh()
}

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'index',
    label: '序号',
    type: 'index',
    width: 64
  },
  {
    field: 'discoveredAt',
    label: '发现时间',
    minWidth: 168,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'endedAt',
    label: '最后更新时间',
    minWidth: 168,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'duration',
    label: '持续时长',
    minWidth: 96
  },
  {
    field: 'zoneName',
    label: '所在区域',
    minWidth: 140,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'targetLocation',
    label: '目标位置',
    minWidth: 150,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'pilotLocation',
    label: '飞手位置',
    minWidth: 150,
    table: {
      showOverflowTooltip: true,
      slots: {
        default: (data: { row: HistoryEventItem }) =>
          data.row.pilotLocation === '未定位' ? (
            <span class="text-[var(--el-text-color-secondary)]">未定位</span>
          ) : (
            data.row.pilotLocation
          )
      }
    }
  },
  {
    field: 'handlingStatus',
    label: '处置状态',
    minWidth: 96,
    table: {
      slots: {
        default: (data: { row: HistoryEventItem }) => statusLabel(data.row.handlingStatus)
      }
    }
  },
  {
    field: 'dataSource',
    label: '数据来源',
    minWidth: 140,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'action',
    label: '操作',
    width: '200px',
    fixed: 'right',
    table: {
      slots: {
        default: (data: { row: HistoryEventItem }) => (
          <>
            <BaseButton type="primary" onClick={() => onReplay(data.row)}>
              回放
            </BaseButton>
            <BaseButton type="danger" onClick={() => onDeleteEvent(data.row)}>
              删除
            </BaseButton>
          </>
        )
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)

watch(
  recordId,
  () => {
    fetchDetail()
  },
  { immediate: true }
)
</script>

<template>
  <ContentDetailWrap v-loading="loading" title="">
    <template #header>
      <BaseButton @click="goBackList">返回列表</BaseButton>
    </template>

    <template v-if="detail">
      <ContentWrap class="target-detail-profile">
        <el-row :gutter="16">
          <el-col :xs="24" :md="7" :lg="6">
            <div class="target-detail-profile__image">
              <span class="target-detail-profile__image-label">无人机光电图像</span>
              <span class="target-detail-profile__image-hint">暂无图像，接入光电后展示</span>
            </div>
          </el-col>
          <el-col :xs="24" :md="17" :lg="18">
            <div class="target-detail-profile__head">
              <span class="target-detail-profile__title">目标档案</span>
              <ElTag :type="listTypeTag(detail.listType)" size="small" effect="light">
                {{ detail.listType }}
              </ElTag>
            </div>
            <p class="target-detail-profile__hint"> 设备标识与名单建档信息，不随单次飞行变化。 </p>
            <ElDescriptions
              :column="2"
              border
              size="small"
              label-width="128px"
              class="target-detail-descriptions"
            >
              <ElDescriptionsItem label="目标 ID">{{ detail.targetId }}</ElDescriptionsItem>
              <ElDescriptionsItem label="目标类型">
                <ElTag
                  :type="historyTargetTypeTagType(displayBlackWhiteTargetKind(detail))"
                  size="small"
                  effect="light"
                >
                  {{ displayBlackWhiteTargetKind(detail) }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="品牌型号">{{ detail.model }}</ElDescriptionsItem>
              <ElDescriptionsItem label="识别码">
                <span
                  v-if="detail.sn === '未解析'"
                  class="text-[var(--el-text-color-secondary)]"
                >
                  未解析
                </span>
                <span v-else>{{ detail.sn }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem :label="targetAirframeLabel">{{
                detail.targetType
              }}</ElDescriptionsItem>

              <ElDescriptionsItem label="频段信息">{{ detail.frequency }}</ElDescriptionsItem>
              <ElDescriptionsItem label="录入方式">{{ detail.entryMethod }}</ElDescriptionsItem>

              <ElDescriptionsItem label="有效期至">
                <ElTag
                  v-if="formatValidUntilDisplay(detail.validUntil) === '永久'"
                  type="success"
                  size="small"
                  effect="light"
                >
                  永久
                </ElTag>
                <span v-else>{{ formatValidUntilDisplay(detail.validUntil) }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="首次发现时间">
                {{ detail.discoveredAt }}
              </ElDescriptionsItem>

              <ElDescriptionsItem label="关联事件" :span="2">
                共 {{ detail.eventCount }} 条
              </ElDescriptionsItem>

              <ElDescriptionsItem v-if="detail.remark" label="备注" :span="2">
                {{ detail.remark }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </el-col>
        </el-row>
      </ContentWrap>

      <ContentWrap
        class="target-detail-events"
        title="历史事件信息"
        message="上方为最近一次探测摘要，下方表格为全部飞行记录明细。"
      >
        <section class="target-detail-events__snapshot">
          <div class="target-detail-events__snapshot-title">最近一次探测</div>
          <ElDescriptions
            :column="2"
            border
            size="small"
            label-width="128px"
            class="target-detail-descriptions target-detail-events__snapshot-table"
          >
            <ElDescriptionsItem label="探测时间">
              {{ detail.lastObservedAt || detail.updatedAt }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="威胁等级">
              <ElTag :type="threatTagType(detail.threatLevel)" size="small" effect="light">
                {{ detail.threatLevel }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="处置状态">
              {{ statusLabel(detail.handlingStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="所在区域">{{ detail.zoneName }}</ElDescriptionsItem>

            <ElDescriptionsItem label="无人机最后位置" :span="2">
              {{ detail.lastPosition }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="飞手最后已知位置" :span="2">
              <template v-if="detail.pilotLocation === '未定位'">
                <span class="text-[var(--el-text-color-secondary)]">未定位</span>
              </template>
              <template v-else>
                {{ detail.pilotLocation }}
                <span v-if="detail.pilotConfidence !== '—'" class="target-detail-events__cell-sub">
                  置信度 {{ detail.pilotConfidence }}
                </span>
                <span
                  v-if="detail.pilotLocatedAt && detail.pilotLocatedAt !== '—'"
                  class="target-detail-events__cell-sub"
                >
                  推算 {{ detail.pilotLocatedAt }}
                </span>
              </template>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="处置说明" :span="2">
              <span
                :class="
                  detail.handlingStatus === '待处置' ? 'text-[var(--el-text-color-secondary)]' : ''
                "
              >
                {{ disposalDetailText(detail) }}
              </span>
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <div class="target-detail-events__list-head">全部历史记录</div>
        <div class="target-detail-events__toolbar mb-10px">
          <ElForm inline class="target-detail-events__filters">
            <ElFormItem label="时间范围">
              <ElDatePicker
                v-model="eventFilters.discoveredAtRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                clearable
                style="width: 260px"
                @change="applyEventFilters"
              />
            </ElFormItem>
            <ElFormItem label="区域">
              <ElSelect
                v-model="eventFilters.zoneName"
                placeholder="全部区域"
                clearable
                style="width: 160px"
                @change="applyEventFilters"
              >
                <ElOption
                  v-for="opt in zoneOptions"
                  :key="opt.value || 'all'"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="数据来源">
              <ElSelect
                v-model="eventFilters.dataSource"
                placeholder="全部数据来源"
                clearable
                style="width: 160px"
                @change="applyEventFilters"
              >
                <ElOption
                  v-for="opt in dataSourceOptions"
                  :key="opt.value || 'all-src'"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem>
              <BaseButton @click="resetEventFilters">重置</BaseButton>
            </ElFormItem>
          </ElForm>
          <div class="target-detail-events__actions">
            <BaseButton
              type="primary"
              :disabled="detail.historyTargetType === '黑飞无人机' || detail.listType === '黑名单'"
              @click="onSetListType('黑名单')"
            >
              + 加入黑名单
            </BaseButton>
            <BaseButton
              type="primary"
              :disabled="detail.historyTargetType === '黑飞无人机' || detail.listType === '白名单'"
              @click="onSetListType('白名单')"
            >
              + 加入白名单
            </BaseButton>
            <BaseButton type="warning" @click="onDeleteTarget">删除</BaseButton>
          </div>
        </div>

        <Table
          v-model:pageSize="pageSize"
          v-model:currentPage="currentPage"
          :columns="allSchemas.tableColumns"
          :data="dataList"
          :loading="tableLoading"
          :pagination="{ total }"
          @register="tableRegister"
        />
      </ContentWrap>
    </template>

    <ElAlert v-else-if="loadError" :title="loadError" type="warning" :closable="false" show-icon />
  </ContentDetailWrap>
</template>

<style scoped lang="less">
.target-detail-descriptions {
  width: 100%;

  :deep(.el-descriptions__body) {
    width: 100%;
  }

  :deep(.el-descriptions__table) {
    width: 100%;
    table-layout: fixed;
  }

  :deep(.el-descriptions__label) {
    width: 128px;
  }

  :deep(.el-descriptions__content) {
    word-break: break-word;
  }
}

.target-detail-profile {
  margin-bottom: 16px;

  &__head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__hint {
    margin: 0 0 10px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
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
}

.target-detail-events {
  &__snapshot {
    margin-bottom: 12px;
  }

  &__snapshot-title {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__snapshot-table {
    width: 100%;
    margin-bottom: 0;
  }

  &__cell-sub {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__list-head {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__filters {
    flex: 1;
    min-width: 280px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
