<script setup lang="tsx">
import { reactive, ref, unref } from 'vue'
import { ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deletePlanApi, getPlanListApi, togglePlanEnabledApi } from '@/api/lad/plan'
import type { PlanStrategy } from '@/api/lad/plan/types'
import PlanFormDialog from './components/PlanFormDialog.vue'
import PlanDetailDialog from './components/PlanDetailDialog.vue'
import PlanSimulateDialog from './components/PlanSimulateDialog.vue'
import { PLAN_SEARCH_COL, UI } from './planConstants'
import { allOption } from '../shared/ladOptionConstants'

defineOptions({ name: 'LadPlanStrategyList' })

const searchParams = ref<Recordable>({})
const selectedIds = ref<string[]>([])
const formVisible = ref(false)
const formRow = ref<PlanStrategy>()
const detailVisible = ref(false)
const detailId = ref<string>()
const simulateVisible = ref(false)
const togglingId = ref<string | null>(null)

const disposalFilterOptions = [
  allOption,
  { label: UI.disposalModeAuto, value: 'auto' },
  { label: UI.disposalModeManual, value: 'manual' }
]

function triggerRuleCount(row: PlanStrategy) {
  return row.triggerRuleCount ?? row.triggerRules?.length ?? 0
}

function triggerRuleDesc(row: PlanStrategy) {
  const names = [...(row.triggerRules || [])]
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
    .map((item) => item.ruleName?.trim())
    .filter(Boolean)
  return names.length ? names.join('、') : '-'
}

const setSearchParams = (params: Recordable) => {
  const mode = params.disposalMode as string | undefined
  searchParams.value = {
    planName: params.planName,
    disposalMode: !mode || mode === '全部' ? undefined : mode
  }
  currentPage.value = 1
  getList()
}

function onSelectionChange(rows: PlanStrategy[]) {
  selectedIds.value = rows.map((row) => row.id)
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
      {
        type: 'warning'
      }
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
    await ElMessageBox.confirm(`确认删除预案“${row.planName}”吗？`, UI.btnDelete, {
      type: 'warning'
    })
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
    return { list: res?.data?.list ?? [], total: res?.data?.total ?? 0 }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

const crudSchemas = reactive<CrudSchema[]>([
  { field: 'selection', search: { hidden: true }, table: { type: 'selection' } },
  { field: 'index', label: '序号', type: 'index', search: { hidden: true } },
  {
    field: 'planName',
    label: UI.planName,
    search: {
      component: 'Input',
      colProps: PLAN_SEARCH_COL,
      componentProps: { clearable: true, placeholder: '请输入预案名称', style: { width: '100%' } }
    },
    table: { minWidth: 160, showOverflowTooltip: true }
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
        style: { width: '100%' }
      }
    },
    table: {
      width: 148,
      slots: {
        default: ({ row }: { row: PlanStrategy }) => {
          const mode = row.disposalMode
          const tagType = mode === 'auto' ? 'success' : mode === 'manual' ? 'warning' : 'info'
          const label =
            row.disposalModeLabel ||
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
    field: 'threatLevel',
    label: UI.threatLevel,
    search: { hidden: true },
    table: { width: 100, align: 'center' }
  },
  {
    field: 'priority',
    label: UI.planPriority,
    search: { hidden: true },
    table: {
      width: 90,
      align: 'center',
      slots: { default: ({ row }: { row: PlanStrategy }) => row.priority ?? '-' }
    }
  },
  {
    field: 'triggerRuleCount',
    label: UI.triggerRuleCount,
    search: { hidden: true },
    table: {
      width: 120,
      align: 'center',
      slots: { default: ({ row }: { row: PlanStrategy }) => triggerRuleCount(row) }
    }
  },
  {
    field: 'triggerRuleDesc',
    label: UI.triggerRuleDesc,
    search: { hidden: true },
    table: {
      minWidth: 220,
      showOverflowTooltip: true,
      slots: { default: ({ row }: { row: PlanStrategy }) => triggerRuleDesc(row) }
    }
  },
  {
    field: 'enabled',
    label: UI.enabled,
    search: { hidden: true },
    table: {
      width: 88,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: PlanStrategy }) => (
          <ElSwitch
            modelValue={row.enabled}
            inline-prompt
            active-text="ON"
            inactive-text="OFF"
            loading={togglingId.value === row.id}
            onChange={(value: boolean) => onToggle(row, value)}
          />
        )
      }
    }
  },
  {
    field: 'action',
    label: UI.action,
    search: { hidden: true },
    table: {
      width: 260,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: PlanStrategy }) => (
          <>
            <BaseButton type="success" onClick={() => openDetail(row)}>
              {UI.btnDetail}
            </BaseButton>
            <BaseButton type="primary" class="ml-8px" onClick={() => openEdit(row)}>
              {UI.btnEdit}
            </BaseButton>
            <BaseButton type="danger" class="ml-8px" onClick={() => removeRow(row)}>
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
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
    <div class="mb-10px">
      <BaseButton type="primary" @click="openAdd">{{ UI.btnAdd }}</BaseButton>
      <BaseButton type="primary" class="ml-8px" @click="simulateVisible = true">{{
        UI.btnSimulate
      }}</BaseButton>
      <BaseButton type="danger" class="ml-8px" @click="batchRemove">{{
        UI.btnBatchDelete
      }}</BaseButton>
    </div>
    <Table
      v-model:currentPage="currentPage"
      v-model:pageSize="pageSize"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
      @selection-change="onSelectionChange"
    />
    <PlanFormDialog v-model="formVisible" :row="formRow" @success="getList" />
    <PlanDetailDialog v-model="detailVisible" :plan-id="detailId" />
    <PlanSimulateDialog v-if="simulateVisible" v-model="simulateVisible" />
  </ContentWrap>
</template>
