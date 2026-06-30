<script setup lang="tsx">
import { computed, reactive, ref, unref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import type { FormSchema } from '@/components/Form'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteMessageCenterApi, getMessageCenterListApi } from '@/api/lad/message'
import type { EventAttributeEventType, EventOwnership } from '@/api/lad/system/types'
import type { MessageCenterItem } from '@/api/lad/message/types'
import {
  MESSAGE_SEARCH_COL,
  MESSAGE_SEARCH_DATE_COL,
  formatMessagePushedAt,
  getEventTypeSearchOptions,
  messageEventNameOptions,
  messageOwnershipOptions
} from './messageConstants'

defineOptions({ name: 'LadMessageCenterList' })

type SearchExpose = {
  setValues: (data: Recordable) => Promise<void>
}

const searchParams = ref<Recordable>({})
const selectedIds = ref<string[]>([])
const searchOwnership = ref<EventOwnership | undefined>()
const searchExpose = ref<SearchExpose>()

const searchEventTypeOptions = computed(() => getEventTypeSearchOptions(searchOwnership.value))

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'eventId',
    label: '事件ID',
    component: 'Input',
    colProps: MESSAGE_SEARCH_COL,
    componentProps: {
      clearable: true,
      placeholder: '请输入事件ID'
    }
  },
  {
    field: 'eventName',
    label: '事件名称',
    component: 'Select',
    colProps: MESSAGE_SEARCH_COL,
    componentProps: {
      options: messageEventNameOptions,
      clearable: true,
      filterable: true,
      placeholder: '全部'
    }
  },
  {
    field: 'eventOwnership',
    label: '事件归属',
    component: 'Select',
    colProps: MESSAGE_SEARCH_COL,
    componentProps: {
      options: messageOwnershipOptions,
      clearable: true,
      placeholder: '全部',
      onChange: (value: EventOwnership | undefined) => {
        searchOwnership.value = value
        searchExpose.value?.setValues({ eventType: undefined })
      }
    }
  },
  {
    field: 'eventType',
    label: '事件类型',
    component: 'Select',
    colProps: MESSAGE_SEARCH_COL,
    componentProps: {
      options: searchEventTypeOptions.value,
      clearable: true,
      filterable: true,
      placeholder: searchOwnership.value ? '请选择事件类型' : '全部类型'
    }
  },
  {
    field: 'description',
    label: '消息描述',
    component: 'Input',
    colProps: MESSAGE_SEARCH_COL,
    componentProps: {
      clearable: true,
      placeholder: '请输入描述关键词'
    }
  },
  {
    field: 'pushedAtRange',
    label: '推送时间',
    component: 'DatePicker',
    colProps: MESSAGE_SEARCH_DATE_COL,
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始时间',
      endPlaceholder: '结束时间',
      style: { width: '100%' }
    }
  }
])

const onSearchRegister = (expose: SearchExpose) => {
  searchExpose.value = expose
}

const setSearchParams = (params: Recordable) => {
  const range = params.pushedAtRange as string[] | undefined
  searchOwnership.value = params.eventOwnership as EventOwnership | undefined
  searchParams.value = {
    eventId: params.eventId,
    eventName: params.eventName,
    eventOwnership: params.eventOwnership as EventOwnership | undefined,
    eventType: params.eventType as EventAttributeEventType | undefined,
    description: params.description?.trim() || undefined,
    pushedAtStart: range?.[0],
    pushedAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

const onSearchReset = (params: Recordable) => {
  searchOwnership.value = undefined
  setSearchParams(params)
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
    field: 'eventId',
    label: '事件ID',
    search: { hidden: true },
    table: { minWidth: 130, showOverflowTooltip: true }
  },
  {
    field: 'eventName',
    label: '事件名称',
    search: { hidden: true },
    table: { minWidth: 160, showOverflowTooltip: true }
  },
  {
    field: 'eventOwnership',
    label: '事件归属',
    search: { hidden: true },
    table: { minWidth: 108 }
  },
  {
    field: 'eventType',
    label: '事件类型',
    search: { hidden: true },
    table: { minWidth: 108, showOverflowTooltip: true }
  },
  {
    field: 'pushedAt',
    label: '推送时间',
    search: { hidden: true },
    table: {
      width: 180,
      slots: {
        default: ({ row }: { row: MessageCenterItem }) => (
          <span>{formatMessagePushedAt(row.pushedAt)}</span>
        )
      }
    }
  },
  {
    field: 'description',
    label: '消息描述',
    search: { hidden: true },
    table: {
      minWidth: 420,
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: MessageCenterItem }) => renderDescription(row)
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)
</script>

<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      show-expand
      expand-field="eventType"
      @register="onSearchRegister"
      @search="setSearchParams"
      @reset="onSearchReset"
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
