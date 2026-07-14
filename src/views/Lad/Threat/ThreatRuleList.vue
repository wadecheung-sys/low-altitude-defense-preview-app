<script setup lang="tsx">
import { computed, reactive, ref, unref } from 'vue'
import { ElLink, ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  deleteThreatRuleApi,
  getThreatRuleListApi,
  toggleThreatRuleEnabledApi
} from '@/api/lad/threat'
import { isMonitorCatchAllRule } from '@/api/lad/threat/threatFallback'
import type { ThreatRule } from '@/api/lad/threat/types'
import ThreatRuleFormDialog from './components/ThreatRuleFormDialog.vue'
import ThreatSimulateDialog from './components/ThreatSimulateDialog.vue'
import ThreatRuleDetailDialog from './components/ThreatRuleDetailDialog.vue'
import {
  THREAT_SEARCH_COL,
  buildThreatLevelSelectOptions,
  threatTargetModelFilterOptions,
  UI
} from './threatConstants'
import {
  LAD_DICT_THREAT_LEVEL,
  listTypeTagType,
  threatLevelForRule,
  threatLevelTagTypeForRule
} from '../shared/ladDictHelpers'
import { useLadDictOptions } from '../shared/useLadDictOptions'
import { listTypeOptions, ruleStatusOptions } from '../shared/ladOptionConstants'

defineOptions({ name: 'LadThreatRuleList' })

const { entries: threatLevelEntries } = useLadDictOptions(LAD_DICT_THREAT_LEVEL)

const threatLevelFilterOptions = computed(() =>
  buildThreatLevelSelectOptions(threatLevelEntries.value)
)

const searchParams = ref<Recordable>({})
const selectedIds = ref<string[]>([])
const formVisible = ref(false)
const formRow = ref<ThreatRule>()
const simulateVisible = ref(false)
const detailVisible = ref(false)
const detailRuleId = ref<string>()
const togglingId = ref<string | null>(null)

const searchFieldStyle = { width: '100%' }

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    ruleName: params.ruleName,
    threatLevel: params.threatLevel === '全部' ? undefined : params.threatLevel,
    targetType: params.targetType === '全部' ? undefined : params.targetType,
    targetModel: params.targetModel === '全部' ? undefined : params.targetModel,
    status: !params.enabled || params.enabled === '全部' ? undefined : params.enabled
  }
  currentPage.value = 1
  getList()
}

const onSelectionChange = (rows: ThreatRule[]) => {
  selectedIds.value = rows.map((row) => row.id)
}

const openAdd = () => {
  formRow.value = undefined
  formVisible.value = true
}

const openEdit = (row: ThreatRule) => {
  formRow.value = row
  formVisible.value = true
}

const openDetail = (row: ThreatRule) => {
  detailRuleId.value = row.id
  detailVisible.value = true
}

async function onToggle(row: ThreatRule, enabled: boolean) {
  togglingId.value = row.id
  try {
    await toggleThreatRuleEnabledApi({ id: row.id, enabled })
    row.enabled = enabled
    await getList()
  } catch {
    await getList()
  } finally {
    togglingId.value = null
  }
}

async function batchRemove() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先勾选规则')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedIds.value.length} 条规则吗？`,
      '批量删除',
      {
        type: 'warning'
      }
    )
  } catch {
    return
  }
  await deleteThreatRuleApi({ ids: [...selectedIds.value] })
  selectedIds.value = []
  ElMessage.success('已删除')
  getList()
}

async function removeRow(row: ThreatRule) {
  try {
    await ElMessageBox.confirm(`确认删除规则“${row.ruleName}”吗？`, '删除', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteThreatRuleApi({ ids: [row.id] })
  ElMessage.success('已删除')
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getThreatRuleListApi({
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
    field: 'ruleName',
    label: '规则名称',
    search: {
      component: 'Input',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入规则名称',
        style: searchFieldStyle
      }
    },
    table: {
      minWidth: 180,
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: ThreatRule }) => (
          <span class="inline-flex items-center gap-6px">
            <ElLink type="primary" underline={false} onClick={() => openDetail(row)}>
              {row.ruleName}
            </ElLink>
            {isMonitorCatchAllRule(row) ? (
              <ElTag type="info" size="small" effect="plain">
                {UI.fallbackTag}
              </ElTag>
            ) : null}
          </span>
        )
      }
    }
  },
  {
    field: 'threatLevel',
    label: '威胁等级',
    search: {
      component: 'Select',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        options: threatLevelFilterOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: {
      minWidth: 96,
      align: 'center',
      slots: {
        default: ({ row }: { row: ThreatRule }) => (
          <ElTag type={threatLevelTagTypeForRule(row)} size="small" effect="light">
            {threatLevelForRule(row)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'targetType',
    label: '名单类型',
    search: {
      component: 'Select',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        options: listTypeOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: {
      width: 110,
      slots: {
        default: ({ row }: { row: ThreatRule }) => (
          <ElTag type={listTypeTagType(row.targetType)} size="small" effect="light">
            {row.targetType}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'targetModel',
    label: '目标型号',
    search: {
      component: 'Select',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        options: threatTargetModelFilterOptions,
        clearable: true,
        filterable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: { width: 150, showOverflowTooltip: true }
  },
  {
    field: 'conditionSummary',
    label: '判级条件',
    search: { hidden: true },
    table: { minWidth: 260, showOverflowTooltip: true }
  },
  {
    field: 'priority',
    label: '优先级',
    search: { hidden: true },
    table: {
      width: 90,
      align: 'center',
      slots: {
        default: ({ row }: { row: ThreatRule }) => row.priority
      }
    }
  },
  {
    field: 'enabled',
    label: '状态',
    search: {
      component: 'Select',
      componentProps: {
        options: ruleStatusOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: {
      width: 88,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: ThreatRule }) => (
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
    label: '操作',
    search: { hidden: true },
    table: {
      width: 260,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: ThreatRule }) => (
          <>
            <BaseButton type="success" onClick={() => openDetail(row)}>
              详情
            </BaseButton>
            <BaseButton type="primary" class="ml-8px" onClick={() => openEdit(row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" class="ml-8px" onClick={() => removeRow(row)}>
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
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
    <div class="mb-10px">
      <BaseButton type="primary" @click="openAdd">新增规则</BaseButton>
      <BaseButton type="primary" class="ml-8px" @click="simulateVisible = true">
        模拟测试
      </BaseButton>
      <BaseButton type="danger" class="ml-8px" @click="batchRemove">批量删除</BaseButton>
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
    <ThreatRuleFormDialog v-model="formVisible" :row="formRow" @success="getList" />
    <ThreatSimulateDialog v-model="simulateVisible" />
    <ThreatRuleDetailDialog v-model="detailVisible" :rule-id="detailRuleId" />
  </ContentWrap>
</template>
