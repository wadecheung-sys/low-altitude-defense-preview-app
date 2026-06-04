<script setup lang="tsx">
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
import { THREAT_SEARCH_COL, UI } from './threatConstants'
import {
  areaRegionTypeDisplay,
  dictEntriesToOptions,
  LAD_DICT_AREA_REGION_TYPE,
  LAD_DICT_THREAT_LEVEL,
  threatLevelForRule,
  threatLevelTagTypeForRule
} from '../shared/ladDictHelpers'
import { useLadDictOptions } from '../shared/useLadDictOptions'
import { conditionPropertyOptions, ruleStatusOptions, targetTypeOptions } from '../shared/ladOptionConstants'
import { computed, reactive, ref, unref } from 'vue'
import { ElLink, ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'

defineOptions({ name: 'LadThreatRuleList' })

const { entries: areaTypeEntries } = useLadDictOptions(LAD_DICT_AREA_REGION_TYPE)
const { entries: threatLevelEntries } = useLadDictOptions(LAD_DICT_THREAT_LEVEL)

const areaRegionTypeOptions = computed(() => dictEntriesToOptions(areaTypeEntries.value, true))
const threatLevelFilterOptions = computed(() => [
  { label: '全部', value: '全部' },
  ...dictEntriesToOptions(threatLevelEntries.value)
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
    areaRegionType: params.areaRegionType === '全部' ? undefined : params.areaRegionType,
    threatLevel: params.threatLevel === '全部' ? undefined : params.threatLevel,
    targetType: params.targetType === '全部' ? undefined : params.targetType,
    status: !params.status || params.status === '全部' ? undefined : params.status,
    targetProperty: params.targetProperty,
    updatedBy: params.updatedBy
  }
  currentPage.value = 1
  getList()
}

function onSelectionChange(rows: ThreatRule[]) {
  selectedIds.value = rows.map((r) => r.id)
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
      UI.btnBatchDelete,
      { type: 'warning' }
    )
  } catch {
    return
  }
  await deleteThreatRuleApi({ ids: [...selectedIds.value] })
  selectedIds.value = []
  ElMessage.success(UI.deleteOk)
  getList()
}

async function removeRow(row: ThreatRule) {
  try {
    await ElMessageBox.confirm(`确认删除规则「${row.ruleName}」吗？`, UI.btnDelete, {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteThreatRuleApi({ ids: [row.id] })
  ElMessage.success(UI.deleteOk)
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
    label: UI.ruleCode,
    search: {
      component: 'Input',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入规则编号',
        style: searchFieldStyle
      }
    },
    table: { minWidth: 110, showOverflowTooltip: true }
  },
  {
    field: 'ruleName',
    label: UI.ruleName,
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
      minWidth: 150,
      showOverflowTooltip: true,
      slots: {
        default: (data: { row: ThreatRule }) => (
          <ElLink type="primary" underline={false} onClick={() => openDetail(data.row)}>
            {data.row.ruleName}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'threatLevel',
    label: UI.threatLevel,
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
        default: ({ row }: { row: ThreatRule }) => {
          const label = threatLevelForRule(row)
          return (
            <ElTag type={threatLevelTagTypeForRule(row)} size="small" effect="light">
              {label}
            </ElTag>
          )
        }
      }
    }
  },
  {
    field: 'areaRegionType',
    label: UI.areaRegionType,
    search: {
      component: 'Select',
      colProps: THREAT_SEARCH_COL,
      componentProps: {
        options: areaRegionTypeOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    },
    table: {
      width: 120,
      showOverflowTooltip: true,
      slots: {
        default: (data: { row: ThreatRule }) =>
          areaRegionTypeDisplay(data.row.areaRegionType, areaTypeEntries.value)
      }
    }
  },
  {
    field: 'targetType',
    label: UI.targetType,
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
    table: { width: 96, showOverflowTooltip: true }
  },
  {
    field: 'conditionSummary',
    label: UI.conditions,
    search: { hidden: true },
    table: { minWidth: 180, showOverflowTooltip: true }
  },
  {
    field: 'planName',
    label: UI.triggerPlan,
    search: { hidden: true },
    table: { minWidth: 120, showOverflowTooltip: true }
  },
  {
    field: 'priority',
    label: UI.priority,
    search: { hidden: true },
    table: { width: 72, align: 'center' }
  },
  {
    field: 'status',
    label: UI.status,
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
    label: UI.targetProperty,
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
    label: UI.updatedBy,
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
    label: UI.enabled,
    search: { hidden: true },
    table: {
      width: 88,
      slots: {
        default: (data: { row: ThreatRule }) => (
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
    field: 'action',
    label: UI.action,
    search: { hidden: true },
    table: {
      width: 260,
      fixed: 'right',
      slots: {
        default: (data: { row: ThreatRule }) => (
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
      <BaseButton type="primary" class="ml-8px" @click="simulateVisible = true">
        {{ UI.btnSimulate }}
      </BaseButton>
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
    <ThreatRuleFormDialog v-model="formVisible" :row="formRow" @success="getList" />
    <ThreatSimulateDialog v-model="simulateVisible" />
    <ThreatRuleDetailDialog v-model="detailVisible" :rule-id="detailRuleId" />
  </ContentWrap>
</template>
