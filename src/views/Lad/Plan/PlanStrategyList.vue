<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  deletePlanApi,
  getPlanListApi,
  togglePlanEnabledApi
} from '@/api/lad/plan'
import type { PlanStrategy } from '@/api/lad/plan/types'
import PlanFormDialog from './components/PlanFormDialog.vue'
import PlanDetailDialog from './components/PlanDetailDialog.vue'
import { PLAN_SEARCH_COL, PLAN_SEARCH_DATE_COL, UI } from './planConstants'
import { allOption } from '../shared/ladOptionConstants'
import { reactive, ref, unref } from 'vue'
import { ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'

defineOptions({ name: 'LadPlanStrategyList' })

const searchParams = ref<Recordable>({})
const selectedIds = ref<string[]>([])
const formVisible = ref(false)
const formRow = ref<PlanStrategy>()
const detailVisible = ref(false)
const detailId = ref<string>()
const togglingId = ref<string | null>(null)

const disposalFilterOptions = [
  allOption,
  { label: UI.disposalModeAuto, value: 'auto' },
  { label: UI.disposalModeManual, value: 'manual' }
]

const searchFieldStyle = { width: '100%' }

const setSearchParams = (params: Recordable) => {
  const range = params.updatedAtRange as string[] | undefined
  const mode = params.disposalMode as string | undefined
  searchParams.value = {
    planCode: params.planCode,
    planName: params.planName,
    disposalMode: !mode || mode === '全部' ? undefined : mode,
    updatedBy: params.updatedBy,
    updatedAtStart: range?.[0],
    updatedAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

function onSelectionChange(rows: PlanStrategy[]) {
  selectedIds.value = rows.map((r) => r.id)
}

const openAdd = () => {
  formRow.value = undefined
  formVisible.value = true
}

const openEdit = (row: PlanStrategy) => {
  formRow.value = row
  formVisible.value = true
}

const openDetail = (row: PlanStrategy) => {
  detailId.value = row.id
  detailVisible.value = true
}

async function onToggle(row: PlanStrategy, enabled: boolean) {
  togglingId.value = row.id
  try {
    await togglePlanEnabledApi({ id: row.id, enabled })
    row.enabled = enabled
  } catch {
    getList()
  } finally {
    togglingId.value = null
  }
}

async function batchRemove() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先勾选预案')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedIds.value.length} 条预案吗？`,
      UI.btnBatchDelete,
      { type: 'warning' }
    )
  } catch {
    return
  }
  await deletePlanApi({ ids: [...selectedIds.value] })
  selectedIds.value = []
  ElMessage.success(UI.deleteOk)
  getList()
}

async function removeRow(row: PlanStrategy) {
  try {
    await ElMessageBox.confirm(
      `确认删除预案「${row.planName}」吗？`,
      UI.btnDelete,
      { type: 'warning' }
    )
  } catch {
    return
  }
  await deletePlanApi({ ids: [row.id] })
  ElMessage.success(UI.deleteOk)
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getPlanListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'selection',
    search: { hidden: true },
    table: { type: 'selection' }
  },
  {
    field: 'index',
    label: '序号',
    type: 'index',
    search: { hidden: true }
  },
  {
    field: 'planCode',
    label: UI.planCode,
    search: {
      component: 'Input',
      colProps: PLAN_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入预案编号',
        style: searchFieldStyle
      }
    },
    table: { minWidth: 128, showOverflowTooltip: true }
  },
  {
    field: 'planName',
    label: UI.planName,
    search: {
      component: 'Input',
      colProps: PLAN_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入预案名称',
        style: searchFieldStyle
      }
    },
    table: { minWidth: 140, showOverflowTooltip: true }
  },
  {
    field: 'disposalMode',
    label: UI.disposalMode,
    search: {
      component: 'Select',
      colProps: PLAN_SEARCH_COL,
      componentProps: {
        options: disposalFilterOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: {
      width: 148,
      slots: {
        default: (data: { row: PlanStrategy }) => {
          const mode = data.row.disposalMode
          const tagType =
            mode === 'auto' ? 'success' : mode === 'manual' ? 'warning' : 'info'
          const label =
            data.row.disposalModeLabel ||
            (mode === 'auto'
              ? UI.disposalModeAuto
              : mode === 'manual'
                ? UI.disposalModeManual
                : '-')
          return (
            <ElTag size="small" effect="light" type={tagType}>
              {label}
            </ElTag>
          )
        }
      }
    }
  },
  {
    field: 'triggerRuleCount',
    label: UI.triggerRules,
    search: { hidden: true },
    table: {
      width: 72,
      align: 'center',
      slots: {
        default: (data: { row: PlanStrategy }) => {
          const count =
            data.row.triggerRuleCount ??
            (Array.isArray(data.row.triggerRules) ? data.row.triggerRules.length : 0)
          return <span>{count}条</span>
        }
      }
    }
  },
  {
    field: 'enabled',
    label: UI.enabled,
    search: { hidden: true },
    table: {
      width: 88,
      slots: {
        default: (data: { row: PlanStrategy }) => (
          <ElSwitch
            modelValue={data.row.enabled}
            inline-prompt
            active-text="ON"
            inactive-text="OFF"
            loading={togglingId.value === data.row.id}
            onChange={(val: boolean) => onToggle(data.row, val)}
          />
        )
      }
    }
  },
  {
    field: 'updatedAt',
    label: UI.updatedAt,
    search: { hidden: true },
    table: { width: 168, showOverflowTooltip: true }
  },
  {
    field: 'updatedBy',
    label: UI.updatedBy,
    search: {
      component: 'Input',
      colProps: PLAN_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入修改人',
        style: searchFieldStyle
      }
    },
    table: { hidden: true }
  },
  {
    field: 'updatedAtRange',
    label: UI.updatedAt,
    search: {
      component: 'DatePicker',
      colProps: PLAN_SEARCH_DATE_COL,
      componentProps: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        style: searchFieldStyle
      }
    },
    table: { hidden: true }
  },
  {
    field: 'action',
    label: UI.action,
    search: { hidden: true },
    table: {
      width: 260,
      fixed: 'right',
      slots: {
        default: (data: { row: PlanStrategy }) => (
          <>
            <BaseButton type="primary" onClick={() => openDetail(data.row)}>
              {UI.btnDetail}
            </BaseButton>
            <BaseButton type="primary" class="ml-8px" onClick={() => openEdit(data.row)}>
              {UI.btnEdit}
            </BaseButton>
            <BaseButton type="danger" class="ml-8px" onClick={() => removeRow(data.row)}>
              {UI.btnDelete}
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
      <BaseButton type="primary" @click="openAdd">{{ UI.btnAdd }}</BaseButton>
      <BaseButton type="danger" class="ml-8px" @click="batchRemove">{{ UI.btnBatchDelete }}</BaseButton>
    </div>
    <Table
      v-model:currentPage="currentPage"
      v-model:pageSize="pageSize"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total: total }"
      @register="tableRegister"
      @selection-change="onSelectionChange"
    />
    <PlanFormDialog v-model="formVisible" :row="formRow" @success="getList" />
    <PlanDetailDialog v-model="detailVisible" :plan-id="detailId" />
  </ContentWrap>
</template>
