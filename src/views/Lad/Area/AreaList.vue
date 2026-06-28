<script setup lang="tsx">
import { deleteAreaRegionApi, getAreaRegionListApi } from '@/api/lad/area'
import type { AreaRegion, AreaSiteTreeNode } from '@/api/lad/area/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { AREA_REGION_TYPE_META, AREA_REGION_TYPE_OPTIONS, regionTypeLabel } from './areaConstants'
import SiteArchitectureTree from './components/SiteArchitectureTree.vue'
import { ElInput, ElLink, ElMessage, ElMessageBox, ElTag, ElTree } from 'element-plus'
import { computed, onMounted, reactive, ref, unref } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'LadAreaList' })

const { push } = useRouter()
const viewMode = ref<'manage' | 'architecture'>('manage')
const ids = ref<string[]>([])
const searchParams = ref<Recordable>({})
const treeKeyword = ref('')
const selectedRootId = ref('')
const allSites = ref<AreaRegion[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()
const SITE_SEARCH_COL = { span: 5 } as const

function buildTree(rows: AreaRegion[]): AreaSiteTreeNode[] {
  const nodes = new Map<string, AreaSiteTreeNode>()
  rows.forEach((row) =>
    nodes.set(row.id, {
      id: row.id,
      label: row.name,
      siteCode: row.siteCode,
      regionType: row.regionType,
      children: []
    })
  )
  const roots: AreaSiteTreeNode[] = []
  rows.forEach((row) => {
    const node = nodes.get(row.id)!
    const parent = row.parentId ? nodes.get(row.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}

const siteTree = computed(() => buildTree(allSites.value))
const manageTree = computed(() => [
  {
    id: '__all__',
    label: '全部区域',
    siteCode: '',
    regionType: 'other' as const,
    children: siteTree.value
  }
])

async function loadSiteTree() {
  const res = await getAreaRegionListApi({ pageIndex: 1, pageSize: 500 })
  allSites.value = res.data.list
}

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    siteCode: params.siteCode,
    name: params.name,
    regionType: params.regionType || undefined
  }
  currentPage.value = 1
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getAreaRegionListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      rootId: selectedRootId.value || undefined,
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  },
  fetchDelApi: async () => {
    for (const id of unref(ids)) await deleteAreaRegionApi(id)
    await loadSiteTree()
    return true
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList, delList } = tableMethods
const delLoading = ref(false)

function onTreeNodeClick(node: AreaSiteTreeNode) {
  selectedRootId.value = node.id === '__all__' ? '' : node.id
  currentPage.value = 1
  getList()
}

function filterTreeNode(value: string, data: AreaSiteTreeNode) {
  if (!value) return true
  const keyword = value.toLowerCase()
  return data.label.toLowerCase().includes(keyword) || data.siteCode.toLowerCase().includes(keyword)
}

function filterTree(value: string) {
  treeRef.value?.filter(value)
}

function onSelectionChange(rows: AreaRegion[]) {
  ids.value = rows.map((row) => row.id)
}

function openCreate() {
  push('/lad/area/add')
}
function openEdit(row: AreaRegion) {
  push(`/lad/area/edit/${row.id}`)
}

async function delData(row: AreaRegion | null) {
  const targets = row ? [row.id] : ids.value
  if (!targets.length) {
    ElMessage.warning('请先勾选需要删除的区域')
    return
  }
  try {
    await ElMessageBox.confirm(
      row ? `确认删除区域“${row.name}”吗？` : `确认删除选中的 ${targets.length} 个区域吗？`,
      '删除确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  delLoading.value = true
  try {
    for (const id of targets) await deleteAreaRegionApi(id)
    ids.value = []
    ElMessage.success('删除成功')
    await loadSiteTree()
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
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'siteCode',
    label: '区域编号',
    minWidth: 120,
    search: {
      component: 'Input',
      colProps: SITE_SEARCH_COL,
      componentProps: { placeholder: '请输入区域编号', clearable: true, style: { width: '100%' } }
    },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'name',
    label: '区域名称',
    minWidth: 150,
    search: {
      component: 'Input',
      colProps: SITE_SEARCH_COL,
      componentProps: { placeholder: '请输入区域名称', clearable: true, style: { width: '100%' } }
    },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: AreaRegion }) => (
          <ElLink type="primary" underline={false} onClick={() => openEdit(row)}>
            {row.name}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'parentSiteCode',
    label: '上级区域编号',
    minWidth: 135,
    search: { hidden: true },
    table: { slots: { default: ({ row }: { row: AreaRegion }) => row.parentSiteCode || '-' } }
  },
  {
    field: 'parentSiteName',
    label: '上级区域名称',
    minWidth: 140,
    search: { hidden: true },
    table: {
      showOverflowTooltip: true,
      slots: { default: ({ row }: { row: AreaRegion }) => row.parentSiteName || '-' }
    }
  },
  {
    field: 'regionType',
    label: '区域类型',
    minWidth: 115,
    search: {
      component: 'Select',
      colProps: SITE_SEARCH_COL,
      componentProps: {
        options: [{ label: '全部', value: '' }, ...AREA_REGION_TYPE_OPTIONS],
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: AreaRegion }) => (
          <ElTag
            type={AREA_REGION_TYPE_META[row.regionType].tagType || 'info'}
            size="small"
            effect="light"
          >
            {regionTypeLabel(row.regionType)}
          </ElTag>
        )
      }
    }
  },
  { field: 'clipPriority', label: '区域优先级', minWidth: 105, search: { hidden: true } },
  {
    field: 'createdAt',
    label: '创建时间',
    minWidth: 168,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'action',
    label: '操作',
    width: '190px',
    fixed: 'right',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: AreaRegion }) => (
          <>
            <BaseButton type="primary" onClick={() => openEdit(row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" onClick={() => delData(row)}>
              删除
            </BaseButton>
          </>
        )
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)
onMounted(loadSiteTree)
</script>

<template>
  <div class="site-view-tabs">
    <button :class="{ 'is-active': viewMode === 'manage' }" @click="viewMode = 'manage'"
      >区域管理</button
    >
    <button :class="{ 'is-active': viewMode === 'architecture' }" @click="viewMode = 'architecture'"
      >区域架构</button
    >
  </div>

  <div v-if="viewMode === 'manage'" class="site-manage-layout">
    <ContentWrap class="site-tree-pane">
      <div class="pane-title">区域层级</div>
      <ElInput
        v-model="treeKeyword"
        class="mb-12px"
        placeholder="搜索区域名称或编号"
        clearable
        @input="filterTree"
      />
      <ElTree
        ref="treeRef"
        :data="manageTree"
        node-key="id"
        default-expand-all
        highlight-current
        :expand-on-click-node="false"
        :filter-node-method="filterTreeNode"
        @node-click="onTreeNodeClick"
      >
        <template #default="{ data }">
          <span class="site-tree-node">
            <span>{{ data.label }}</span>
            <small v-if="data.siteCode">{{ data.siteCode }}</small>
          </span>
        </template>
      </ElTree>
    </ContentWrap>

    <ContentWrap class="site-list-pane">
      <Search
        :schema="allSchemas.searchSchema"
        @search="setSearchParams"
        @reset="setSearchParams"
      />
      <div class="mb-10px">
        <BaseButton type="primary" @click="openCreate">新增区域</BaseButton>
        <BaseButton type="danger" :loading="delLoading" @click="delData(null)">批量删除</BaseButton>
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
        @selection-change="onSelectionChange"
      />
    </ContentWrap>
  </div>

  <ContentWrap v-else class="architecture-pane">
    <div class="pane-title">区域架构图</div>
    <div v-if="siteTree.length" class="architecture-canvas">
      <SiteArchitectureTree :nodes="siteTree" />
    </div>
    <div v-else class="architecture-empty">暂无区域数据</div>
  </ContentWrap>
</template>

<style scoped lang="less">
.site-view-tabs {
  display: flex;
  height: 48px;
  margin: -10px -10px 14px;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  align-items: stretch;
  gap: 12px;
}

.site-view-tabs button {
  position: relative;
  min-width: 112px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 16px;
  cursor: pointer;
}

.site-view-tabs button.is-active {
  color: var(--el-color-primary);
  font-weight: 600;
}
.site-view-tabs button.is-active::after {
  position: absolute;
  right: 12px;
  bottom: 0;
  left: 12px;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--el-color-primary);
  content: '';
}
.site-manage-layout {
  display: flex;
  width: 100%;
  align-items: stretch;
  gap: 16px;
}
.site-tree-pane {
  flex: 0 0 260px;
  width: 260px;
}
.site-list-pane {
  min-width: 0;
  flex: 1;
}
.pane-title {
  margin-bottom: 14px;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}
.site-tree-node {
  display: flex;
  width: calc(100% - 8px);
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.site-tree-node span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.site-tree-node small {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}
.architecture-pane {
  min-height: calc(100vh - 190px);
}
.architecture-canvas {
  min-width: 900px;
  padding: 65px 28px 100px;
  overflow: auto;
}
.architecture-empty {
  padding: 120px 0;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@media (max-width: 1000px) {
  .site-manage-layout {
    flex-direction: column;
  }
  .site-tree-pane {
    width: 100%;
    flex-basis: auto;
  }
}
</style>
