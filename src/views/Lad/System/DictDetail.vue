<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteDictEntryApi, getDictEntryListApi } from '@/api/lad/system'
import type { DictEntryItem, DictTypeItem } from '@/api/lad/system/types'
import DictItemFormDialog from './components/DictItemFormDialog.vue'
import { computed, onMounted, reactive, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElDescriptions, ElDescriptionsItem, ElMessage, ElMessageBox } from 'element-plus'

defineOptions({ name: 'LadSystemDictDetail' })

const route = useRoute()
const { push } = useRouter()
const dictTypeId = computed(() => route.params.id as string)

const dictType = ref<DictTypeItem | null>(null)
const searchParams = ref<Recordable>({})
const formVisible = ref(false)
const formRow = ref<DictEntryItem>()
const ids = ref<string[]>([])

const setSearchParams = (params: Recordable) => {
  searchParams.value = { label: params.label }
  currentPage.value = 1
  getList()
}

const openAdd = () => {
  formRow.value = undefined
  formVisible.value = true
}

const openEdit = (row: DictEntryItem) => {
  formRow.value = row
  formVisible.value = true
}

const goBack = () => push('/lad/system/dict/list')

const onSelectionChange = (rows: DictEntryItem[]) => {
  ids.value = rows.map((r) => r.id)
}

async function batchDelete() {
  if (!ids.value.length) {
    ElMessage.warning('请先勾选字典项')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.value.length} 条字典项吗？`, '批量删除', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDictEntryApi({ ids: ids.value })
  ElMessage.success('已删除')
  ids.value = []
  getList()
}

async function onDeleteOne(row: DictEntryItem) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.label}」吗？`, '删除字典项', { type: 'warning' })
  } catch {
    return
  }
  await deleteDictEntryApi({ ids: [row.id] })
  ElMessage.success('已删除')
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getDictEntryListApi({
      dictTypeId: dictTypeId.value,
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    dictType.value = res.data.dictType
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

watch(dictTypeId, () => {
  currentPage.value = 1
  getList()
})

onMounted(() => getList())

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
    field: 'label',
    label: '显示标签',
    search: {
      component: 'Input',
      componentProps: { placeholder: '标签或字典值', clearable: true }
    },
    table: { minWidth: 120 }
  },
  {
    field: 'value',
    label: '字典值',
    search: { hidden: true },
    table: { minWidth: 120, showOverflowTooltip: true }
  },
  {
    field: 'sort',
    label: '排序',
    search: { hidden: true },
    table: { width: 80, align: 'center' }
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
      width: 180,
      fixed: 'right',
      slots: {
        default: (data: { row: DictEntryItem }) => (
          <>
            <BaseButton type="primary" onClick={() => openEdit(data.row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" class="ml-8px" onClick={() => onDeleteOne(data.row)}>
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
    <div class="lad-dict-detail__head">
      <BaseButton @click="goBack">返回列表</BaseButton>
      <ElDescriptions v-if="dictType" :column="2" border class="lad-dict-detail__desc">
        <ElDescriptionsItem label="字典编码">{{ dictType.dictCode }}</ElDescriptionsItem>
        <ElDescriptionsItem label="字典名称">{{ dictType.dictName }}</ElDescriptionsItem>
        <ElDescriptionsItem v-if="dictType.remark" label="备注" :span="2">
          {{ dictType.remark }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams">
      <template #action>
        <BaseButton type="primary" @click="openAdd">新增字典项</BaseButton>
        <BaseButton type="danger" class="ml-12px" @click="batchDelete">批量删除</BaseButton>
      </template>
    </Search>
    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
      @selection-change="onSelectionChange"
    />
    <DictItemFormDialog
      v-model="formVisible"
      :dict-type-id="dictTypeId"
      :row="formRow"
      @success="getList"
    />
  </ContentWrap>
</template>

<style scoped>
.lad-dict-detail__head {
  margin-bottom: 16px;
}
.lad-dict-detail__desc {
  margin-top: 12px;
}
</style>
