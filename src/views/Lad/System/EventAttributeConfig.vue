<script setup lang="tsx">
import { computed, reactive, ref, unref } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect
} from 'element-plus'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  deleteEventAttributeApi,
  getEventAttributeListApi,
  saveEventAttributeApi
} from '@/api/lad/system'
import type { EventAlarmLevel, EventAttributeItem, EventOwnership } from '@/api/lad/system/types'

defineOptions({ name: 'LadSystemEventAttributeConfig' })

const ownershipOptions = [
  { label: '无人机入侵', value: '无人机入侵' },
  { label: '设备故障', value: '设备故障' }
] satisfies Array<{ label: string; value: EventOwnership }>

const eventTypeMap: Record<EventOwnership, string[]> = {
  无人机入侵: ['黑飞无人机入侵', '黑名单无人机入侵', '无人机入侵'],
  设备故障: ['离线', '故障', '数据中断', '供电异常']
}

const searchParams = ref<Recordable>({})
const selectedIds = ref<string[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增事件属性')

const preservedFields = ref<{
  priority: number
  remark?: string
  alarmEnabled: boolean
  alarmLevel: EventAlarmLevel
}>({
  priority: 300,
  alarmEnabled: true,
  alarmLevel: '紧急'
})

const form = reactive({
  id: '',
  eventId: '',
  eventName: '',
  eventOwnership: '无人机入侵' as EventOwnership,
  eventType: '黑飞无人机入侵'
})

const currentTypeOptions = computed(() =>
  eventTypeMap[form.eventOwnership].map((item) => ({ label: item, value: item }))
)

function syncEventType() {
  const types = eventTypeMap[form.eventOwnership]
  if (!types.includes(form.eventType)) {
    form.eventType = types[0]
  }
}

function resetForm() {
  form.id = ''
  form.eventId = ''
  form.eventName = ''
  form.eventOwnership = '无人机入侵'
  form.eventType = eventTypeMap['无人机入侵'][0]
  preservedFields.value = {
    priority: 300,
    remark: undefined,
    alarmEnabled: true,
    alarmLevel: '紧急'
  }
}

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    keyword: params.keyword,
    eventOwnership: params.eventOwnership as EventOwnership | undefined
  }
  currentPage.value = 1
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getEventAttributeListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

function openCreate() {
  resetForm()
  dialogTitle.value = '新增事件属性'
  dialogVisible.value = true
}

function openEdit(row: EventAttributeItem) {
  form.id = row.id
  form.eventId = row.eventId
  form.eventName = row.eventName
  form.eventOwnership = row.eventOwnership
  form.eventType = row.eventType
  preservedFields.value = {
    priority: row.priority,
    remark: row.remark,
    alarmEnabled: row.alarmEnabled,
    alarmLevel: row.alarmLevel
  }
  syncEventType()
  dialogTitle.value = '编辑事件属性'
  dialogVisible.value = true
}

function onSelectionChange(rows: EventAttributeItem[]) {
  selectedIds.value = rows.map((row) => row.id)
}

async function batchRemove() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先勾选需要删除的事件属性')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedIds.value.length} 条事件属性吗？`,
      '批量删除',
      { type: 'warning' }
    )
  } catch {
    return
  }
  await Promise.all(selectedIds.value.map((id) => deleteEventAttributeApi(id)))
  selectedIds.value = []
  ElMessage.success('删除成功')
  getList()
}

async function removeRow(row: EventAttributeItem) {
  try {
    await ElMessageBox.confirm(`确认删除事件属性“${row.eventName}”吗？`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteEventAttributeApi(row.id)
  ElMessage.success('删除成功')
  getList()
}

async function saveRow() {
  if (!form.eventId.trim()) {
    ElMessage.warning('请输入事件ID')
    return
  }
  if (!form.eventName.trim()) {
    ElMessage.warning('请输入事件名称')
    return
  }
  if (!form.eventType.trim()) {
    ElMessage.warning('请选择事件类型')
    return
  }

  await saveEventAttributeApi({
    id: form.id || undefined,
    eventId: form.eventId,
    eventName: form.eventName,
    eventOwnership: form.eventOwnership,
    eventType: form.eventType,
    alarmEnabled: preservedFields.value.alarmEnabled,
    alarmLevel: preservedFields.value.alarmLevel,
    priority: preservedFields.value.priority,
    remark: preservedFields.value.remark
  })
  dialogVisible.value = false
  ElMessage.success(form.id ? '事件属性已更新' : '事件属性已创建')
  getList()
}

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
    width: '70px',
    search: { hidden: true },
    form: { hidden: true }
  },
  {
    field: 'keyword',
    label: '关键字',
    search: {
      component: 'Input',
      componentProps: {
        placeholder: '事件ID / 事件名称 / 事件类型',
        style: { width: '100%' }
      }
    },
    table: { hidden: true }
  },
  {
    field: 'eventOwnership',
    label: '事件归属',
    search: {
      component: 'Select',
      componentProps: {
        options: ownershipOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: { minWidth: 120 }
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
    table: { minWidth: 180, showOverflowTooltip: true }
  },
  {
    field: 'eventType',
    label: '事件类型',
    search: { hidden: true },
    table: { minWidth: 140, showOverflowTooltip: true }
  },
  {
    field: 'action',
    label: '操作',
    search: { hidden: true },
    table: {
      width: 160,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: EventAttributeItem }) => (
          <>
            <BaseButton type="primary" onClick={() => openEdit(row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" onClick={() => removeRow(row)}>
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

    <div class="mb-10px">
      <BaseButton type="primary" @click="openCreate">新增</BaseButton>
      <BaseButton type="danger" class="ml-8px" @click="batchRemove">批量删除</BaseButton>
    </div>

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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="760px" destroy-on-close>
      <ElForm label-width="92px" class="event-attr-form">
        <div class="event-attr-form__grid">
          <ElFormItem label="事件ID">
            <ElInput v-model="form.eventId" placeholder="请输入事件ID" />
          </ElFormItem>
          <ElFormItem label="事件名称">
            <ElInput v-model="form.eventName" placeholder="请输入事件名称" />
          </ElFormItem>

          <ElFormItem label="事件归属">
            <ElSelect v-model="form.eventOwnership" class="w-100%" @change="() => syncEventType()">
              <ElOption
                v-for="option in ownershipOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="事件类型">
            <ElSelect v-model="form.eventType" class="w-100%">
              <ElOption
                v-for="option in currentTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </div>
      </ElForm>
      <template #footer>
        <BaseButton type="primary" @click="saveRow">确定</BaseButton>
        <BaseButton @click="dialogVisible = false">取消</BaseButton>
      </template>
    </ElDialog>
  </ContentWrap>
</template>

<style scoped>
.event-attr-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
</style>
