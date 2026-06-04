<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { getAuthPermissionTreeApi } from '@/api/lad/auth'
import type { AuthPermissionNode } from '@/api/lad/auth/types'
import PermissionEditDialog from './components/PermissionEditDialog.vue'
import { permTypeLabel } from './authConstants'
import { onMounted, reactive, ref } from 'vue'
import type { TableColumn } from '@/components/Table'
import { ElInput, ElTag } from 'element-plus'

defineOptions({ name: 'LadAuthPermission' })

const loading = ref(false)
const dataList = ref<AuthPermissionNode[]>([])
const keyword = ref('')
const editVisible = ref(false)
const editRow = ref<AuthPermissionNode>()

function filterTree(nodes: AuthPermissionNode[], kw: string): AuthPermissionNode[] {
  if (!kw) return nodes
  const lower = kw.toLowerCase()
  const walk = (list: AuthPermissionNode[]): AuthPermissionNode[] => {
    const out: AuthPermissionNode[] = []
    for (const n of list) {
      const children = n.children ? walk(n.children) : []
      const hit =
        n.name.toLowerCase().includes(lower) || n.permCode.toLowerCase().includes(lower)
      if (hit || children.length) {
        out.push({ ...n, children: children.length ? children : undefined })
      }
    }
    return out
  }
  return walk(nodes)
}

const displayList = ref<AuthPermissionNode[]>([])

async function loadTree() {
  loading.value = true
  try {
    const res = await getAuthPermissionTreeApi()
    dataList.value = res.data || []
    applyFilter()
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  displayList.value = filterTree(dataList.value, keyword.value.trim())
}

function onSearch() {
  applyFilter()
}

function onReset() {
  keyword.value = ''
  applyFilter()
}

function openEdit(row: AuthPermissionNode) {
  editRow.value = row
  editVisible.value = true
}

onMounted(loadTree)

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '权限名称', minWidth: 200, showOverflowTooltip: true },
  {
    field: 'permCode',
    label: '权限标识',
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    field: 'nodeType',
    label: '类型',
    width: 90,
    slots: {
      default: (data: { row: AuthPermissionNode }) => (
        <span>{permTypeLabel[data.row.nodeType]}</span>
      )
    }
  },
  {
    field: 'path',
    label: '路由',
    minWidth: 160,
    showOverflowTooltip: true,
    slots: {
      default: (data: { row: AuthPermissionNode }) => <span>{data.row.path || '-'}</span>
    }
  },
  {
    field: 'status',
    label: '状态',
    width: 90,
    slots: {
      default: (data: { row: AuthPermissionNode }) => (
        <ElTag type={data.row.status === 'enabled' ? 'success' : 'info'}>
          {data.row.status === 'enabled' ? '启用' : '停用'}
        </ElTag>
      )
    }
  },
  {
    field: 'action',
    label: '操作',
    width: 100,
    fixed: 'right',
    slots: {
      default: (data: { row: AuthPermissionNode }) => (
        <BaseButton type="primary" onClick={() => openEdit(data.row)}>
          编辑
        </BaseButton>
      )
    }
  }
])
</script>

<template>
  <ContentWrap>
    <div class="lad-auth-perm-toolbar mb-10px">
      <span class="lad-auth-perm-toolbar__label">关键词</span>
      <ElInput
        v-model="keyword"
        class="lad-auth-perm-toolbar__input"
        placeholder="权限名称 / 标识"
        clearable
        @keyup.enter="onSearch"
      />
      <BaseButton type="primary" @click="onSearch">查询</BaseButton>
      <BaseButton class="ml-12px" @click="onReset">重置</BaseButton>
    </div>
    <Table
      :columns="tableColumns"
      :data="displayList"
      :loading="loading"
      rowKey="id"
      :defaultExpandAll="true"
    />
    <PermissionEditDialog v-model="editVisible" :row="editRow" @success="loadTree" />
  </ContentWrap>
</template>

<style scoped>
.lad-auth-perm-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.lad-auth-perm-toolbar__label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.lad-auth-perm-toolbar__input {
  width: 240px;
}
</style>
