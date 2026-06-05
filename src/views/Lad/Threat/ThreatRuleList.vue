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
import type { ThreatRule } from '@/api/lad/threat/types'
import ThreatRuleFormDialog from './components/ThreatRuleFormDialog.vue'
import ThreatSimulateDialog from './components/ThreatSimulateDialog.vue'
import ThreatRuleDetailDialog from './components/ThreatRuleDetailDialog.vue'
import { THREAT_SEARCH_COL } from './threatConstants'
import {
  LAD_DICT_THREAT_LEVEL,
  threatLevelForRule,
  threatLevelTagTypeForRule
} from '../shared/ladDictHelpers'
import { useLadDictOptions } from '../shared/useLadDictOptions'
import {
  conditionPropertyOptions,
  ruleStatusOptions,
  targetTypeOptions
} from '../shared/ladOptionConstants'

defineOptions({ name: 'LadThreatRuleList' })

const { entries: threatLevelEntries } = useLadDictOptions(LAD_DICT_THREAT_LEVEL)

const threatLevelFilterOptions = computed(() => [
  { label: '全部', value: '全部' },
  ...threatLevelEntries.value.map((item) => ({ label: item.label, value: item.label }))
])

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
    ruleCode: params.ruleCode,
    ruleName: params.ruleName,
    threatLevel: params.threatLevel === '全部' ? undefined : params.threatLevel,
    targetType: params.targetType === '全部' ? undefined : params.targetType,
    status: !params.status || params.status === '全部' ? undefined : params.status,
    targetProperty: params.targetProperty,
    updatedBy: params.updatedBy
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
    field: 'ruleCode',
    label: '规则编号',
    search: {
      component: 'Input',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入规则编号',
        style: searchFieldStyle
      }
    },
    table: { minWidth: 128, showOverflowTooltip: true }
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
          <ElLink type="primary" underline={false} onClick={() => openDetail(row)}>
            {row.ruleName}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'targetType',
    label: '目标类型',
    search: {
      component: 'Select',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        options: targetTypeOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: { width: 110, showOverflowTooltip: true }
  },
  {
    field: 'conditionSummary',
    label: '判级条件',
    search: { hidden: true },
    table: { minWidth: 260, showOverflowTooltip: true }
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
    field: 'status',
    label: '状态',
    search: {
      component: 'Select',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        options: ruleStatusOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: { hidden: true }
  },
  {
    field: 'targetProperty',
    label: '目标属性',
    search: {
      component: 'Select',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        options: conditionPropertyOptions,
        clearable: true,
        placeholder: '请选择目标属性',
        style: searchFieldStyle
      }
    },
    table: { hidden: true }
  },
  {
    field: 'updatedBy',
    label: '修改人',
    search: {
      component: 'Input',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入修改人',
        style: searchFieldStyle
      }
    },
    table: { width: 96, showOverflowTooltip: true }
  },
  {
    field: 'updatedAt',
    label: '修改时间',
    search: { hidden: true },
    table: { width: 168, showOverflowTooltip: true }
  },
  {
    field: 'enabled',
    label: '启停',
    search: { hidden: true },
    table: {
      width: 88,
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
            <BaseButton type="primary" onClick={() => openDetail(row)}>
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
