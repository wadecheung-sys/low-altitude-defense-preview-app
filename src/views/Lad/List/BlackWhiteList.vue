<script setup lang="tsx">
import { onMounted, reactive, ref, unref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElDivider, ElLink, ElMessage, ElMessageBox, ElTabPane, ElTabs, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  deleteBlackWhiteApi,
  getBlackWhiteListApi
} from '@/api/lad/list'
import type { BlackWhiteListItem, ListType } from '@/api/lad/list/types'
import BlackWhiteFormDialog from './components/BlackWhiteFormDialog.vue'
import ValidUntilRangeSearch from './components/ValidUntilRangeSearch.vue'
import { targetModelOptions } from '../shared/ladOptionConstants'
import { formatValidUntilDisplay } from '@/api/lad/list/validUntilUtils'

defineOptions({
  name: 'LadBlackWhiteList'
})

const route = useRoute()
const { push } = useRouter()

type ListTab = 'all' | '白名单' | '黑名单'
const queryListType = route.query.listType
const activeListTab = ref<ListTab>(
  queryListType === '白名单' || queryListType === '黑名单' ? queryListType : 'all'
)

const ids = ref<string[]>([])
const searchParams = ref<Recordable>({
  sn: (route.query.sn as string) || undefined,
  targetId: (route.query.targetId as string) || undefined,
  listType: activeListTab.value === 'all' ? undefined : activeListTab.value
})
const formVisible = ref(false)
const formRow = ref<BlackWhiteListItem>()

const targetTypeOptions = [
  { label: '多旋翼', value: '多旋翼' },
  { label: '固定翼', value: '固定翼' },
  { label: '行业级', value: '行业级' },
  { label: '未知', value: '未知' }
]

const setSearchParams = (params: Recordable) => {
  const range = params.validUntilRange as string[] | undefined
  searchParams.value = {
    listType: activeListTab.value === 'all' ? undefined : activeListTab.value,
    targetId: params.targetId,
    sn: params.sn,
    model: params.model,
    targetType: params.targetType,
    validUntilStart: range?.[0] || undefined,
    validUntilEnd: range?.[1] || undefined
  }
  currentPage.value = 1
  getList()
}

const onListTabChange = (name: string | number) => {
  const tab = String(name) as ListTab
  searchParams.value = {
    ...unref(searchParams),
    listType: tab === 'all' ? undefined : tab
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
    search: { hidden: true },
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
      componentProps: {
        placeholder: '融合目标编号'
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
    label: '有效时间',
    minWidth: 180,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: BlackWhiteListItem }) =>
          row.validUntil === '永久' ? (
            <ElTag type="success" size="small">
              永久
            </ElTag>
          ) : (
            <span>{formatValidUntilDisplay(row.validUntil)}</span>
          )
      }
    }
  },
  {
    field: 'model',
    label: '目标型号',
    minWidth: 140,
    search: {
      component: 'Select',
      componentProps: {
        options: targetModelOptions,
        clearable: true,
        filterable: true,
        placeholder: '请选择目标型号'
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
      componentProps: {
        placeholder: '请输入识别码'
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
    field: 'targetType',
    label: '目标类型',
    minWidth: 92,
    search: {
      component: 'Select',
      componentProps: {
        placeholder: '请选择目标类型',
        clearable: true,
        options: targetTypeOptions
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'validUntilRange',
    label: '有效时间',
    search: {
      formItemProps: {
        slots: {
          default: (model: Recordable) => (
            <ValidUntilRangeSearch
              modelValue={model.validUntilRange}
              onUpdate:modelValue={(val) => {
                model.validUntilRange = val
              }}
            />
          )
        }
      }
    },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
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
            <BaseButton type="success" onClick={() => goDetail(data.row)}>
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
  <div class="black-white-list-page">
    <ContentWrap class="black-white-list-page__search">
      <Search
        :schema="allSchemas.searchSchema"
        :model="{ sn: route.query.sn, targetId: route.query.targetId }"
        @search="setSearchParams"
        @reset="setSearchParams"
      />
    </ContentWrap>

    <ContentWrap class="black-white-list-page__data">
      <div class="list-data-section">
        <div class="list-data-section__title">列表数据</div>
        <ElDivider class="list-data-section__divider" />
        <ElTabs
          v-model="activeListTab"
          class="list-data-section__tabs"
          @tab-change="onListTabChange"
        >
          <ElTabPane label="全部" name="all" />
          <ElTabPane label="白名单" name="白名单" />
          <ElTabPane label="黑名单" name="黑名单" />
        </ElTabs>

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
      </div>

      <BlackWhiteFormDialog v-model="formVisible" :row="formRow" @success="onFormSuccess" />
    </ContentWrap>
  </div>
</template>

<style scoped lang="less">
.black-white-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-data-section {
  &__title {
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
    color: var(--el-text-color-primary);
  }

  &__divider {
    margin: 12px 0 0;
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin: 8px 0 16px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--el-border-color-light);
    }

    :deep(.el-tabs__item) {
      height: 40px;
      padding: 0 20px;
      font-size: 14px;
      line-height: 40px;
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
    }
  }
}
</style>
