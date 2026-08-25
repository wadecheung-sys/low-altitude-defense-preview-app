<script setup lang="tsx">
import { deleteDeviceInfoApi, getDeviceInfoListApi } from '@/api/lad/device-info'
import type { DeviceInfoItem } from '@/api/lad/device-info/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  DEVICE_INFO_FIELD_LABELS,
  DEVICE_INFO_SEARCH_COL,
  deviceInfoTypeOptions
} from './deviceInfoConstants'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref, unref } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'LadDeviceInfoList' })

const { push } = useRouter()

const ids = ref<string[]>([])
const searchParams = ref<Recordable>({})

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    deviceId: params.deviceId,
    deviceName: params.deviceName,
    deviceType: params.deviceType,
    deployLocation: params.deployLocation,
    ipAddress: params.ipAddress,
    personInCharge: params.personInCharge
  }
  currentPage.value = 1
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getDeviceInfoListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

function goDetail(row: DeviceInfoItem) {
  push(`/lad/device/info/detail/${row.id}`)
}

function openEdit(row: DeviceInfoItem) {
  push(`/lad/device/info/edit/${row.id}`)
}

function openCreate() {
  push('/lad/device/info/add')
}

function onSelectionChange(list: DeviceInfoItem[]) {
  ids.value = list.map((item) => item.id)
}

async function batchRemove() {
  if (!ids.value.length) {
    ElMessage.warning('请先勾选需要删除的设备')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.value.length} 台设备吗？`, '批量删除', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDeviceInfoApi([...ids.value])
  ids.value = []
  ElMessage.success('删除成功')
  getList()
}

async function removeRow(row: DeviceInfoItem) {
  try {
    await ElMessageBox.confirm(`确认删除设备「${row.deviceName}」吗？`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDeviceInfoApi([row.id])
  ids.value = ids.value.filter((id) => id !== row.id)
  ElMessage.success('删除成功')
  getList()
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
    field: 'deviceId',
    label: DEVICE_INFO_FIELD_LABELS.deviceId,
    minWidth: 130,
    search: {
      component: 'Input',
      colProps: DEVICE_INFO_SEARCH_COL,
      componentProps: { placeholder: '请输入设备编号', style: { width: '100%' } }
    },
    table: {
      showOverflowTooltip: true
    }
  },
  {
    field: 'deviceName',
    label: DEVICE_INFO_FIELD_LABELS.deviceName,
    minWidth: 160,
    search: {
      component: 'Input',
      colProps: DEVICE_INFO_SEARCH_COL,
      componentProps: { placeholder: '请输入设备名称', style: { width: '100%' } }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'archiveInfo',
    label: DEVICE_INFO_FIELD_LABELS.archiveInfo,
    minWidth: 140,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'deviceType',
    label: DEVICE_INFO_FIELD_LABELS.deviceType,
    minWidth: 110,
    search: {
      component: 'Select',
      colProps: DEVICE_INFO_SEARCH_COL,
      componentProps: {
        options: deviceInfoTypeOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'deployLocation',
    label: DEVICE_INFO_FIELD_LABELS.deployLocation,
    minWidth: 120,
    search: {
      component: 'Input',
      colProps: DEVICE_INFO_SEARCH_COL,
      componentProps: { placeholder: '请输入部署区域', style: { width: '100%' } }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'ipAddress',
    label: DEVICE_INFO_FIELD_LABELS.ipAddress,
    minWidth: 130,
    search: {
      component: 'Input',
      colProps: DEVICE_INFO_SEARCH_COL,
      componentProps: { placeholder: '请输入设备IP', style: { width: '100%' } }
    }
  },
  {
    field: 'personInCharge',
    label: DEVICE_INFO_FIELD_LABELS.personInCharge,
    minWidth: 100,
    search: {
      component: 'Input',
      colProps: DEVICE_INFO_SEARCH_COL,
      componentProps: { placeholder: '请输入保管人', style: { width: '100%' } }
    },
    table: { showOverflowTooltip: true }
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
        default: ({ row }: { row: DeviceInfoItem }) => (
          <>
            <BaseButton type="success" onClick={() => goDetail(row)}>
              详情
            </BaseButton>
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
      <BaseButton type="primary" @click="openCreate">新增设备</BaseButton>
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
