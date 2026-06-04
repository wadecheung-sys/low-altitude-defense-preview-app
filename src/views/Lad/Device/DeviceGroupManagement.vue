<script setup lang="tsx">
import {
  deleteDeviceGroupApi,
  getDeviceGroupListApi,
  saveDeviceGroupApi
} from '@/api/lad/device-group'
import type { DeviceGroupItem, DeviceGroupType } from '@/api/lad/device-group/types'
import { getDeviceInfoListApi } from '@/api/lad/device-info'
import type { DeviceInfoItem } from '@/api/lad/device-info/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag
} from 'element-plus'
import { computed, reactive, ref, unref } from 'vue'

defineOptions({ name: 'LadDeviceGroupManagement' })

const groupTypeOptions: { label: DeviceGroupType; value: DeviceGroupType }[] = [
  { label: '探测组', value: '探测组' },
  { label: '反制组', value: '反制组' },
  { label: '光电协同组', value: '光电协同组' },
  { label: '综合联动组', value: '综合联动组' }
]

const enabledOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: 'true' },
  { label: '停用', value: 'false' }
]

const searchParams = ref<Recordable>({})
const dialogVisible = ref(false)
const dialogTitle = ref('新增设备组')
const deviceOptions = ref<DeviceInfoItem[]>([])

const form = reactive({
  id: '',
  groupCode: '',
  groupName: '',
  groupType: '探测组' as DeviceGroupType,
  description: '',
  memberIds: [] as string[],
  enabled: true
})

const memberNameMap = computed(() => {
  const map = new Map<string, string>()
  deviceOptions.value.forEach((item) => {
    map.set(item.id, `${item.deviceName}（${item.deviceId}）`)
  })
  return map
})

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    groupName: params.groupName,
    groupType: params.groupType || undefined,
    enabled: params.enabled === 'true' ? true : params.enabled === 'false' ? false : undefined
  }
  currentPage.value = 1
  getList()
}

async function loadDeviceOptions() {
  const res = await getDeviceInfoListApi({ pageIndex: 1, pageSize: 999 })
  deviceOptions.value = res.data.list
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getDeviceGroupListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { currentPage, pageSize, total, dataList, loading } = tableState
const { getList } = tableMethods

function resetForm() {
  form.id = ''
  form.groupCode = ''
  form.groupName = ''
  form.groupType = '探测组'
  form.description = ''
  form.memberIds = []
  form.enabled = true
}

function openCreate() {
  resetForm()
  dialogTitle.value = '新增设备组'
  dialogVisible.value = true
}

function openEdit(row: DeviceGroupItem) {
  form.id = row.id
  form.groupCode = row.groupCode
  form.groupName = row.groupName
  form.groupType = row.groupType
  form.description = row.description
  form.memberIds = [...row.memberIds]
  form.enabled = row.enabled
  dialogTitle.value = '编辑设备组'
  dialogVisible.value = true
}

async function removeRow(row: DeviceGroupItem) {
  try {
    await ElMessageBox.confirm(`确认删除设备组「${row.groupName}」吗？`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDeviceGroupApi(row.id)
  ElMessage.success('删除成功')
  getList()
}

async function saveGroup() {
  if (!form.groupName.trim()) {
    ElMessage.warning('请输入设备组名称')
    return
  }
  if (!form.memberIds.length) {
    ElMessage.warning('请至少选择一台设备加入设备组')
    return
  }
  await saveDeviceGroupApi({
    id: form.id || undefined,
    groupCode: form.groupCode,
    groupName: form.groupName,
    groupType: form.groupType,
    description: form.description,
    memberIds: [...form.memberIds],
    enabled: form.enabled
  })
  dialogVisible.value = false
  ElMessage.success(form.id ? '设备组已更新' : '设备组已创建')
  getList()
}

function memberNames(row: DeviceGroupItem) {
  return row.memberIds.map((id) => memberNameMap.value.get(id) || id).join('、')
}

loadDeviceOptions()

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'groupName',
    label: '设备组',
    search: {
      component: 'Input',
      colProps: { span: 8 },
      componentProps: { placeholder: '请输入组名或组编码', style: { width: '100%' } }
    }
  },
  {
    field: 'groupType',
    label: '组类型',
    search: {
      component: 'Select',
      colProps: { span: 8 },
      componentProps: {
        options: [{ label: '全部', value: '' }, ...groupTypeOptions],
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    }
  },
  {
    field: 'enabled',
    label: '状态',
    search: {
      component: 'Select',
      colProps: { span: 8 },
      componentProps: {
        options: enabledOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    }
  },
  {
    field: 'groupCode',
    label: '组编码',
    minWidth: 130,
    search: { hidden: true }
  },
  {
    field: 'groupName',
    label: '组名称',
    minWidth: 150,
    search: { hidden: true }
  },
  {
    field: 'groupType',
    label: '类型',
    minWidth: 120,
    search: { hidden: true }
  },
  {
    field: 'memberCount',
    label: '成员数',
    width: '90px',
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: DeviceGroupItem }) => <span>{row.memberIds.length}</span>
      }
    }
  },
  {
    field: 'members',
    label: '成员设备',
    minWidth: 260,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: DeviceGroupItem }) => <span>{memberNames(row)}</span>
      }
    }
  },
  {
    field: 'description',
    label: '用途说明',
    minWidth: 220,
    search: { hidden: true }
  },
  {
    field: 'enabled',
    label: '状态',
    width: '90px',
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: DeviceGroupItem }) => (
          <ElTag type={row.enabled ? 'success' : 'info'}>{row.enabled ? '启用' : '停用'}</ElTag>
        )
      }
    }
  },
  {
    field: 'updatedAt',
    label: '更新时间',
    minWidth: 160,
    search: { hidden: true }
  },
  {
    field: 'action',
    label: '操作',
    width: '180px',
    fixed: 'right',
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: DeviceGroupItem }) => (
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
      :schema="allSchemas.searchSchema"
      is-col
      label-width="88px"
      @search="setSearchParams"
      @reset="setSearchParams"
    />

    <div class="mb-10px">
      <BaseButton type="primary" @click="openCreate">新增设备组</BaseButton>
    </div>

    <Table
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
    />

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="组编码">
          <ElInput v-model="form.groupCode" placeholder="为空时自动生成" />
        </ElFormItem>
        <ElFormItem label="组名称">
          <ElInput v-model="form.groupName" placeholder="请输入设备组名称" />
        </ElFormItem>
        <ElFormItem label="组类型">
          <ElSelect v-model="form.groupType" class="w-100%">
            <ElOption
              v-for="option in groupTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="成员设备">
          <ElSelect
            v-model="form.memberIds"
            class="w-100%"
            multiple
            collapse-tags
            collapse-tags-tooltip
          >
            <ElOption
              v-for="device in deviceOptions"
              :key="device.id"
              :label="`${device.deviceName}（${device.deviceId}）`"
              :value="device.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="用途说明">
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入该设备组的用途说明"
          />
        </ElFormItem>
        <ElFormItem label="启用状态">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <BaseButton @click="dialogVisible = false">取消</BaseButton>
        <BaseButton type="primary" @click="saveGroup">保存</BaseButton>
      </template>
    </ElDialog>
  </ContentWrap>
</template>
