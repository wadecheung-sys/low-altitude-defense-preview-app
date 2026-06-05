<script setup lang="tsx">
import { reactive, ref, unref } from 'vue'
import { ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { getSystemParamListApi } from '@/api/lad/system'
import type { ParamGroup, SystemParam } from '@/api/lad/system/types'
import SystemParamEditDialog from './components/SystemParamEditDialog.vue'

defineOptions({ name: 'LadSystemParams' })

const searchParams = ref<Recordable>({})
const editVisible = ref(false)
const editRow = ref<SystemParam>()

const groupOptions = [
  { label: '系统', value: '系统' },
  { label: '地图', value: '地图' },
  { label: '数据', value: '数据' }
] satisfies Array<{ label: string; value: ParamGroup }>

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    keyword: params.keyword,
    group: params.group as ParamGroup | undefined
  }
  currentPage.value = 1
  getList()
}

const openEdit = (row: SystemParam) => {
  editRow.value = row
  editVisible.value = true
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
    field: 'keyword',
    label: '关键词',
    search: {
      component: 'Input',
      componentProps: { placeholder: '参数名称 / 参数值' }
    },
    table: { hidden: true }
  },
  {
    field: 'group',
    label: '分组',
    search: {
      component: 'Select',
      componentProps: { options: groupOptions, clearable: true }
    },
    table: { width: 110 }
  },
  {
    field: 'paramName',
    label: '参数名称',
    search: { hidden: true },
    table: { minWidth: 180, showOverflowTooltip: true }
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
          return <span>{String(value)}</span>
        }
      }
    }
  },
  {
    field: 'remark',
    label: '备注',
    search: { hidden: true },
    table: { minWidth: 180, showOverflowTooltip: true }
  },
  {
    field: 'updatedAt',
    label: '更新时间',
    search: { hidden: true },
    table: { width: 170 }
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
