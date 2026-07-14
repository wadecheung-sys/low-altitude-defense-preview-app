<script setup lang="tsx">
import { deleteBlackWhiteApi, getBlackWhiteDetailApi } from '@/api/lad/list'
import type { BlackWhiteTargetDetail } from '@/api/lad/list/types'
import type { ManagedListType } from '@/api/lad/list/listTargetKind'
import { formatValidUntilDisplay } from '@/api/lad/list/validUntilUtils'
import { displayManagedListType } from '@/api/lad/list/listTargetKind'
import { getHistoryEventListApi } from '@/api/lad/incident'
import { getDictEntriesByCodeApi } from '@/api/lad/system'
import type {
  HandlingStatus,
  HistoryEventItem,
  ThreatLevel,
  VerificationMethod
} from '@/api/lad/incident/types'
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
import { computed, onMounted, reactive, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LAD_DATA_SOURCE_DICT_CODE, LAD_DATA_SOURCE_OPTIONS } from '@/constants/ladDataSources'
import {
  HANDLING_STATUS_OPTIONS,
  THREAT_LEVEL_OPTIONS,
  VERIFICATION_METHOD_OPTIONS,
  handlingStatusDisplay,
  threatLevelDisplay,
  threatLevelTagType,
  countermeasureDeviceDisplay,
  handlingStatusTagType,
  verificationMethodOf,
  verificationMethodTagType
} from '../shared/ladDictHelpers'

defineOptions({
  name: 'LadBlackWhiteTargetDetail'
})

const route = useRoute()
const { push } = useRouter()

const loading = ref(true)
const detail = ref<BlackWhiteTargetDetail | null>(null)
const loadError = ref('')

const recordId = computed(() => route.params.id as string)

const latestEvent = ref<HistoryEventItem | null>(null)

const eventFilters = reactive<{
  discoveredAtRange: string[]
  zoneName: string
  dataSource: string
  threatLevel: ThreatLevel | ''
  verificationMethod: VerificationMethod | ''
  detectionDevice: string
  countermeasureDevice: string
  handlingStatus: HandlingStatus | ''
}>({
  discoveredAtRange: [] as string[],
  zoneName: '',
  dataSource: '',
  threatLevel: '',
  verificationMethod: '',
  detectionDevice: '',
  countermeasureDevice: '',
  handlingStatus: ''
})

const zoneOptions = [
  { label: '全部区域', value: '' },
  { label: '核心防护区A区', value: '核心防护区A区' },
  { label: '缓冲区B区', value: '缓冲区B区' },
  { label: '管制空域C区', value: '管制空域C区' },
  { label: '公共区域', value: '公共区域' }
]

const dataSourceOptions = ref([
  { label: '全部数据来源', value: '' },
  ...LAD_DATA_SOURCE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))
])

const detectionDeviceOptions = [
  { label: '全部探测设备', value: '' },
  { label: '雷达-01 (2.4G)', value: '雷达-01 (2.4G)' },
  { label: '无线电-02', value: '无线电-02' },
  { label: '雷达-03 (5.8G)', value: '雷达-03 (5.8G)' },
  { label: '光电-01', value: '光电-01' },
  { label: '融合节点-A', value: '融合节点-A' }
]

const countermeasureDeviceOptions = [
  { label: '全部反制设备', value: '' },
  { label: '--', value: '--' },
  { label: '干扰-01', value: '干扰-01' },
  { label: '诱骗-02', value: '诱骗-02' },
  { label: '激光-01', value: '激光-01' },
  { label: '光电-01', value: '光电-01' }
]

async function loadDataSourceOptions() {
  const res = await getDictEntriesByCodeApi(LAD_DATA_SOURCE_DICT_CODE)
  const options = res.data.map((item) => ({
    label: item.label,
    value: item.value || item.label
  }))
  if (options.length) {
    dataSourceOptions.value = [{ label: '全部数据来源', value: '' }, ...options]
  }
}

const threatTagType = threatLevelTagType

const listTypeTag = (type: ManagedListType) => {
  const map: Record<ManagedListType, 'danger' | 'success'> = {
    黑名单: 'danger',
    白名单: 'success'
  }
  return map[type]
}

function formatEventRemark(remark: string): string {
  const text = remark.replace('人工确认', '人工核查')
  if (text === '等待值守人员确认' || text === '等待值守人员人工核查') return '—'
  return text.trim() || '—'
}

async function fetchLatestEvent() {
  const d = detail.value
  if (!d) {
    latestEvent.value = null
    return
  }
  const res = await getHistoryEventListApi({
    pageIndex: 1,
    pageSize: 100,
    uavSn: d.sn
  })
  const list = res.data.list
  latestEvent.value = list.length
    ? [...list].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))[0]
    : null
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
    uavSn: d.sn,
    discoveredAtStart: range?.[0],
    discoveredAtEnd: range?.[1],
    zoneName: eventFilters.zoneName || undefined,
    dataSource: eventFilters.dataSource || undefined,
    threatLevel: eventFilters.threatLevel || undefined,
    verificationMethod: eventFilters.verificationMethod || undefined,
    detectionDevice: eventFilters.detectionDevice || undefined,
    countermeasureDevice: eventFilters.countermeasureDevice || undefined,
    handlingStatus: eventFilters.handlingStatus || undefined
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
  eventFilters.threatLevel = ''
  eventFilters.verificationMethod = ''
  eventFilters.detectionDevice = ''
  eventFilters.countermeasureDevice = ''
  eventFilters.handlingStatus = ''
  applyEventFilters()
}

watch(
  () => detail.value?.sn,
  (sn) => {
    if (sn) {
      currentPage.value = 1
      getList()
      fetchLatestEvent()
    } else {
      latestEvent.value = null
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
    field: 'handledAt',
    label: '处置时间',
    minWidth: 168,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'zoneName',
    label: '所在区域',
    minWidth: 130,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'dataSource',
    label: '数据来源',
    minWidth: 128,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'threatLevel',
    label: '威胁等级',
    minWidth: 92,
    table: {
      slots: {
        default: (data: { row: HistoryEventItem }) => (
          <ElTag type={threatLevelTagType(data.row.threatLevel)} size="small" effect="light">
            {threatLevelDisplay(data.row.threatLevel)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'pilotLocation',
    label: '飞手位置',
    minWidth: 112,
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
    field: 'manualConfirmStatus',
    label: '验证方式',
    minWidth: 108,
    table: {
      slots: {
        default: (data: { row: HistoryEventItem }) => {
          const method = verificationMethodOf(data.row.manualConfirmStatus)
          return (
            <ElTag type={verificationMethodTagType(method)} effect="light">
              {method}
            </ElTag>
          )
        }
      }
    }
  },
  {
    field: 'detectionDevice',
    label: '探测设备',
    minWidth: 140,
    table: { showOverflowTooltip: true }
  },
  {
    field: 'countermeasureDevice',
    label: '反制设备',
    minWidth: 130,
    table: {
      showOverflowTooltip: true,
      slots: {
        default: (data: { row: HistoryEventItem }) =>
          countermeasureDeviceDisplay(data.row.countermeasureDevice)
      }
    }
  },
  {
    field: 'handlingStatus',
    label: '处置状态',
    minWidth: 96,
    table: {
      slots: {
        default: (data: { row: HistoryEventItem }) => (
          <ElTag type={handlingStatusTagType(data.row.handlingStatus)} effect="light">
            {handlingStatusDisplay(data.row.handlingStatus)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'remark',
    label: '备注',
    minWidth: 120,
    table: {
      showOverflowTooltip: true,
      slots: {
        default: (data: { row: HistoryEventItem }) => formatEventRemark(data.row.remark)
      }
    }
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

onMounted(() => {
  void loadDataSourceOptions()
})

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
      <div class="target-detail-header">
        <BaseButton @click="goBackList">返回列表</BaseButton>
        <BaseButton v-if="detail" :type="removeButtonType" @click="onRemoveFromList">
          {{ removeListLabel }}
        </BaseButton>
      </div>
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
            <span class="target-detail-events__snapshot-title">最近一次探测</span>
          </div>
          <ElDescriptions
            v-if="latestEvent"
            :column="2"
            border
            size="small"
            label-width="128px"
            class="target-detail-descriptions target-detail-events__snapshot-table"
          >
            <ElDescriptionsItem label="发现时间">
              {{ latestEvent.discoveredAt }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="威胁等级">
              <ElTag :type="threatTagType(latestEvent.threatLevel)" size="small" effect="light">
                {{ latestEvent.threatLevel }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="处置状态">
              {{ handlingStatusDisplay(latestEvent.handlingStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="所在区域">{{ latestEvent.zoneName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="数据来源">{{ latestEvent.dataSource }}</ElDescriptionsItem>

            <ElDescriptionsItem label="无人机最后位置" :span="2">
              {{ latestEvent.targetLocation }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="飞手最后已知位置" :span="2">
              <template v-if="latestEvent.pilotLocation === '未定位'">
                <span class="text-[var(--el-text-color-secondary)]">未定位</span>
              </template>
              <template v-else>
                {{ latestEvent.pilotLocation }}
              </template>
            </ElDescriptionsItem>
          </ElDescriptions>
          <p v-else class="target-detail-events__snapshot-empty">暂无历史事件记录</p>
        </section>

        <div class="target-detail-events__list-head-row">
          <span class="target-detail-events__list-head">全部历史记录</span>
        </div>
        <div class="target-detail-events__toolbar mb-10px">
          <ElForm inline class="target-detail-events__filters">
            <ElFormItem label="发现时间">
              <ElDatePicker
                v-model="eventFilters.discoveredAtRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                clearable
                style="width: 260px"
              />
            </ElFormItem>
            <ElFormItem label="区域">
              <ElSelect
                v-model="eventFilters.zoneName"
                placeholder="全部区域"
                clearable
                style="width: 160px"
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
              >
                <ElOption
                  v-for="opt in dataSourceOptions"
                  :key="opt.value || 'all-src'"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="威胁等级">
              <ElSelect
                v-model="eventFilters.threatLevel"
                placeholder="全部威胁等级"
                clearable
                style="width: 150px"
              >
                <ElOption label="全部威胁等级" value="" />
                <ElOption
                  v-for="opt in THREAT_LEVEL_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="验证方式">
              <ElSelect
                v-model="eventFilters.verificationMethod"
                placeholder="全部验证方式"
                clearable
                style="width: 150px"
              >
                <ElOption label="全部验证方式" value="" />
                <ElOption
                  v-for="opt in VERIFICATION_METHOD_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="探测设备">
              <ElSelect
                v-model="eventFilters.detectionDevice"
                placeholder="全部探测设备"
                clearable
                filterable
                style="width: 170px"
              >
                <ElOption
                  v-for="opt in detectionDeviceOptions"
                  :key="opt.value || 'all-detection'"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="反制设备">
              <ElSelect
                v-model="eventFilters.countermeasureDevice"
                placeholder="全部反制设备"
                clearable
                filterable
                style="width: 160px"
              >
                <ElOption
                  v-for="opt in countermeasureDeviceOptions"
                  :key="opt.value || 'all-countermeasure'"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="处置状态">
              <ElSelect
                v-model="eventFilters.handlingStatus"
                placeholder="全部处置状态"
                clearable
                style="width: 150px"
              >
                <ElOption label="全部处置状态" value="" />
                <ElOption
                  v-for="opt in HANDLING_STATUS_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem>
              <BaseButton type="primary" @click="applyEventFilters">查询</BaseButton>
              <BaseButton class="ml-12px" @click="resetEventFilters">重置</BaseButton>
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
.target-detail-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

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
    margin-bottom: 8px;
  }

  &__snapshot-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__snapshot-empty {
    margin: 0;
    padding: 12px 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__snapshot-table {
    width: 100%;
    margin-bottom: 0;
  }

  &__list-head-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
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
}
</style>
