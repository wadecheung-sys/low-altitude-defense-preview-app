<script setup lang="tsx">
import { reactive, ref, unref } from 'vue'
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { getSystemParamListApi, restoreSystemParamDefaultsApi } from '@/api/lad/system'
import type { ParamValueType, SystemParam } from '@/api/lad/system/types'
import SystemParamEditDialog from './components/SystemParamEditDialog.vue'
import { allOption } from '../shared/ladOptionConstants'

defineOptions({ name: 'LadSystemParams' })

const PARAM_SEARCH_COL = { span: 6 } as const
const PARAM_SEARCH_DATE_COL = { span: 6 } as const

const paramValueTypeFilterOptions = [
  allOption,
  { label: '文本', value: 'string' },
  { label: '数值', value: 'number' },
  { label: '布尔', value: 'boolean' }
]

const paramValueTypeLabelMap: Record<ParamValueType, string> = {
  string: '文本',
  number: '数值',
  boolean: '布尔'
}

const searchParams = ref<Recordable>({})
const editVisible = ref(false)
const editRow = ref<SystemParam>()
const restoreLoading = ref(false)

const setSearchParams = (params: Recordable) => {
  const range = params.updatedAtRange as string[] | undefined
  const valueType = params.valueType as ParamValueType | '全部' | undefined
  searchParams.value = {
    paramName: params.paramName?.trim() || undefined,
    valueType: !valueType || valueType === '全部' ? undefined : valueType,
    remark: params.remark?.trim() || undefined,
    updatedAtStart: range?.[0],
    updatedAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

const openEdit = (row: SystemParam) => {
  editRow.value = row
  editVisible.value = true
}

async function restoreDefaults() {
  await ElMessageBox.confirm('确认将所有参数恢复为系统初始值吗？当前修改将被覆盖。', '恢复初始值', {
    type: 'warning'
  })
  restoreLoading.value = true
  try {
    await restoreSystemParamDefaultsApi()
    ElMessage.success('已恢复初始值')
    getList()
  } finally {
    restoreLoading.value = false
  }
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getSystemParamListApi({
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
    form: { hidden: true },
    table: { type: 'selection' }
  },
  {
    field: 'index',
    label: '序号',
    type: 'index',
    search: { hidden: true },
    form: { hidden: true }
  },
  {
    field: 'paramName',
    label: '参数名称',
    search: {
      component: 'Input',
      colProps: PARAM_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入参数名称',
        style: { width: '100%' }
      }
    },
    table: { minWidth: 180, showOverflowTooltip: true }
  },
  {
    field: 'valueType',
    label: '参数类型',
    search: {
      component: 'Select',
      colProps: PARAM_SEARCH_COL,
      componentProps: {
        options: paramValueTypeFilterOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: {
      width: 100,
      slots: {
        default: ({ row }: { row: SystemParam }) => (
          <span>{paramValueTypeLabelMap[row.valueType] || row.valueType}</span>
        )
      }
    }
  },
  {
    field: 'paramValue',
    label: '参数值',
    search: { hidden: true },
    table: {
      minWidth: 160,
      slots: {
        default: ({ row }: { row: SystemParam }) => {
          const value = row.paramValue
          if (row.valueType === 'boolean') {
            return <ElTag type={value ? 'success' : 'info'}>{value ? '是' : '否'}</ElTag>
          }
          if (value === '' || value === null || value === undefined) {
            return <span class="text-[var(--el-text-color-secondary)]">—</span>
          }
          return <span>{String(value)}</span>
        }
      }
    }
  },
  {
    field: 'remark',
    label: '描述',
    search: {
      component: 'Input',
      colProps: PARAM_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入描述关键词',
        style: { width: '100%' }
      }
    },
    table: { minWidth: 180, showOverflowTooltip: true }
  },
  {
    field: 'updatedAt',
    label: '更新时间',
    search: { hidden: true },
    table: { width: 170 }
  },
  {
    field: 'updatedAtRange',
    label: '更新时间',
    search: {
      component: 'DatePicker',
      colProps: PARAM_SEARCH_DATE_COL,
      componentProps: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        style: { width: '100%' }
      }
    },
    table: { hidden: true }
  },
  {
    field: 'action',
    label: '操作',
    search: { hidden: true },
    table: {
      width: 100,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: SystemParam }) => (
          <BaseButton type="primary" onClick={() => openEdit(row)}>
            编辑
          </BaseButton>
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
      <BaseButton :loading="restoreLoading" @click="restoreDefaults">恢复初始值</BaseButton>
    </div>
    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
    />
    <SystemParamEditDialog v-model="editVisible" :row="editRow" @success="getList" />
  </ContentWrap>
</template>
