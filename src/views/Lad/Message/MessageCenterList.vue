<script setup lang="tsx">
import { reactive, ref, unref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteMessageCenterApi, getMessageCenterListApi } from '@/api/lad/message'
import type { MessageCenterItem } from '@/api/lad/message/types'
import {
  MESSAGE_SEARCH_COL,
  MESSAGE_SEARCH_DATE_COL,
  formatMessageOccurredAt,
  messageEventNameOptions
} from './messageConstants'

defineOptions({ name: 'LadMessageCenterList' })

const searchParams = ref<Recordable>({})
const selectedIds = ref<string[]>([])

const setSearchParams = (params: Recordable) => {
  const range = params.occurredAtRange as string[] | undefined
  searchParams.value = {
    eventName: !params.eventName || params.eventName === '全部' ? undefined : params.eventName,
    occurredAtStart: range?.[0],
    occurredAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

function onSelectionChange(rows: MessageCenterItem[]) {
  selectedIds.value = rows.map((row) => row.id)
}

async function batchRemove() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先勾选需要删除的消息')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedIds.value.length} 条消息吗？`,
      '批量删除',
      { type: 'warning' }
    )
  } catch {
    return
  }
  await deleteMessageCenterApi({ ids: [...selectedIds.value] })
  selectedIds.value = []
  ElMessage.success('删除成功')
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getMessageCenterListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

function renderDescription(row: MessageCenterItem) {
  return (
    <span class="message-center-desc">
      {row.descriptionSegments.map((segment, index) =>
        segment.highlight ? (
          <span key={`${row.id}-${index}`} class="message-center-desc__highlight">
            {segment.text}
          </span>
        ) : (
          <span key={`${row.id}-${index}`}>{segment.text}</span>
        )
      )}
    </span>
  )
}

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
    width: '70px',
    search: { hidden: true }
  },
  {
    field: 'eventName',
    label: '事件名称',
    search: {
      component: 'Select',
      colProps: MESSAGE_SEARCH_COL,
      componentProps: {
        options: messageEventNameOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: { minWidth: 140, showOverflowTooltip: true }
  },
  {
    field: 'occurredAt',
    label: '发生时间',
    search: { hidden: true },
    table: {
      width: 180,
      slots: {
        default: ({ row }: { row: MessageCenterItem }) => (
          <span>{formatMessageOccurredAt(row.occurredAt)}</span>
        )
      }
    }
  },
  {
    field: 'description',
    label: '描述',
    search: { hidden: true },
    table: {
      minWidth: 420,
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: MessageCenterItem }) => renderDescription(row)
      }
    }
  },
  {
    field: 'occurredAtRange',
    label: '发生时间',
    search: {
      component: 'DatePicker',
      colProps: MESSAGE_SEARCH_DATE_COL,
      componentProps: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        style: { width: '100%' }
      }
    },
    table: { hidden: true }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)
</script>

<template>
  <ContentWrap>
    <Search
      :schema="allSchemas.searchSchema"
      show-expand
      expand-field="occurredAtRange"
      @search="setSearchParams"
      @reset="setSearchParams"
    />

    <div class="mb-10px">
      <BaseButton type="danger" @click="batchRemove">批量删除</BaseButton>
    </div>

    <Table
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
      @selection-change="onSelectionChange"
    />
  </ContentWrap>
</template>

<style scoped lang="less">
:deep(.message-center-desc__highlight) {
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>
