<script setup lang="tsx">
import {
  deleteDeviceLinkageApi,
  getDeviceLinkageListApi,
  saveDeviceLinkageApi
} from '@/api/lad/device-group'
import {
  MASTER_DEVICE_TYPES,
  buildLinkedChain,
  isCameraDevice,
  isMasterDevice,
  resolveMasterDevice
} from '@/api/lad/device-group/deviceGroupCatalog'
import type { DeviceLinkageItem } from '@/api/lad/device-group/types'
import { getDeviceInfoListApi } from '@/api/lad/device-info'
import type { DeviceInfoItem } from '@/api/lad/device-info/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  ElAutocomplete,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTransfer
} from 'element-plus'
import { computed, reactive, ref, unref } from 'vue'

defineOptions({ name: 'LadDeviceAssociation' })

const searchFieldStyle = { width: '100%' }

const deviceOptions = ref<DeviceInfoItem[]>([])
const searchParams = ref<Recordable>({})
const ids = ref<string[]>([])
const delLoading = ref(false)

const masterDevices = computed(() => deviceOptions.value.filter(isMasterDevice))
const cameraDevices = computed(() => deviceOptions.value.filter(isCameraDevice))

const areaOptions = computed(() => {
  const values = Array.from(new Set(masterDevices.value.map((item) => item.deployLocation))).sort()
  return values.map((value) => ({ label: value, value }))
})

const masterTypeOptions = MASTER_DEVICE_TYPES.map((value) => ({ label: value, value }))

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    deployArea: params.deployArea,
    deviceType: params.deviceType || undefined,
    deviceName: params.deviceName,
    deviceCode: params.deviceCode
  }
  currentPage.value = 1
  getList()
}

async function loadDeviceOptions() {
  const res = await getDeviceInfoListApi({ pageIndex: 1, pageSize: 999 })
  deviceOptions.value = res.data.list
  const deployAreaSchema = crudSchemas.find((item) => item.field === 'deployArea')
  if (deployAreaSchema?.search?.componentProps) {
    deployAreaSchema.search.componentProps.options = areaOptions.value
  }
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getDeviceLinkageListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  },
  fetchDelApi: async () => true
})

const { currentPage, pageSize, total, dataList, loading } = tableState
const { getList, delList } = tableMethods

function onSelectionChange(list: DeviceLinkageItem[]) {
  ids.value = list.map((item) => item.id)
}

const AUTOCOMPLETE_LIMIT = 8

type MasterDeviceSuggestion = {
  value: string
  device: DeviceInfoItem
}

function scopedMasterCandidates() {
  return masterDevices.value.filter((item) => {
    if (editForm.deployArea && item.deployLocation !== editForm.deployArea) return false
    if (editForm.deviceType && item.deviceType !== editForm.deviceType) return false
    return true
  })
}

function queryDeviceNameSuggestions(
  queryString: string,
  cb: (items: MasterDeviceSuggestion[]) => void
) {
  const keyword = queryString.trim().toLowerCase()
  let list = scopedMasterCandidates()
  if (keyword) {
    list = list.filter((item) => item.deviceName.toLowerCase().includes(keyword))
  }
  cb(list.slice(0, AUTOCOMPLETE_LIMIT).map((item) => ({ value: item.deviceName, device: item })))
}

function queryDeviceCodeSuggestions(
  queryString: string,
  cb: (items: MasterDeviceSuggestion[]) => void
) {
  const keyword = queryString.trim().toLowerCase()
  let list = scopedMasterCandidates()
  if (keyword) {
    list = list.filter((item) => item.deviceId.toLowerCase().includes(keyword))
  }
  cb(list.slice(0, AUTOCOMPLETE_LIMIT).map((item) => ({ value: item.deviceId, device: item })))
}

function applyMasterDevice(device: DeviceInfoItem) {
  editForm.deviceName = device.deviceName
  editForm.deviceCode = device.deviceId
  editForm.deployArea = device.deployLocation
  editForm.deviceType = device.deviceType
}

function onPickMasterByName(item: MasterDeviceSuggestion) {
  applyMasterDevice(item.device)
}

function onPickMasterByCode(item: MasterDeviceSuggestion) {
  applyMasterDevice(item.device)
}

const editVisible = ref(false)
const detailVisible = ref(false)
const dialogTitle = ref('新增联动配置')
const editingId = ref('')

const editForm = reactive({
  deployArea: '',
  deviceType: '',
  deviceName: '',
  deviceCode: '',
  linkedDeviceIds: [] as string[]
})

const transferData = computed(() => {
  const area = editForm.deployArea
  return cameraDevices.value
    .filter((item) => (area ? item.deployLocation === area : true))
    .map((item) => ({
      key: item.id,
      label: `${item.deviceName}（${item.deviceId}）`
    }))
})

const currentDetail = ref<DeviceLinkageItem | null>(null)
const detailLinkedDevices = computed(() => {
  if (!currentDetail.value) return []
  const idSet = new Set(currentDetail.value.linkedDeviceIds)
  return cameraDevices.value.filter((item) => idSet.has(item.id)).map((item) => item.deviceName)
})

function resetEditForm() {
  editForm.deployArea = ''
  editForm.deviceType = ''
  editForm.deviceName = ''
  editForm.deviceCode = ''
  editForm.linkedDeviceIds = []
}

function openCreate() {
  editingId.value = ''
  dialogTitle.value = '新增联动配置'
  resetEditForm()
  editVisible.value = true
}

function openEdit(row: DeviceLinkageItem) {
  editingId.value = row.id
  dialogTitle.value = '编辑联动配置'
  editForm.deployArea = row.deployArea
  editForm.deviceType = row.deviceType
  editForm.deviceName = row.deviceName
  editForm.deviceCode = row.deviceCode
  editForm.linkedDeviceIds = [...row.linkedDeviceIds]
  editVisible.value = true
}

function openView(row: DeviceLinkageItem) {
  currentDetail.value = row
  detailVisible.value = true
}

async function saveConfig() {
  if (!editForm.deployArea) {
    ElMessage.warning('请选择部署区域')
    return
  }
  if (!editForm.deviceType) {
    ElMessage.warning('请选择设备类型')
    return
  }

  const master = resolveMasterDevice(
    masterDevices.value.filter(
      (item) =>
        item.deployLocation === editForm.deployArea && item.deviceType === editForm.deviceType
    ),
    editForm.deviceName,
    editForm.deviceCode
  )

  if (!master) {
    ElMessage.warning('请从下拉建议中选择主设备，或输入可模糊匹配的设备名称/编号')
    return
  }
  if (!editForm.linkedDeviceIds.length) {
    ElMessage.warning('请至少选择一个关联监控摄像头')
    return
  }

  await saveDeviceLinkageApi({
    id: editingId.value || undefined,
    masterDeviceId: master.id,
    deviceName: master.deviceName,
    deviceCode: master.deviceId,
    deviceType: master.deviceType,
    deployArea: master.deployLocation,
    linkedDeviceIds: [...editForm.linkedDeviceIds],
    linkedChain: buildLinkedChain(deviceOptions.value, editForm.linkedDeviceIds),
    enabled: true
  })

  ElMessage.success(editingId.value ? '联动配置已更新' : '联动配置已新增')
  editVisible.value = false
  getList()
}

async function removeOne(row: DeviceLinkageItem) {
  try {
    await ElMessageBox.confirm(`确认删除配置「${row.deviceName}」吗？`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDeviceLinkageApi([row.id])
  ids.value = ids.value.filter((id) => id !== row.id)
  ElMessage.success('删除成功')
  getList()
}

async function removeBatch() {
  if (!ids.value.length) {
    ElMessage.warning('请先勾选配置')
    return
  }
  delLoading.value = true
  try {
    await delList(ids.value.length)
    await deleteDeviceLinkageApi([...ids.value])
    ids.value = []
    ElMessage.success('批量删除成功')
    getList()
  } finally {
    delLoading.value = false
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
    width: '70px',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'deployArea',
    label: '部署区域',
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        options: [] as { label: string; value: string }[],
        clearable: true,
        placeholder: '全部区域',
        style: searchFieldStyle
      }
    },
    table: {
      minWidth: 140,
      showOverflowTooltip: true
    }
  },
  {
    field: 'deviceType',
    label: '设备类型',
    search: {
      component: 'Select',
      colProps: { span: 6 },
      componentProps: {
        options: masterTypeOptions,
        clearable: true,
        placeholder: '全部设备类型',
        style: searchFieldStyle
      }
    },
    table: { minWidth: 120 }
  },
  {
    field: 'deviceName',
    label: '设备名称',
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        clearable: true,
        placeholder: '请输入设备名称',
        style: searchFieldStyle
      }
    },
    table: { minWidth: 160, showOverflowTooltip: true }
  },
  {
    field: 'deviceCode',
    label: '设备编号',
    search: {
      component: 'Input',
      colProps: { span: 6 },
      componentProps: {
        clearable: true,
        placeholder: '请输入设备编号',
        style: searchFieldStyle
      }
    },
    table: { minWidth: 130 }
  },
  {
    field: 'linkedChain',
    label: '关联监控摄像头',
    search: { hidden: true },
    table: { minWidth: 280, showOverflowTooltip: true }
  },
  {
    field: 'updatedAt',
    label: '更新时间',
    search: { hidden: true },
    table: { minWidth: 160 }
  },
  {
    field: 'action',
    label: '操作',
    width: '260px',
    fixed: 'right',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: DeviceLinkageItem }) => (
          <>
            <BaseButton type="success" onClick={() => openView(row)}>
              详情
            </BaseButton>
            <BaseButton type="primary" onClick={() => openEdit(row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" onClick={() => removeOne(row)}>
              删除
            </BaseButton>
          </>
        )
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)

loadDeviceOptions()
getList()
</script>

<template>
  <ContentWrap>
    <Search
      :schema="allSchemas.searchSchema"
      @search="setSearchParams"
      @reset="setSearchParams"
    />

    <div class="mb-10px">
      <BaseButton type="primary" @click="openCreate">新增</BaseButton>
      <BaseButton type="danger" :loading="delLoading" class="ml-12px" @click="removeBatch">
        批量删除
      </BaseButton>
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

  <Dialog v-model="editVisible" :title="dialogTitle" width="860px">
    <div class="device-group-dialog-grid">
      <div class="device-group-dialog-field">
        <div class="device-group-dialog-label"><span class="is-required">*</span>部署区域</div>
        <ElSelect v-model="editForm.deployArea" clearable placeholder="请选择">
          <ElOption
            v-for="item in areaOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </div>
      <div class="device-group-dialog-field">
        <div class="device-group-dialog-label"><span class="is-required">*</span>设备类型</div>
        <ElSelect v-model="editForm.deviceType" clearable placeholder="请选择">
          <ElOption
            v-for="item in masterTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </div>
      <div class="device-group-dialog-field">
        <div class="device-group-dialog-label">设备名称</div>
        <ElAutocomplete
          v-model="editForm.deviceName"
          class="w-full"
          clearable
          fit-input-width
          :fetch-suggestions="queryDeviceNameSuggestions"
          placeholder="输入关键字模糊匹配"
          value-key="value"
          @select="onPickMasterByName"
        >
          <template #default="{ item }">
            <div class="device-group-dialog-suggest">
              <span>{{ item.device.deviceName }}</span>
              <span class="device-group-dialog-suggest__meta">
                {{ item.device.deviceId }} · {{ item.device.deployLocation }}
              </span>
            </div>
          </template>
        </ElAutocomplete>
      </div>
      <div class="device-group-dialog-field">
        <div class="device-group-dialog-label">设备编号</div>
        <ElAutocomplete
          v-model="editForm.deviceCode"
          class="w-full"
          clearable
          fit-input-width
          :fetch-suggestions="queryDeviceCodeSuggestions"
          placeholder="输入关键字模糊匹配"
          value-key="value"
          @select="onPickMasterByCode"
        >
          <template #default="{ item }">
            <div class="device-group-dialog-suggest">
              <span>{{ item.device.deviceId }}</span>
              <span class="device-group-dialog-suggest__meta">
                {{ item.device.deviceName }} · {{ item.device.deployLocation }}
              </span>
            </div>
          </template>
        </ElAutocomplete>
      </div>
      <div class="device-group-dialog-field device-group-dialog-field--full">
        <div class="device-group-dialog-label"><span class="is-required">*</span>关联监控摄像头</div>
        <ElTransfer
          v-model="editForm.linkedDeviceIds"
          :data="transferData"
          filterable
          :titles="['未选中摄像头', '已选中摄像头']"
          :props="{ key: 'key', label: 'label' }"
        />
      </div>
    </div>
    <template #footer>
      <BaseButton type="primary" @click="saveConfig">保存配置</BaseButton>
      <BaseButton @click="editVisible = false">取消</BaseButton>
    </template>
  </Dialog>

  <Dialog v-model="detailVisible" title="联动配置详情" width="700px">
    <ElDescriptions v-if="currentDetail" border :column="2">
      <ElDescriptionsItem label="设备名称">{{ currentDetail.deviceName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="设备编号">{{ currentDetail.deviceCode }}</ElDescriptionsItem>
      <ElDescriptionsItem label="设备类型">{{ currentDetail.deviceType }}</ElDescriptionsItem>
      <ElDescriptionsItem label="部署区域">{{ currentDetail.deployArea }}</ElDescriptionsItem>
      <ElDescriptionsItem label="关联摄像头链" :span="2">
        {{ currentDetail.linkedChain || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="关联摄像头明细" :span="2">
        {{ detailLinkedDevices.join('、') || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="更新时间" :span="2">
        {{ currentDetail.updatedAt }}
      </ElDescriptionsItem>
    </ElDescriptions>
    <template #footer>
      <BaseButton @click="detailVisible = false">关闭</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped lang="less">
.device-group-dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
}

.device-group-dialog-field--full {
  grid-column: 1 / -1;
}

.device-group-dialog-label {
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 14px;

  .is-required {
    margin-right: 4px;
    color: var(--el-color-danger);
  }
}

:deep(.el-transfer) {
  display: flex;
  justify-content: center;
  width: 100%;
}

:deep(.el-transfer-panel) {
  flex: 1;
  max-width: 320px;
}

.device-group-dialog-suggest {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.4;
  padding: 2px 0;
}

.device-group-dialog-suggest__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
