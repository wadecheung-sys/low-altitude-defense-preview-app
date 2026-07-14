<script setup lang="tsx">
import { reactive, ref, unref } from 'vue'
import { useRouter } from 'vue-router'
import { ElLink, ElMessage, ElOption, ElRadio, ElRadioGroup, ElSelect, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { getHistoryEventListApi } from '@/api/lad/incident'
import {
  HISTORY_TARGET_TYPE_OPTIONS,
  historyTargetTypeTagType
} from '@/api/lad/incident/historyTargetType'
import type { HistoryEventItem } from '@/api/lad/incident/types'
import ManualConfirmDialog from './components/ManualConfirmDialog.vue'
import {
  exportHistoryEvents,
  fetchHistoryEventsForExport,
  type HistoryEventExportFormat,
  type HistoryEventExportRange
} from './historyEventExport'
import { targetModelOptions } from '../shared/ladOptionConstants'
import {
  HANDLING_STATUS_OPTIONS,
  THREAT_LEVEL_OPTIONS,
  VERIFICATION_METHOD_OPTIONS,
  countermeasureDeviceDisplay,
  handlingStatusDisplay,
  handlingStatusTagType,
  isHandlingEnded,
  threatLevelDisplay,
  threatLevelTagType,
  verificationMethodOf,
  verificationMethodTagType
} from '../shared/ladDictHelpers'

const historyListTypeOptions = [
  { label: '黑名单', value: '黑名单' },
  { label: '白名单', value: '白名单' },
  { label: '未知', value: '未知' }
]

defineOptions({
  name: 'LadIncidentHistory'
})

const { push } = useRouter()

const searchParams = ref<Recordable>({})
const confirmVisible = ref(false)
const confirmRow = ref<HistoryEventItem>()
const exportVisible = ref(false)
const exportRange = ref<HistoryEventExportRange>('query')
const exportFormat = ref<HistoryEventExportFormat>('excel')
const exportLoading = ref(false)

const setSearchParams = (params: Recordable) => {
  const range = params.discoveredAtRange as string[] | undefined
  searchParams.value = {
    listType: params.listType,
    historyTargetType: params.historyTargetType,
    targetModel: params.targetModel,
    uavSn: params.uavSn,
    targetId: params.targetId,
    threatLevel: params.threatLevel,
    handlingStatus: params.handlingStatus,
    verificationMethod: params.verificationMethod,
    detectionDevice: params.detectionDevice,
    countermeasureDevice: params.countermeasureDevice,
    discoveredAtStart: range?.[0],
    discoveredAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

const countermeasureOptions = [
  { label: '干扰-01', value: '干扰-01' },
  { label: '--', value: '--' },
  { label: '诱骗-02', value: '诱骗-02' },
  { label: '激光-01', value: '激光-01' }
]

const detectionDevices = ['雷达-01 (2.4G)', '无线电-02', '雷达-03 (5.8G)', '光电-01', '融合节点-A']

const filterByTargetId = (targetId: string) => {
  searchParams.value = { ...unref(searchParams), targetId }
  currentPage.value = 1
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getHistoryEventListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return {
      list: res.data.list,
      total: res.data.total
    }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList, getElTableExpose } = tableMethods

getList()

const goDetail = (row: HistoryEventItem) => {
  push(`/lad/incident/target/${row.id}`)
}

const goUavRegistry = (row: HistoryEventItem) => {
  if (row.uavSn === '未解析') return
  push({
    path: '/lad/list/black-white',
    query: { sn: row.uavSn, openDetail: '1' }
  })
}

const openManualConfirm = (row: HistoryEventItem) => {
  confirmRow.value = row
  confirmVisible.value = true
}

const onConfirmSuccess = () => {
  ElMessage.success('人工核查已保存')
  getList()
}

const openExportDialog = () => {
  exportFormat.value = 'excel'
  exportRange.value = 'query'
  exportVisible.value = true
}

const exportReport = async () => {
  let rangeLabel = ''
  let selected: HistoryEventItem[] = []

  if (exportRange.value === 'selected') {
    const elTableExpose = await getElTableExpose()
    selected = (elTableExpose?.getSelectionRows() as HistoryEventItem[] | undefined) || []
    if (!selected.length) {
      ElMessage.warning('请先勾选要导出的历史事件')
      return
    }
    rangeLabel = '所选数据'
  } else if (exportRange.value === 'query') {
    rangeLabel = '查询结果'
    if (!unref(total)) {
      ElMessage.warning('当前查询结果为空，无法导出')
      return
    }
  } else {
    rangeLabel = '所有数据'
  }

  exportLoading.value = true
  try {
    const rows = await fetchHistoryEventsForExport(exportRange.value, unref(searchParams), selected)
    if (!rows.length) {
      ElMessage.warning('没有可导出的历史事件记录')
      return
    }
    await exportHistoryEvents(exportFormat.value, rows, rangeLabel)
    const formatLabel = exportFormat.value === 'word' ? 'Word' : 'Excel'
    ElMessage.success(`历史事件 ${formatLabel} 报表已导出（${rangeLabel}，${rows.length} 条）`)
    exportVisible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败，请稍后重试')
  } finally {
    exportLoading.value = false
  }
}

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'selection',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: { type: 'selection' }
  },
  {
    field: 'index',
    label: '序号',
    type: 'index',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'targetId',
    label: '目标ID',
    minWidth: 138,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '融合目标编号',
        style: { width: '100%' }
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElLink type="primary" underline={false} onClick={() => filterByTargetId(row.targetId)}>
            {row.targetId}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'listType',
    label: '名单类型',
    minWidth: 96,
    search: {
      component: 'Select',
      componentProps: {
        placeholder: '请选择名单类型',
        style: { width: '100%' },
        clearable: true,
        options: historyListTypeOptions
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElTag
            type={
              row.listType === '黑名单' ? 'danger' : row.listType === '白名单' ? 'success' : 'info'
            }
          >
            {row.listType}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'historyTargetType',
    label: '目标类型',
    minWidth: 132,
    search: {
      component: 'Select',
      componentProps: {
        placeholder: '请选择目标类型',
        style: { width: '100%' },
        clearable: true,
        options: HISTORY_TARGET_TYPE_OPTIONS
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElTag type={historyTargetTypeTagType(row.historyTargetType)} size="small" effect="light">
            {row.historyTargetType}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'discoveredAt',
    label: '发现时间',
    minWidth: 168,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'handledAt',
    label: '处置时间',
    minWidth: 168,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'pilotLocation',
    label: '飞手位置',
    minWidth: 112,
    search: { hidden: true },
    table: {
      slots: {
        default: () => <span class="text-[var(--el-text-color-secondary)]">未定位</span>
      }
    }
  },
  {
    field: 'targetModel',
    label: '目标型号',
    minWidth: 128,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        options: targetModelOptions,
        clearable: true,
        filterable: true,
        placeholder: '请选择目标型号',
        style: { width: '100%' }
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'uavSn',
    label: '识别码',
    minWidth: 128,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请输入识别码',
        style: { width: '100%' }
      }
    },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: HistoryEventItem }) =>
          row.uavSn === '未解析' ? (
            <span class="text-[var(--el-text-color-secondary)]">未解析</span>
          ) : (
            <ElLink type="primary" underline={false} onClick={() => goUavRegistry(row)}>
              {row.uavSn}
            </ElLink>
          )
      }
    }
  },
  {
    field: 'discoveredAtRange',
    label: '发现时间',
    search: {
      component: 'DatePicker',
      colProps: { span: 8 },
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        style: { width: '100%' }
      }
    },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'threatLevel',
    label: '威胁等级',
    minWidth: 92,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择威胁等级',
        style: { width: '100%' },
        clearable: true,
        options: THREAT_LEVEL_OPTIONS
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElTag type={threatLevelTagType(row.threatLevel)} size="small" effect="light">
            {threatLevelDisplay(row.threatLevel)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'verificationMethod',
    label: '验证方式',
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择验证方式',
        style: { width: '100%' },
        clearable: true,
        options: VERIFICATION_METHOD_OPTIONS
      }
    },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'manualConfirmStatus',
    label: '验证方式',
    minWidth: 108,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => {
          const method = verificationMethodOf(row.manualConfirmStatus)
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
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择探测设备',
        style: { width: '100%' },
        clearable: true,
        options: detectionDevices.map((item) => ({ label: item, value: item }))
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'countermeasureDevice',
    label: '反制设备',
    minWidth: 130,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择反制设备',
        style: { width: '100%' },
        clearable: true,
        options: countermeasureOptions
      }
    },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: HistoryEventItem }) =>
          countermeasureDeviceDisplay(row.countermeasureDevice)
      }
    }
  },
  {
    field: 'handlingStatus',
    label: '处置状态',
    minWidth: 96,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择处置状态',
        style: { width: '100%' },
        clearable: true,
        options: HANDLING_STATUS_OPTIONS
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElTag type={handlingStatusTagType(row.handlingStatus)} effect="light">
            {handlingStatusDisplay(row.handlingStatus)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'remark',
    label: '备注',
    minWidth: 120,
    search: { hidden: true },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => {
          const remark = row.remark.replace('人工确认', '人工核查')
          return remark === '等待值守人员确认' || remark === '等待值守人员人工核查' ? '' : remark
        }
      }
    }
  },
  {
    field: 'action',
    width: '220px',
    label: '操作',
    fixed: 'right',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <>
            {!row.manualConfirmStatus.startsWith('人工-') &&
            !isHandlingEnded(row.handlingStatus) ? (
              <BaseButton type="primary" onClick={() => openManualConfirm(row)}>
                人工核查
              </BaseButton>
            ) : null}
            <BaseButton type="success" onClick={() => goDetail(row)}>
              详情
            </BaseButton>
          </>
        )
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)
</script>

<template>
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />

    <div class="mb-10px">
      <BaseButton type="primary" @click="openExportDialog">导出</BaseButton>
    </div>

    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      :scrollbar-always-on="true"
      @register="tableRegister"
    />

    <ManualConfirmDialog v-model="confirmVisible" :row="confirmRow" @success="onConfirmSuccess" />

    <Dialog v-model="exportVisible" title="导出数据" width="520px" max-height="400px">
      <div class="export-dialog">
        <div class="export-dialog__row">
          <div class="export-dialog__label">导出范围</div>
          <ElRadioGroup v-model="exportRange" class="export-dialog__radios">
            <ElRadio label="all">导出所有数据</ElRadio>
            <ElRadio label="query">导出查询结果</ElRadio>
            <ElRadio label="selected">导出所选数据</ElRadio>
          </ElRadioGroup>
        </div>

        <div class="export-dialog__row">
          <div class="export-dialog__label">导出格式</div>
          <ElSelect
            v-model="exportFormat"
            class="export-dialog__select"
            placeholder="请选择导出格式"
          >
            <ElOption label="Excel" value="excel" />
            <ElOption label="Word" value="word" />
          </ElSelect>
        </div>
      </div>

      <template #footer>
        <BaseButton type="primary" :loading="exportLoading" @click="exportReport"
          >确定导出</BaseButton
        >
        <BaseButton @click="exportVisible = false">取消</BaseButton>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<style scoped lang="less">
.export-dialog {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 0;

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  &__label {
    flex-shrink: 0;
    width: 72px;
    padding-top: 8px;
    font-size: 14px;
    line-height: 22px;
    color: var(--el-text-color-regular);
    text-align: right;
  }

  &__radios {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 8px 24px;
    padding-top: 4px;
  }

  &__select {
    flex: 1;
    max-width: 320px;
  }
}
</style>
