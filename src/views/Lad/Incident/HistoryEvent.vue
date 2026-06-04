<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteHistoryEventApi, getHistoryEventListApi } from '@/api/lad/incident'
import type {
  HandlingStatus,
  HistoryEventItem,
  ManualConfirmStatus,
  ThreatLevel
} from '@/api/lad/incident/types'
import { reactive, ref, unref } from 'vue'
import { useRouter } from 'vue-router'
import { ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import ManualConfirmDialog from './components/ManualConfirmDialog.vue'

defineOptions({
  name: 'LadIncidentHistory'
})

const { push } = useRouter()

const ids = ref<string[]>([])
const searchParams = ref<Recordable>({})
const confirmVisible = ref(false)
const confirmRow = ref<HistoryEventItem>()

const setSearchParams = (params: Recordable) => {
  const range = params.discoveredAtRange as string[] | undefined
  searchParams.value = {
    targetModel: params.targetModel,
    uavSn: params.uavSn,
    targetId: params.targetId,
    threatLevel: params.threatLevel,
    handlingStatus: params.handlingStatus,
    manualConfirmStatus: params.manualConfirmStatus,
    trajectoryFeature: params.trajectoryFeature,
    detectionDevice: params.detectionDevice,
    countermeasureDevice: params.countermeasureDevice,
    handlingResult: params.handlingResult,
    pilotLocated: params.pilotLocated,
    discoveredAtStart: range?.[0],
    discoveredAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

const threatLevelOptions = [
  { label: '高', value: '高' },
  { label: '中', value: '中' },
  { label: '低', value: '低' },
  { label: '未知', value: '未知' }
]

const handlingStatusOptions = [
  { label: '待处置', value: '待处置' },
  { label: '处置中', value: '处置中' },
  { label: '已处置', value: '已处置' },
  { label: '已关闭', value: '已关闭' },
  { label: '仅记录', value: '仅记录' }
]

const manualConfirmOptions = [
  { label: '待人工确认', value: '待人工确认' },
  { label: '真实入侵', value: '真实入侵' },
  { label: '飞鸟/误报', value: '飞鸟/误报' },
  { label: '启动反制', value: '启动反制' }
]

const trajectoryOptions = [
  { label: '直线逼近', value: '直线逼近' },
  { label: '盘旋', value: '盘旋' },
  { label: '悬停', value: '悬停' },
  { label: '快速穿越', value: '快速穿越' },
  { label: '不规则', value: '不规则' }
]

const countermeasureOptions = [
  { label: '干扰-01 (自动)', value: '干扰-01 (自动)' },
  { label: '—', value: '—' },
  { label: '诱骗-02', value: '诱骗-02' },
  { label: '干扰-01 (人工)', value: '干扰-01 (人工)' },
  { label: '激光-01 (待命)', value: '激光-01 (待命)' }
]

const handlingResultOptions = [
  { label: '监控跟踪', value: '监控跟踪' },
  { label: '无线电干扰', value: '无线电干扰' },
  { label: '迫降处置', value: '迫降处置' },
  { label: '告警记录', value: '告警记录' },
  { label: '移交执勤', value: '移交执勤' }
]

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
  },
  fetchDelApi: async () => {
    const res = await deleteHistoryEventApi(unref(ids))
    return !!res
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList, getElTableExpose, delList } = tableMethods

getList()

const delLoading = ref(false)

const threatTagType = (level: ThreatLevel) => {
  const map: Record<ThreatLevel, 'danger' | 'warning' | 'success' | 'info'> = {
    高: 'danger',
    中: 'warning',
    低: 'success',
    未知: 'info'
  }
  return map[level]
}

const statusTagType = (status: HandlingStatus) => {
  const map: Record<HandlingStatus, 'info' | 'warning' | 'success' | 'danger'> = {
    待处置: 'danger',
    处置中: 'warning',
    已处置: 'success',
    已关闭: 'info',
    仅记录: 'info'
  }
  return map[status]
}

const goDetail = (row: HistoryEventItem) => {
  push(`/lad/incident/target/${row.id}`)
}

const goReplay = (row: HistoryEventItem) => {
  push({ path: `/lad/incident/target/${row.id}`, query: { tab: 'replay' } })
}

const goUavRegistry = (row: HistoryEventItem) => {
  if (row.uavSn === '未解析') return
  push({ path: '/lad/list/black-white', query: { sn: row.uavSn, targetId: row.targetId } })
}

const openManualConfirm = (row: HistoryEventItem) => {
  confirmRow.value = row
  confirmVisible.value = true
}

const onConfirmSuccess = () => {
  ElMessage.success('人工确认已保存')
  getList()
}

const confirmTagType = (status: ManualConfirmStatus) => {
  const map: Record<ManualConfirmStatus, 'danger' | 'success' | 'warning' | 'info'> = {
    待人工确认: 'warning',
    真实入侵: 'danger',
    '飞鸟/误报': 'success',
    启动反制: 'info'
  }
  return map[status]
}

const exportReport = (format: 'word' | 'excel') => {
  const label = format === 'word' ? 'Word' : 'Excel'
  ElMessage.success(`已生成历史事件${label}报表（演示，未写入文件）`)
}

const setWhitelist = async (row: HistoryEventItem) => {
  if (row.uavSn === '未解析') {
    ElMessage.warning('该记录无有效 SN，无法设白名单')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将无人机 ${row.uavSn}（${row.targetModel}）加入白名单？加入后不再触发告警。`,
      '设白名单',
      { type: 'info', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    push({ path: '/lad/list/black-white', query: { sn: row.uavSn, add: 'white' } })
    ElMessage.success('已跳转黑白名单（演示）')
  } catch {
    /* 取消 */
  }
}

const delData = async (row: HistoryEventItem | null) => {
  const elTableExpose = await getElTableExpose()
  const selected = elTableExpose?.getSelectionRows() as HistoryEventItem[] | undefined
  const deleteIds = row ? [row.id] : selected?.map((r) => r.id) || []
  if (!deleteIds.length) {
    ElMessage.warning('请先勾选要删除的记录')
    return
  }
  try {
    await ElMessageBox.confirm(
      row
        ? `确定删除目标 ${row.targetId} 的该条历史记录？删除后不可恢复。`
        : `确定批量删除已选 ${deleteIds.length} 条历史记录？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    ids.value = deleteIds
    delLoading.value = true
    await delList(unref(ids).length).finally(() => {
      delLoading.value = false
    })
    ElMessage.success('删除成功')
  } catch {
    /* 用户取消 */
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
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <>
            <ElLink type="primary" underline={false} onClick={() => filterByTargetId(row.targetId)}>
              {row.targetId}
            </ElLink>
            {row.relatedEventCount > 1 ? (
              <ElTag size="small" class="ml-6px" type="warning">
                共{row.relatedEventCount}条
              </ElTag>
            ) : null}
          </>
        )
      }
    }
  },
  {
    field: 'trajectoryFeature',
    label: '轨迹特征',
    minWidth: 100,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择轨迹特征',
        style: { width: '100%' },
        clearable: true,
        options: trajectoryOptions
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElLink type="primary" underline={false} onClick={() => goReplay(row)}>
            {row.trajectoryFeature}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'handledAt',
    label: '处置时间',
    minWidth: 168,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'discoveredAt',
    label: '发现时间',
    minWidth: 168,
    search: { hidden: true }
  },
  {
    field: 'endedAt',
    label: '结束时间',
    minWidth: 168,
    search: { hidden: true }
  },
  {
    field: 'abnormalDuration',
    label: '异常时长',
    minWidth: 96,
    search: { hidden: true }
  },
  {
    field: 'duration',
    label: '持续时长',
    minWidth: 96,
    search: { hidden: true }
  },
  {
    field: 'pilotLocation',
    label: '飞手位置',
    minWidth: 168,
    search: { hidden: true },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: HistoryEventItem }) =>
          row.pilotLocation === '未定位' ? (
            <span class="text-[var(--el-text-color-secondary)]">未定位</span>
          ) : (
            <span title="无线电解析 / TDOA 等推算">{row.pilotLocation}</span>
          )
      }
    }
  },
  {
    field: 'targetLocation',
    label: '目标位置',
    minWidth: 130,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'targetModel',
    label: '目标型号',
    minWidth: 128,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请输入目标型号',
        style: { width: '100%' }
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'uavSn',
    label: '无人机SN码',
    minWidth: 128,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请输入无人机 SN',
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
        options: threatLevelOptions
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElTag type={threatTagType(row.threatLevel)}>{row.threatLevel}</ElTag>
        )
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
        options: handlingStatusOptions
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElTag type={statusTagType(row.handlingStatus)}>{row.handlingStatus}</ElTag>
        )
      }
    }
  },
  {
    field: 'manualConfirmStatus',
    label: '人工确认',
    minWidth: 108,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择人工确认',
        style: { width: '100%' },
        clearable: true,
        options: manualConfirmOptions
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: HistoryEventItem }) => (
          <ElTag type={confirmTagType(row.manualConfirmStatus)}>{row.manualConfirmStatus}</ElTag>
        )
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
        options: [
          { label: '雷达-01 (2.4G)', value: '雷达-01 (2.4G)' },
          { label: '无线电-02', value: '无线电-02' },
          { label: '雷达-03 (5.8G)', value: '雷达-03 (5.8G)' },
          { label: '光电-01', value: '光电-01' },
          { label: '融合节点-A', value: '融合节点-A' }
        ]
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
    table: { showOverflowTooltip: true }
  },
  {
    field: 'handlingResult',
    label: '处置结果',
    minWidth: 100,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择处置结果',
        style: { width: '100%' },
        clearable: true,
        options: handlingResultOptions
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'pilotLocated',
    label: '飞手定位',
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '飞手是否已定位',
        style: { width: '100%' },
        clearable: true,
        options: [
          { label: '已定位', value: '已定位' },
          { label: '未定位', value: '未定位' }
        ]
      }
    },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'remark',
    label: '备注',
    minWidth: 120,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'action',
    width: '380px',
    label: '操作',
    fixed: 'right',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: {
      slots: {
        default: (data: { row: HistoryEventItem }) => (
          <>
            <BaseButton type="primary" onClick={() => openManualConfirm(data.row)}>
              人工确认
            </BaseButton>
            <BaseButton type="success" onClick={() => goDetail(data.row)}>
              详情
            </BaseButton>
            <BaseButton onClick={() => setWhitelist(data.row)}>设白名单</BaseButton>
            <BaseButton type="danger" onClick={() => delData(data.row)}>
              删除
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
    <Search
      :schema="allSchemas.searchSchema"
      is-col
      label-width="100px"
      :expand-rows="2"
      :expand-default="false"
      @search="setSearchParams"
      @reset="setSearchParams"
    />

    <div class="mb-10px">
      <BaseButton type="primary" @click="exportReport('excel')">导出 Excel</BaseButton>
      <BaseButton @click="exportReport('word')">导出 Word</BaseButton>
      <BaseButton :loading="delLoading" type="danger" @click="delData(null)">批量删除</BaseButton>
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

    <ManualConfirmDialog
      v-model="confirmVisible"
      :row="confirmRow"
      @success="onConfirmSuccess"
    />
  </ContentWrap>
</template>
