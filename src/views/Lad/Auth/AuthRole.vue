<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteAuthRoleApi, getAuthRoleListApi } from '@/api/lad/auth'
import type { AuthRole } from '@/api/lad/auth/types'
import RoleFormDialog from './components/RoleFormDialog.vue'
import RolePermissionDialog from './components/RolePermissionDialog.vue'
import { statusOptions, userTypeLabel } from './authConstants'
import { reactive, ref, unref } from 'vue'
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

defineOptions({ name: 'LadAuthRole' })

const searchParams = ref<Recordable>({})
const formVisible = ref(false)
const permVisible = ref(false)
const formRow = ref<AuthRole>()
const permRow = ref<AuthRole>()

const builtinIds = ['role-sys', 'role-sec', 'role-audit']

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    roleName: params.roleName,
    roleCode: params.roleCode,
    status: params.status
  }
  currentPage.value = 1
  getList()
}

const openAdd = () => {
  formRow.value = undefined
  formVisible.value = true
}

const openEdit = (row: AuthRole) => {
  formRow.value = row
  formVisible.value = true
}

const openPerm = (row: AuthRole) => {
  permRow.value = row
  permVisible.value = true
}

async function onDelete(row: AuthRole) {
  if (builtinIds.includes(row.id)) {
    ElMessage.warning('三员内置角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.roleName}」吗？`, '删除角色', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await deleteAuthRoleApi({ id: row.id })
    ElMessage.success('已删除')
    getList()
  } catch {
    /* axios */
  }
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getAuthRoleListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

const userTypeDisplay = (t: AuthRole['userType']) => {
  if (t === 'any') return '不限'
  return userTypeLabel[t]
}

const crudSchemas = reactive<CrudSchema[]>([
  { field: 'index', label: '序号', type: 'index', search: { hidden: true } },
  {
    field: 'roleCode',
    label: '角色编码',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { minWidth: 160, showOverflowTooltip: true }
  },
  {
    field: 'roleName',
    label: '角色名称',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { minWidth: 140 }
  },
  {
    field: 'userType',
    label: '适用用户类型',
    search: { hidden: true },
    table: {
      width: 130,
      slots: {
        default: (data: { row: AuthRole }) => <span>{userTypeDisplay(data.row.userType)}</span>
      }
    }
  },
  {
    field: 'permissionIds',
    label: '权限数',
    search: { hidden: true },
    table: {
      width: 90,
      align: 'center',
      slots: {
        default: (data: { row: AuthRole }) => <span>{data.row.permissionIds.length}</span>
      }
    }
  },
  {
    field: 'status',
    label: '状态',
    search: { component: 'Select', componentProps: { options: statusOptions, clearable: true } },
    table: {
      width: 90,
      slots: {
        default: (data: { row: AuthRole }) => (
          <ElTag type={data.row.status === 'enabled' ? 'success' : 'info'}>
            {data.row.status === 'enabled' ? '启用' : '停用'}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'remark',
    label: '备注',
    search: { hidden: true },
    table: { minWidth: 160, showOverflowTooltip: true }
  },
  {
    field: 'updatedAt',
    label: '更新时间',
    search: { hidden: true },
    table: { width: 170 }
  },
  {
    field: 'action',
    label: '操作',
    search: { hidden: true },
    table: {
      width: 260,
      fixed: 'right',
      slots: {
        default: (data: { row: AuthRole }) => (
          <>
            <BaseButton type="primary" onClick={() => openEdit(data.row)}>
              编辑
            </BaseButton>
            <BaseButton type="primary" class="ml-8px" onClick={() => openPerm(data.row)}>
              分配权限
            </BaseButton>
            <BaseButton
              type="danger"
              class="ml-8px"
              disabled={builtinIds.includes(data.row.id)}
              onClick={() => onDelete(data.row)}
            >
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
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams">
      <template #action>
        <BaseButton type="primary" @click="openAdd">新增角色</BaseButton>
      </template>
    </Search>
    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
    />
    <RoleFormDialog v-model="formVisible" :row="formRow" @success="getList" />
    <RolePermissionDialog v-model="permVisible" :row="permRow" @success="getList" />
  </ContentWrap>
</template>
