<script setup lang="tsx">
import { deleteBlackWhiteApi, getBlackWhiteDetailApi } from '@/api/lad/list'
import type { BlackWhiteTargetDetail } from '@/api/lad/list/types'
import type { ManagedListType } from '@/api/lad/list/listTargetKind'
import { formatValidUntilDisplay } from '@/api/lad/list/validUntilUtils'
import { displayManagedListType } from '@/api/lad/list/listTargetKind'
import { getHistoryEventListApi } from '@/api/lad/incident'
import type { HistoryEventItem, ThreatLevel } from '@/api/lad/incident/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import { Table } from '@/components/Table'
import { LAD_HOME_PATH } from '@/constants/lad'
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
  ElTag,
  ElTooltip
} from 'element-plus'
import { computed, onUnmounted, reactive, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { handlingStatusDisplay, isHandlingInProgress } from '../shared/ladDictHelpers'

defineOptions({
  name: 'LadBlackWhiteTargetDetail'
})

const route = useRoute()
const { push } = useRouter()

const loading = ref(true)
const detail = ref<BlackWhiteTargetDetail | null>(null)
const loadError = ref('')

const recordId = computed(() => route.params.id as string)

/** 名单前列表示例：模拟正在发生的飞行探测 */
const LIVE_FLIGHT_RECORD_IDS = ['bw-10001', 'bw-10002', 'bw-10003']

const LIVE_FLIGHT_TOOLTIP =
  '最近探测包含正在发生的飞行行为记录，探测时间、无人机位置等信息会随设备飞行持续更新。'

const enableLiveFlight = computed(() => LIVE_FLIGHT_RECORD_IDS.includes(recordId.value))

type PositionParts = { lng: number; lat: number; alt: number }

function parsePosition(pos: string): PositionParts | null {
  const match = pos.match(/E:([\d.]+).*N:([\d.]+).*?(\d+)m/)
  if (!match) return null
  return {
    lng: Number(match[1]),
    lat: Number(match[2]),
    alt: Number(match[3])
  }
}

function formatPosition({ lng, lat, alt }: PositionParts) {
  return `E:${lng.toFixed(4)}，N:${lat.toFixed(4)}（海拔${Math.round(alt)}m）`
}

function formatNow() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const liveSnapshot = reactive({
  observedAt: '',
  lastPosition: '',
  active: false
})

let flightTimer: ReturnType<typeof setInterval> | undefined

function stopLiveFlight() {
  if (flightTimer) {
    clearInterval(flightTimer)
    flightTimer = undefined
  }
  liveSnapshot.active = false
}

function hashSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function startLiveFlight(base: BlackWhiteTargetDetail) {
  stopLiveFlight()
  const seed = hashSeed(base.id)
  const parts = parsePosition(base.lastPosition) ?? { lng: 113.39, lat: 23.08, alt: 88 }
  liveSnapshot.observedAt = formatNow()
  liveSnapshot.lastPosition = formatPosition(parts)
  liveSnapshot.active = true

  let tick = 0
  flightTimer = setInterval(() => {
    tick += 1
    const angle = (seed % 360) * 0.01 + tick * 0.31
    parts.lng += Math.sin(angle) * 0.0008 + Math.cos(angle * 1.7) * 0.0003
    parts.lat += Math.cos(angle) * 0.0006 + Math.sin(angle * 1.3) * 0.0002
    parts.alt += Math.sin(angle * 2) * 0.8
    parts.alt = Math.max(30, Math.min(320, parts.alt))
    liveSnapshot.observedAt = formatNow()
    liveSnapshot.lastPosition = formatPosition(parts)
  }, 2500)
}

const snapshotObservedAt = computed(() => {
  if (enableLiveFlight.value && liveSnapshot.active) return liveSnapshot.observedAt
  return detail.value?.lastObservedAt || detail.value?.updatedAt || '—'
})

const snapshotLastPosition = computed(() => {
  if (enableLiveFlight.value && liveSnapshot.active) return liveSnapshot.lastPosition
  return detail.value?.lastPosition ?? '—'
})

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

const listTypeTag = (type: ManagedListType) => {
  const map: Record<ManagedListType, 'danger' | 'success'> = {
    黑名单: 'danger',
    白名单: 'success'
  }
  return map[type]
}

/** 进行中且尚无处置记录时，说明为「未处置」或留空 */
function disposalDetailText(row: BlackWhiteTargetDetail): string {
  if (isHandlingInProgress(row.handlingStatus) && !row.disposalDetail?.trim()) {
    return '未处置'
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
    uavSn: d.sn,
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

const { getList } = tableMethods
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

const removeListLabel = computed(() =>
  detail.value?.listType === '白名单' ? '移出白名单' : '移出黑名单'
)

const removeButtonType = computed(() =>
  detail.value?.listType === '白名单' ? 'warning' : 'danger'
)

const onRemoveFromList = async () => {
  if (!detail.value) return
  const listType = detail.value.listType === '白名单' ? '白名单' : '黑名单'
  await ElMessageBox.confirm(
    `确定将识别码「${detail.value.sn}」${removeListLabel.value}吗？移出后该设备将不再按${listType}规则处置。`,
    removeListLabel.value,
    { type: 'warning' }
  )
  await deleteBlackWhiteApi([detail.value.id])
  ElMessage.success(`${removeListLabel.value}成功`)
  goBackList()
}

const goCommandScreen = () => {
  if (!detail.value) return
  push({
    path: LAD_HOME_PATH,
    query: {
      locate: '1',
      targetId: detail.value.targetId,
      sn: detail.value.sn
    }
  })
}

const onEventDetail = (row: HistoryEventItem) => {
  push({
    path: `/lad/list/incident/target/${row.id}`
  })
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
        default: (data: { row: HistoryEventItem }) =>
          handlingStatusDisplay(data.row.handlingStatus)
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
    width: '120px',
    fixed: 'right',
    table: {
      slots: {
        default: (data: { row: HistoryEventItem }) => (
          <BaseButton type="primary" onClick={() => onEventDetail(data.row)}>
            详情
          </BaseButton>
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

watch(
  [() => detail.value, enableLiveFlight],
  ([d, live]) => {
    stopLiveFlight()
    if (d && live) startLiveFlight(d)
  }
)

onUnmounted(stopLiveFlight)
</script>

<template>
  <ContentDetailWrap v-loading="loading" title="">
    <template #header>
      <BaseButton @click="goBackList">返回列表</BaseButton>
    </template>

    <template v-if="detail">
      <ContentWrap class="target-detail-profile">
        <div class="target-detail-profile__head">
          <span class="target-detail-profile__title">目标档案</span>
          <ElTag
            :type="listTypeTag(displayManagedListType(detail.listType))"
            size="small"
            effect="light"
          >
            {{ displayManagedListType(detail.listType) }}
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
          <ElDescriptionsItem label="品牌型号">{{ detail.model }}</ElDescriptionsItem>
          <ElDescriptionsItem label="识别码">{{ detail.sn }}</ElDescriptionsItem>

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
      </ContentWrap>

      <ContentWrap class="target-detail-events" title="历史事件信息">
        <section class="target-detail-events__snapshot">
          <div class="target-detail-events__snapshot-title-row">
            <div class="target-detail-events__snapshot-title-left">
              <span class="target-detail-events__snapshot-title">最近一次探测</span>
              <ElTooltip :content="LIVE_FLIGHT_TOOLTIP" effect="dark" placement="right">
                <Icon
                  class="target-detail-events__snapshot-tip"
                  icon="vi-bi:question-circle-fill"
                  :size="14"
                />
              </ElTooltip>
              <ElTag v-if="enableLiveFlight" type="warning" size="small" effect="light">
                飞行中
              </ElTag>
            </div>
            <BaseButton v-if="enableLiveFlight" type="primary" @click="goCommandScreen">
              跳转指控中心
            </BaseButton>
          </div>
          <ElDescriptions
            :column="2"
            border
            size="small"
            label-width="128px"
            class="target-detail-descriptions target-detail-events__snapshot-table"
          >
            <ElDescriptionsItem label="探测时间">
              <span :class="{ 'target-detail-events__live-value': enableLiveFlight }">
                {{ snapshotObservedAt }}
              </span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="威胁等级">
              <ElTag :type="threatTagType(detail.threatLevel)" size="small" effect="light">
                {{ detail.threatLevel }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="处置状态">
              {{ handlingStatusDisplay(detail.handlingStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="所在区域">{{ detail.zoneName }}</ElDescriptionsItem>

            <ElDescriptionsItem label="无人机最后位置" :span="2">
              <span :class="{ 'target-detail-events__live-value': enableLiveFlight }">
                {{ snapshotLastPosition }}
              </span>
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
                  isHandlingInProgress(detail.handlingStatus) && !detail.disposalDetail?.trim()
                    ? 'text-[var(--el-text-color-secondary)]'
                    : ''
                "
              >
                {{ disposalDetailText(detail) }}
              </span>
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <div class="target-detail-events__list-head-row">
          <span class="target-detail-events__list-head">全部历史记录</span>
          <div class="target-detail-events__actions">
            <BaseButton :type="removeButtonType" @click="onRemoveFromList">
              {{ removeListLabel }}
            </BaseButton>
          </div>
        </div>
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
}

.target-detail-events {
  &__snapshot {
    margin-bottom: 12px;
  }

  &__snapshot-title-row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__snapshot-title-left {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  &__snapshot-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__snapshot-tip {
    color: var(--el-text-color-secondary);
    cursor: help;
  }

  &__live-value {
    font-variant-numeric: tabular-nums;
    transition: color 0.2s ease;
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

  &__list-head-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 12px;
  }

  &__list-head {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__toolbar {
    margin-bottom: 10px;
  }

  &__filters {
    width: 100%;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex-shrink: 0;
  }
}
</style>
