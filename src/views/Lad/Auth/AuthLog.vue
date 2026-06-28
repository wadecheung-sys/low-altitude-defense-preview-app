<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { getAuthLogListApi } from '@/api/lad/auth'
import type { AuthLogItem } from '@/api/lad/auth/types'
import LogDetailDialog from './components/LogDetailDialog.vue'
import { logResultOptions, logTypeLabel, logTypeOptions } from './authConstants'
import { reactive, ref, unref } from 'vue'
import { ElTag } from 'element-plus'

defineOptions({ name: 'LadAuthLog' })

const searchParams = ref<Recordable>({})
const detailVisible = ref(false)
const detailId = ref<string>()

const setSearchParams = (params: Recordable) => {
  const range = params.createdAtRange as string[] | undefined
  searchParams.value = {
    logType: params.logType,
    operator: params.operator,
    account: params.account,
    module: params.module,
    result: params.result,
    createdAtStart: range?.[0],
    createdAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

const openDetail = (row: AuthLogItem) => {
  detailId.value = row.id
  detailVisible.value = true
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getAuthLogListApi({
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
  { field: 'index', label: '序号', type: 'index', search: { hidden: true } },
  {
    field: 'logType',
    label: '日志类型',
    search: { component: 'Select', componentProps: { options: logTypeOptions, clearable: true } },
    table: {
      width: 100,
      slots: {
        default: (data: { row: AuthLogItem }) => <span>{logTypeLabel[data.row.logType]}</span>
      }
    }
  },
  {
    field: 'operator',
    label: '操作人',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { width: 110 }
  },
  {
    field: 'account',
    label: '账号',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { width: 120 }
  },
  {
    field: 'module',
    label: '功能模块',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { minWidth: 120, showOverflowTooltip: true }
  },
  {
    field: 'action',
    label: '操作动作',
    search: { hidden: true },
    table: { minWidth: 120, showOverflowTooltip: true }
  },
  {
    field: 'ip',
    label: 'IP地址',
    search: { hidden: true },
    table: { width: 130 }
  },
  {
    field: 'result',
    label: '结果',
    search: { component: 'Select', componentProps: { options: logResultOptions, clearable: true } },
    table: {
      width: 80,
      slots: {
        default: (data: { row: AuthLogItem }) => (
          <ElTag type={data.row.result === 'success' ? 'success' : 'danger'}>
            {data.row.result === 'success' ? '成功' : '失败'}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'createdAt',
    label: '操作时间',
    search: { hidden: true },
    table: { width: 170 }
  },
  {
    field: 'createdAtRange',
    label: '操作时间',
    search: {
      component: 'DatePicker',
      componentProps: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: '开始',
        endPlaceholder: '结束'
      }
    },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'actionCol',
    label: '操作',
    search: { hidden: true },
    table: {
      width: 100,
      fixed: 'right',
      slots: {
        default: (data: { row: AuthLogItem }) => (
          <BaseButton type="success" onClick={() => openDetail(data.row)}>
            详情
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
    <LogDetailDialog v-model="detailVisible" :log-id="detailId" />
  </ContentWrap>
</template>
