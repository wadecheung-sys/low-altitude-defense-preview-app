<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteBlackWhiteApi, getBlackWhiteListApi } from '@/api/lad/list'
import type { BlackWhiteListItem, ListType } from '@/api/lad/list/types'
import BlackWhiteFormDialog from './components/BlackWhiteFormDialog.vue'
import { onMounted, reactive, ref, unref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus'

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

const zoneOptions = [
  { label: '核心保护区-A区', value: '核心保护区-A区' },
  { label: '缓冲区-B区', value: '缓冲区-B区' },
  { label: '管制空域-C区', value: '管制空域-C区' },
  { label: '公共区域', value: '公共区域' }
]

const entryMethodOptions = [
  { label: '自动录入', value: '自动录入' },
  { label: '人工录入', value: '人工录入' },
  { label: '自动+人工校验', value: '自动+人工校验' }
]

const setSearchParams = (params: Recordable) => {
  const range = params.discoveredAtRange as string[] | undefined
  searchParams.value = {
    listType: params.listType,
    targetId: params.targetId,
    sn: params.sn,
    model: params.model,
    targetType: params.targetType,
    zoneName: params.zoneName,
    entryMethod: params.entryMethod,
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
        ? `确定删除 SN「${row.sn}」的名单记录？`
        : `确定批量删除已选 ${deleteIds.length} 条记录？`,
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
    /* 用户取消 */
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
    minWidth: 108,
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
    field: 'discoveredAt',
    label: '发现时间',
    minWidth: 168,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'updatedAt',
    label: '最后更新时间',
    minWidth: 168,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'duration',
    label: '持续时长',
    minWidth: 96,
    search: { hidden: true }
  },
  {
    field: 'model',
    label: '机型/型号',
    minWidth: 128,
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
    label: 'SN码/ID码',
    minWidth: 130,
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请输入 SN 码',
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
    label: '所在区域',
    minWidth: 130,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择区域',
        style: { width: '100%' },
        clearable: true,
        options: zoneOptions
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'longitude',
    label: '经度',
    minWidth: 100,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: BlackWhiteListItem }) => <span>{row.longitude.toFixed(4)}</span>
      }
    }
  },
  {
    field: 'latitude',
    label: '纬度',
    minWidth: 100,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: BlackWhiteListItem }) => <span>{row.latitude.toFixed(4)}</span>
      }
    }
  },
  {
    field: 'entryMethod',
    label: '录入方式',
    minWidth: 128,
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        placeholder: '请选择录入方式',
        style: { width: '100%' },
        clearable: true,
        options: entryMethodOptions
      }
    },
    table: { showOverflowTooltip: true }
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
            <BaseButton type="primary" onClick={() => openEdit(data.row)}>
              编辑
            </BaseButton>
            <BaseButton type="success" onClick={() => goDetail(data.row)}>
              详情
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
