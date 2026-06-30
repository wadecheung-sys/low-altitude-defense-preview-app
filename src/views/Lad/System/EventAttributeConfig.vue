<script setup lang="tsx">
import { computed, reactive, ref, unref } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag
} from 'element-plus'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  deleteEventAttributeApi,
  getEventAttributeListApi,
  saveEventAttributeApi
} from '@/api/lad/system'
import type {
  EventAlarmLevel,
  EventAttributeEventType,
  EventAttributeItem,
  EventOwnership
} from '@/api/lad/system/types'
import {
  EVENT_OWNERSHIP_OPTIONS,
  eventTypeOptionsByOwnership,
  getEventTypeSearchOptions,
  resolveEventAttributePrompt,
  suggestEventAttributeName,
  UI
} from './eventAttributeConstants'
import { MESSAGE_VARIABLE_PARAMS } from '@/api/lad/system/eventAttributeParamCatalog'

type SearchExpose = {
  setValues: (data: Recordable) => Promise<void>
}

defineOptions({ name: 'LadSystemEventAttributeConfig' })

const ownershipOptions = EVENT_OWNERSHIP_OPTIONS.map((value) => ({
  label: value,
  value
}))

const alarmEnabledSearchOptions = [
  { label: '是', value: 'yes' },
  { label: '否', value: 'no' }
]

const searchOwnership = ref<EventOwnership | undefined>()
const searchExpose = ref<SearchExpose>()

const searchEventTypeOptions = computed(() => getEventTypeSearchOptions(searchOwnership.value))

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'eventId',
    label: '事件ID',
    component: 'Input',
    componentProps: {
      clearable: true,
      placeholder: '请输入事件ID'
    }
  },
  {
    field: 'eventName',
    label: '事件名称',
    component: 'Input',
    componentProps: {
      clearable: true,
      placeholder: '请输入事件名称'
    }
  },
  {
    field: 'eventOwnership',
    label: '事件归属',
    component: 'Select',
    componentProps: {
      options: ownershipOptions,
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
    componentProps: {
      options: searchEventTypeOptions.value,
      clearable: true,
      filterable: true,
      placeholder: searchOwnership.value ? '请选择事件类型' : '全部类型'
    }
  },
  {
    field: 'alarmEnabled',
    label: '是否告警',
    component: 'Select',
    componentProps: {
      options: alarmEnabledSearchOptions,
      clearable: true,
      placeholder: '全部'
    }
  }
])

const onSearchRegister = (expose: SearchExpose) => {
  searchExpose.value = expose
}

const defaultOwnership: EventOwnership = '设备发现'
const defaultEventType: EventAttributeEventType = '独立发现'

const searchParams = ref<Recordable>({})
const selectedIds = ref<string[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增事件属性')
const paramDialogVisible = ref(false)

const preservedFields = ref<{
  priority: number
  remark?: string
  alarmLevel: EventAlarmLevel
}>({
  priority: 150,
  alarmLevel: '提示'
})

interface EventAttributeForm {
  id: string
  eventId: string
  eventName: string
  eventOwnership: EventOwnership
  eventType: EventAttributeEventType
  alarmEnabled: boolean
  messagePrompt: string
}

const form = reactive<EventAttributeForm>({
  id: '',
  eventId: '',
  eventName: suggestEventAttributeName(defaultOwnership, defaultEventType),
  eventOwnership: defaultOwnership,
  eventType: defaultEventType,
  alarmEnabled: true,
  messagePrompt: resolveEventAttributePrompt(defaultOwnership, defaultEventType)
})

const currentTypeOptions = computed(() =>
  eventTypeOptionsByOwnership[form.eventOwnership].map((item) => ({ label: item, value: item }))
)

function syncMessagePromptFromType() {
  if (!form.id) {
    form.messagePrompt = resolveEventAttributePrompt(form.eventOwnership, form.eventType)
    form.eventName = suggestEventAttributeName(form.eventOwnership, form.eventType)
  }
}

function onOwnershipChange() {
  const types = eventTypeOptionsByOwnership[form.eventOwnership]
  if (!types.includes(form.eventType)) {
    form.eventType = types[0]
  }
  syncMessagePromptFromType()
}

function onEventTypeChange() {
  syncMessagePromptFromType()
}

function resetForm() {
  form.id = ''
  form.eventId = ''
  form.eventOwnership = defaultOwnership
  form.eventType = defaultEventType
  form.eventName = suggestEventAttributeName(defaultOwnership, defaultEventType)
  form.alarmEnabled = true
  form.messagePrompt = resolveEventAttributePrompt(defaultOwnership, defaultEventType)
  preservedFields.value = {
    priority: 150,
    remark: undefined,
    alarmLevel: '提示'
  }
}

const setSearchParams = (params: Recordable) => {
  searchOwnership.value = params.eventOwnership as EventOwnership | undefined
  searchParams.value = {
    eventId: params.eventId,
    eventName: params.eventName,
    eventOwnership: params.eventOwnership as EventOwnership | undefined,
    eventType: params.eventType as EventAttributeEventType | undefined,
    alarmEnabled:
      params.alarmEnabled === 'yes' ? true : params.alarmEnabled === 'no' ? false : undefined
  }
  currentPage.value = 1
  getList()
}

const onSearchReset = (params: Recordable) => {
  searchOwnership.value = undefined
  setSearchParams(params)
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getEventAttributeListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data?.list ?? [], total: res.data?.total ?? 0 }
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
  form.alarmEnabled = row.alarmEnabled
  form.messagePrompt = row.messagePrompt
  preservedFields.value = {
    priority: row.priority,
    remark: row.remark,
    alarmLevel: row.alarmLevel
  }
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
  if (!form.eventType) {
    ElMessage.warning('请选择事件类型')
    return
  }
  const allowedTypes = eventTypeOptionsByOwnership[form.eventOwnership]
  if (allowedTypes.length && !allowedTypes.includes(form.eventType)) {
    ElMessage.warning('当前事件类型与所选事件归属不匹配')
    return
  }
  if (form.alarmEnabled && !form.messagePrompt.trim()) {
    ElMessage.warning('开启告警时请填写消息描述')
    return
  }

  await saveEventAttributeApi({
    id: form.id || undefined,
    eventId: form.eventId,
    eventName: form.eventName,
    eventOwnership: form.eventOwnership,
    eventType: form.eventType,
    alarmEnabled: form.alarmEnabled,
    alarmLevel: preservedFields.value.alarmLevel,
    priority: preservedFields.value.priority,
    messagePrompt: form.messagePrompt,
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
    field: 'eventOwnership',
    label: '事件归属',
    search: { hidden: true },
    table: { minWidth: 128 }
  },
  {
    field: 'eventType',
    label: '事件类型',
    search: { hidden: true },
    table: { minWidth: 140, showOverflowTooltip: true }
  },
  {
    field: 'alarmEnabled',
    label: '是否告警',
    search: { hidden: true },
    table: {
      width: 100,
      align: 'center',
      slots: {
        default: ({ row }: { row: EventAttributeItem }) => (
          <ElTag size="small" effect="light" type={row.alarmEnabled ? 'success' : 'info'}>
            {row.alarmEnabled ? '是' : '否'}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'messagePrompt',
    label: UI.messageDescription,
    search: { hidden: true },
    table: { minWidth: 280, showOverflowTooltip: true }
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
    <Search
      :schema="searchSchema"
      show-expand
      expand-field="eventType"
      @register="onSearchRegister"
      @search="setSearchParams"
      @reset="onSearchReset"
    />

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
            <ElInput v-model="form.eventId" placeholder="如 EVT-DISC-001" />
          </ElFormItem>
          <ElFormItem label="事件名称">
            <ElInput v-model="form.eventName" placeholder="如 探测设备独立发现" />
          </ElFormItem>

          <ElFormItem label="事件归属">
            <ElSelect v-model="form.eventOwnership" class="w-100%" @change="() => onOwnershipChange()">
              <ElOption
                v-for="option in ownershipOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="事件类型">
            <ElSelect v-model="form.eventType" class="w-100%" @change="() => onEventTypeChange()">
              <ElOption
                v-for="option in currentTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="是否告警">
            <ElSwitch
              v-model="form.alarmEnabled"
              inline-prompt
              active-text="是"
              inactive-text="否"
            />
          </ElFormItem>
        </div>
        <ElFormItem :label="UI.messageDescription">
          <ElInput
            v-model="form.messagePrompt"
            type="textarea"
            :rows="3"
            :placeholder="UI.messageDescriptionPlaceholder"
            :disabled="!form.alarmEnabled"
          />
          <div class="event-attr-form__hint">
            <span>{{ UI.messageDescriptionHintPrefix }}</span>
            <ElLink type="primary" :underline="false" @click="paramDialogVisible = true">
              查看可变参数列表
            </ElLink>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <BaseButton type="primary" @click="saveRow">确定</BaseButton>
        <BaseButton @click="dialogVisible = false">取消</BaseButton>
      </template>
    </ElDialog>

    <ElDialog v-model="paramDialogVisible" title="可用参数列表" width="520px" destroy-on-close>
      <ElTable :data="MESSAGE_VARIABLE_PARAMS" border stripe size="small">
        <ElTableColumn label="参数" prop="param" min-width="160" />
        <ElTableColumn label="编码" prop="code" min-width="180" />
      </ElTable>
    </ElDialog>
  </ContentWrap>
</template>

<style scoped>
.event-attr-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.event-attr-form__hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;

  .el-link {
    font-size: 12px;
    vertical-align: baseline;
  }
}
</style>
