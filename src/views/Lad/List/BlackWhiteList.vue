<script setup lang="tsx">
import { onMounted, reactive, ref, unref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  deleteBlackWhiteApi,
  getBlackWhiteListApi,
  updateBlackWhiteListTypeApi
} from '@/api/lad/list'
import type { BlackWhiteListItem, ListType } from '@/api/lad/list/types'
import BlackWhiteFormDialog from './components/BlackWhiteFormDialog.vue'

defineOptions({
  name: 'LadBlackWhiteList'
})

const route = useRoute()
const { push } = useRouter()

const ids = ref<string[]>([])
const searchParams = ref<Recordable>({
  sn: (route.query.sn as string) || undefined,
  targetId: (route.query.targetId as string) || undefined
})
const formVisible = ref(false)
const formRow = ref<BlackWhiteListItem>()

const listTypeOptions = [
  { label: '黑名单', value: '黑名单' },
  { label: '白名单', value: '白名单' },
  { label: '未知', value: '未知' }
]

const targetTypeOptions = [
  { label: '多旋翼', value: '多旋翼' },
  { label: '固定翼', value: '固定翼' },
  { label: '行业级', value: '行业级' },
  { label: '未知', value: '未知' }
]

const setSearchParams = (params: Recordable) => {
  const range = params.discoveredAtRange as string[] | undefined
  searchParams.value = {
    listType: params.listType,
    targetId: params.targetId,
    sn: params.sn,
    model: params.model,
    targetType: params.targetType,
    discoveredAtStart: range?.[0],
    discoveredAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

const listTypeTag = (type: ListType) => {
  const map: Record<ListType, 'danger' | 'success' | 'info'> = {
    黑名单: 'danger',
    白名单: 'success',
    未知: 'info'
  }
  return map[type]
}

const goDetail = (row: BlackWhiteListItem) => {
  push(`/lad/list/target/${row.id}`)
}

const openAdd = () => {
  formRow.value = undefined
  formVisible.value = true
}

const openEdit = (row: BlackWhiteListItem) => {
  formRow.value = row
  formVisible.value = true
}

const onFormSuccess = () => {
  ElMessage.success('保存成功')
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getBlackWhiteListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return {
      list: res.data.list,
      total: res.data.total
    }
  },
  fetchDelApi: async () => {
    const res = await deleteBlackWhiteApi(unref(ids))
    return !!res
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList, getElTableExpose, delList } = tableMethods

onMounted(() => {
  getList()
})

const delLoading = ref(false)
const listTypeLoading = ref(false)

const updateSelectedListType = async (listType: '黑名单' | '白名单') => {
  const elTableExpose = await getElTableExpose()
  const selected = elTableExpose?.getSelectionRows() as BlackWhiteListItem[] | undefined
  if (!selected?.length) {
    ElMessage.warning(`请先勾选要添加到${listType}的记录`)
    return
  }

  listTypeLoading.value = true
  try {
    await Promise.all(selected.map((row) => updateBlackWhiteListTypeApi({ id: row.id, listType })))
    ElMessage.success(`已将选中的 ${selected.length} 条记录更新为${listType}`)
    await getList()
    elTableExpose?.clearSelection()
  } finally {
    listTypeLoading.value = false
  }
}

const delData = async (row: BlackWhiteListItem | null) => {
  const elTableExpose = await getElTableExpose()
  const selected = elTableExpose?.getSelectionRows() as BlackWhiteListItem[] | undefined
  const deleteIds = row ? [row.id] : selected?.map((r) => r.id) || []
  if (!deleteIds.length) {
    ElMessage.warning('请先勾选要删除的记录')
    return
  }
  try {
    await ElMessageBox.confirm(
      row
        ? `确定删除识别码「${row.sn}」的名单记录吗？`
        : `确定批量删除已选 ${deleteIds.length} 条记录吗？`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    ids.value = deleteIds
    delLoading.value = true
    await delList(unref(ids).length).finally(() => {
      delLoading.value = false
    })
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'selection',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: { type: 'selection' }
  },
  {
    field: 'index',
    label: '序号',
    type: 'index',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'listType',
    label: '名单类型',
    minWidth: 96,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择名单类型',
        style: { width: '100%' },
        clearable: true,
        options: listTypeOptions
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: BlackWhiteListItem }) => (
          <ElTag type={listTypeTag(row.listType)} size="small" effect="light">
            {row.listType}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'targetId',
    label: '目标ID',
    minWidth: 138,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '融合目标编号',
        style: { width: '100%' }
      }
    },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: BlackWhiteListItem }) => (
          <ElLink type="primary" underline={false} onClick={() => goDetail(row)}>
            {row.targetId}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'validUntil',
    label: '有效期至',
    minWidth: 160,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: BlackWhiteListItem }) =>
          row.validUntil === '永久' ? (
            <ElTag type="success" size="small">
              永久
            </ElTag>
          ) : (
            <span>{row.validUntil}</span>
          )
      }
    }
  },
  {
    field: 'model',
    label: '机型/型号',
    minWidth: 140,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请输入机型/型号',
        style: { width: '100%' }
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'frequency',
    label: '频段/频率',
    minWidth: 120,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'sn',
    label: '识别码',
    minWidth: 130,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请输入识别码',
        style: { width: '100%' }
      }
    },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: BlackWhiteListItem }) =>
          row.sn === '未解析' ? (
            <span class="text-[var(--el-text-color-secondary)]">未解析</span>
          ) : (
            <span>{row.sn}</span>
          )
      }
    }
  },
  {
    field: 'discoveredAtRange',
    label: '发现时间',
    search: {
      component: 'DatePicker',
      colProps: { span: 8 },
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        style: { width: '100%' }
      }
    },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'targetType',
    label: '目标类型',
    minWidth: 92,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择目标类型',
        style: { width: '100%' },
        clearable: true,
        options: targetTypeOptions
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'zoneName',
    search: { hidden: true },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'longitude',
    search: { hidden: true },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'latitude',
    search: { hidden: true },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'entryMethod',
    search: { hidden: true },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'remark',
    label: '备注',
    minWidth: 120,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'action',
    width: '300px',
    label: '操作',
    fixed: 'right',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: {
      slots: {
        default: (data: { row: BlackWhiteListItem }) => (
          <>
            <BaseButton type="primary" onClick={() => goDetail(data.row)}>
              详情
            </BaseButton>
            <BaseButton type="primary" onClick={() => openEdit(data.row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" onClick={() => delData(data.row)}>
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
      :model="{ sn: route.query.sn, targetId: route.query.targetId }"
      is-col
      label-width="100px"
      :expand-rows="2"
      :expand-default="false"
      @search="setSearchParams"
      @reset="setSearchParams"
    />

    <div class="mb-10px">
      <BaseButton type="primary" @click="openAdd">新增</BaseButton>
      <BaseButton
        type="danger"
        :loading="listTypeLoading"
        @click="updateSelectedListType('黑名单')"
      >
        添加至黑名单
      </BaseButton>
      <BaseButton
        type="success"
        :loading="listTypeLoading"
        @click="updateSelectedListType('白名单')"
      >
        添加至白名单
      </BaseButton>
      <BaseButton :loading="delLoading" type="danger" @click="delData(null)">批量删除</BaseButton>
    </div>

    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      :scrollbar-always-on="true"
      @register="tableRegister"
    />

    <BlackWhiteFormDialog v-model="formVisible" :row="formRow" @success="onFormSuccess" />
  </ContentWrap>
</template>
