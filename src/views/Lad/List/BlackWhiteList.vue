<script setup lang="tsx">
import { computed, onMounted, reactive, ref, unref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElDivider, ElLink, ElMessage, ElMessageBox, ElTabPane, ElTabs, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteBlackWhiteApi, getBlackWhiteListApi } from '@/api/lad/list'
import {
  displayManagedListType,
  displayResolvableSn,
  type ManagedListType
} from '@/api/lad/list/listTargetKind'
import type { BlackWhiteListItem } from '@/api/lad/list/types'
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

const searchParams = ref<Recordable>({
  sn: (route.query.sn as string) || undefined,
  targetId: (route.query.targetId as string) || undefined,
  listType: activeListTab.value === 'all' ? undefined : activeListTab.value
})
const formVisible = ref(false)
const formRow = ref<BlackWhiteListItem>()

const setSearchParams = (params: Recordable) => {
  const range = params.validUntilRange as string[] | undefined
  searchParams.value = {
    listType: activeListTab.value === 'all' ? undefined : activeListTab.value,
    targetId: params.targetId,
    sn: params.sn,
    model: params.model,
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

const listTypeTag = (type: ManagedListType) => {
  const map: Record<ManagedListType, 'danger' | 'success'> = {
    黑名单: 'danger',
    白名单: 'success'
  }
  return map[type]
}

const goDetail = (row: BlackWhiteListItem) => {
  push({
    name: 'LadBlackWhiteTargetDetail',
    params: { id: row.id }
  })
}

const tryOpenDetailFromQuery = () => {
  const openDetail = route.query.openDetail === '1'
  const hasQuery = Boolean(route.query.targetId || route.query.sn)
  if (!openDetail && !hasQuery) return
  if (dataList.value.length >= 1) {
    goDetail(dataList.value[0])
  }
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
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList, getElTableExpose } = tableMethods

onMounted(async () => {
  await getList()
  tryOpenDetailFromQuery()
})

const removeLoading = ref(false)

const removeListLabel = (listType: ManagedListType) =>
  listType === '黑名单' ? '移出黑名单' : '移出白名单'

const removeButtonType = (listType: ManagedListType) =>
  listType === '黑名单' ? 'danger' : 'warning'

const removeFromList = async (row: BlackWhiteListItem | null, listType: ManagedListType) => {
  const elTableExpose = await getElTableExpose()
  const selected = elTableExpose?.getSelectionRows() as BlackWhiteListItem[] | undefined
  const targetRows = row ? [row] : selected || []
  const removeIds = targetRows.filter((item) => item.listType === listType).map((item) => item.id)

  if (!targetRows.length) {
    ElMessage.warning(`请先勾选要${removeListLabel(listType)}的记录`)
    return
  }
  if (!removeIds.length) {
    ElMessage.warning(`所选记录中没有${listType}设备`)
    return
  }
  if (!row && removeIds.length !== targetRows.length) {
    ElMessage.warning(`请仅勾选${listType}记录后再批量${removeListLabel(listType)}`)
    return
  }

  try {
    await ElMessageBox.confirm(
      row
        ? `确定将识别码「${row.sn}」${removeListLabel(listType)}吗？移出后该设备将不再按${listType}规则处置。`
        : `确定将已选 ${removeIds.length} 条${listType}记录${removeListLabel(listType)}吗？`,
      removeListLabel(listType),
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    removeLoading.value = true
    await deleteBlackWhiteApi(removeIds)
    ElMessage.success(`${removeListLabel(listType)}成功`)
    await getList()
    elTableExpose?.clearSelection()
  } catch {
    // 用户取消
  } finally {
    removeLoading.value = false
  }
}

const batchRemoveListType = computed<ManagedListType | null>(() => {
  if (activeListTab.value === '黑名单') return '黑名单'
  if (activeListTab.value === '白名单') return '白名单'
  return null
})

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
          <ElTag type={listTypeTag(displayManagedListType(row.listType))} size="small" effect="light">
            {displayManagedListType(row.listType)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'historyTargetType',
    label: '目标类型',
    search: { hidden: true },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
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
          <ElLink type="primary" underline={false} title="查看无人机详情" onClick={() => goDetail(row)}>
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
        default: ({ row }: { row: BlackWhiteListItem }) => (
          <span>{displayResolvableSn(row.sn)}</span>
        )
      }
    }
  },
  {
    field: 'targetType',
    label: '目标属性',
    search: { hidden: true },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
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
    width: '320px',
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
            <BaseButton
              type={removeButtonType(displayManagedListType(data.row.listType))}
              onClick={() => removeFromList(data.row, displayManagedListType(data.row.listType))}
            >
              {removeListLabel(displayManagedListType(data.row.listType))}
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
          <BaseButton
            v-if="batchRemoveListType"
            :loading="removeLoading"
            :type="batchRemoveListType === '黑名单' ? 'danger' : 'warning'"
            @click="removeFromList(null, batchRemoveListType)"
          >
            批量{{ batchRemoveListType === '黑名单' ? '移出黑名单' : '移出白名单' }}
          </BaseButton>
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
