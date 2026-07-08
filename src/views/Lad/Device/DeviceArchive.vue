<script setup lang="tsx">
import { deleteDeviceArchiveApi, getDeviceArchiveListApi } from '@/api/lad/device'
import type { DeviceArchiveCategory, DeviceArchiveItem } from '@/api/lad/device/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  DEVICE_ARCHIVE_SEARCH_COL,
  deviceArchiveStatusOptions,
  deviceArchiveTypeOptions,
  deviceArchiveVendorOptions
} from './constants'
import { ElInput, ElLink, ElMessage, ElMessageBox, ElTag, ElTree } from 'element-plus'
import { reactive, ref, unref, watch } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'LadDeviceArchive' })

interface ArchiveTreeNode {
  id: DeviceArchiveCategory
  label: string
  children?: ArchiveTreeNode[]
}

const archiveTreeData: ArchiveTreeNode[] = [
  {
    id: 'all',
    label: '全部档案',
    children: [
      { id: 'radar', label: '雷达档案' },
      { id: 'radio', label: '无线电侦测档案' },
      { id: 'counter', label: '反制装备档案' },
      { id: 'eo', label: '光电跟踪档案' }
    ]
  }
]

const { push } = useRouter()

const ids = ref<string[]>([])
const searchParams = ref<Recordable>({})
const currentNodeKey = ref<DeviceArchiveCategory>('all')
const currentTreeKeyword = ref('')
const treeEl = ref<InstanceType<typeof ElTree>>()

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    archiveNo: params.archiveNo,
    archiveName: params.archiveName,
    deviceType: params.deviceType,
    vendor: params.vendor,
    deviceModel: params.deviceModel,
    status: params.status
  }
  currentPage.value = 1
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getDeviceArchiveListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      category: currentNodeKey.value,
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

function goDetail(row: DeviceArchiveItem) {
  push(`/lad/device/archive/detail/${row.id}`)
}

function openEdit(row: DeviceArchiveItem) {
  push(`/lad/device/archive/edit/${row.id}`)
}

function currentChange(data: ArchiveTreeNode | null) {
  if (!data?.id) return
  currentNodeKey.value = data.id
  currentPage.value = 1
  ids.value = []
  getList()
}

function filterNode(value: string, data: ArchiveTreeNode) {
  if (!value) return true
  return data.label.includes(value)
}

watch(currentTreeKeyword, (value) => {
  treeEl.value?.filter(value)
})

function onSelectionChange(list: DeviceArchiveItem[]) {
  ids.value = list.map((item) => item.id)
}

async function batchRemove() {
  if (!ids.value.length) {
    ElMessage.warning('请先勾选需要删除的档案')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.value.length} 条档案吗？`, '批量删除', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDeviceArchiveApi([...ids.value])
  ids.value = []
  ElMessage.success('删除成功')
  getList()
}

async function removeArchive(row: DeviceArchiveItem) {
  try {
    await ElMessageBox.confirm(`确认删除档案「${row.archiveName}」吗？`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteDeviceArchiveApi([row.id])
  ids.value = ids.value.filter((id) => id !== row.id)
  ElMessage.success('删除成功')
  getList()
}

function openCreate() {
  push('/lad/device/archive/add')
}

function importArchive() {
  ElMessage.info('导入设备档案')
}

function exportArchive() {
  ElMessage.success('设备档案已导出')
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
    field: 'archiveNo',
    label: '档案编号',
    minWidth: 150,
    search: {
      component: 'Input',
      colProps: DEVICE_ARCHIVE_SEARCH_COL,
      componentProps: { placeholder: '请输入档案编号', style: { width: '100%' } }
    },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: DeviceArchiveItem }) => (
          <ElLink type="primary" underline={false} onClick={() => goDetail(row)}>
            {row.archiveNo}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'archiveName',
    label: '档案名称',
    minWidth: 180,
    search: {
      component: 'Input',
      colProps: DEVICE_ARCHIVE_SEARCH_COL,
      componentProps: { placeholder: '请输入档案名称', style: { width: '100%' } }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'deviceType',
    label: '设备类型',
    minWidth: 120,
    search: {
      component: 'Select',
      colProps: DEVICE_ARCHIVE_SEARCH_COL,
      componentProps: {
        options: deviceArchiveTypeOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    }
  },
  {
    field: 'vendor',
    label: '厂商',
    minWidth: 120,
    search: {
      component: 'Select',
      colProps: DEVICE_ARCHIVE_SEARCH_COL,
      componentProps: {
        options: deviceArchiveVendorOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'deviceModel',
    label: '设备型号',
    minWidth: 130,
    search: {
      component: 'Input',
      colProps: DEVICE_ARCHIVE_SEARCH_COL,
      componentProps: { placeholder: '请输入设备型号', style: { width: '100%' } }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'status',
    label: '状态',
    minWidth: 90,
    search: {
      component: 'Select',
      colProps: DEVICE_ARCHIVE_SEARCH_COL,
      componentProps: {
        options: deviceArchiveStatusOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: DeviceArchiveItem }) => (
          <ElTag type={row.enabled ? 'success' : 'danger'} size="small">
            {row.enabled ? '生效' : '未生效'}
          </ElTag>
        )
      }
    }
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
        default: ({ row }: { row: DeviceArchiveItem }) => (
          <>
            <BaseButton type="success" onClick={() => goDetail(row)}>
              详情
            </BaseButton>
            <BaseButton type="primary" onClick={() => openEdit(row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" onClick={() => removeArchive(row)}>
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
  <div class="device-archive-page flex w-100%">
    <ContentWrap class="archive-tree-pane">
      <div class="archive-tree-pane__inner">
        <div class="pane-title">档案分类</div>
        <ElInput
          v-model="currentTreeKeyword"
          class="archive-tree-search mb-12px"
          placeholder="搜索档案类型"
          clearable
        />
        <ElTree
          ref="treeEl"
          class="archive-tree-pane__tree"
          :data="archiveTreeData"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          node-key="id"
          :current-node-key="currentNodeKey"
          :props="{ label: 'label' }"
          :filter-node-method="filterNode"
          @current-change="currentChange"
        />
      </div>
    </ContentWrap>

    <ContentWrap class="archive-main flex-1 ml-20px">
      <Search
        :schema="allSchemas.searchSchema"
        class="archive-search"
        @search="setSearchParams"
        @reset="setSearchParams"
      />

      <div class="mb-10px">
        <BaseButton type="primary" @click="openCreate">新增档案</BaseButton>
        <BaseButton type="danger" @click="batchRemove">批量删除</BaseButton>
        <BaseButton @click="importArchive">导入</BaseButton>
        <BaseButton @click="exportArchive">导出档案</BaseButton>
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
  </div>
</template>

<style scoped lang="less">
.device-archive-page {
  min-height: calc(100vh - 170px);
  align-items: stretch;
}

.archive-tree-pane {
  flex: 0 0 260px;
  width: 260px;
  display: flex;

  :deep(.el-card) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

.archive-tree-pane__inner {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100%;
}

.archive-tree-pane__tree {
  flex: 1;
  min-height: 0;
}

.pane-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.archive-main {
  min-width: 0;
  display: flex;

  :deep(.el-card) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

.archive-search {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>
