<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteDictTypeApi, getDictTypeListApi } from '@/api/lad/system'
import type { DictTypeItem } from '@/api/lad/system/types'
import DictTypeFormDialog from './components/DictTypeFormDialog.vue'
import { reactive, ref, unref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({ name: 'LadSystemDictList' })

const { push } = useRouter()
const searchParams = ref<Recordable>({})
const formVisible = ref(false)
const formRow = ref<DictTypeItem>()

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    dictCode: params.dictCode,
    dictName: params.dictName
  }
  currentPage.value = 1
  getList()
}

const openAdd = () => {
  formRow.value = undefined
  formVisible.value = true
}

const openEdit = (row: DictTypeItem) => {
  formRow.value = row
  formVisible.value = true
}

const goEntries = (row: DictTypeItem) => {
  push(`/lad/system/dict/detail/${row.id}`)
}

async function onDelete(row: DictTypeItem) {
  try {
    await ElMessageBox.confirm(`确认删除字典「${row.dictName}」及其全部字典项吗？`, '删除字典', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDictTypeApi({ id: row.id })
  ElMessage.success('已删除')
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getDictTypeListApi({
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
    field: 'index',
    label: '序号',
    type: 'index',
    search: { hidden: true }
  },
  {
    field: 'dictCode',
    label: '字典编码',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { minWidth: 140, showOverflowTooltip: true }
  },
  {
    field: 'dictName',
    label: '字典名称',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { minWidth: 140, showOverflowTooltip: true }
  },
  {
    field: 'itemCount',
    label: '条目数',
    search: { hidden: true },
    table: { width: 90, align: 'center' }
  },
  {
    field: 'remark',
    label: '备注',
    search: { hidden: true },
    table: { minWidth: 120, showOverflowTooltip: true }
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
      width: 260,
      fixed: 'right',
      slots: {
        default: (data: { row: DictTypeItem }) => (
          <>
            <BaseButton type="primary" onClick={() => goEntries(data.row)}>
              字典项
            </BaseButton>
            <BaseButton type="primary" class="ml-8px" onClick={() => openEdit(data.row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" class="ml-8px" onClick={() => onDelete(data.row)}>
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
    <div class="lad-dict-list__toolbar">
      <BaseButton type="primary" @click="openAdd">新增</BaseButton>
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
    <DictTypeFormDialog v-model="formVisible" :row="formRow" @success="getList" />
  </ContentWrap>
</template>

<style scoped lang="less">
.lad-dict-list__toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 0 0 12px;
}
</style>
