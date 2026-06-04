<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { deleteAuthUserApi, getAuthUserListApi } from '@/api/lad/auth'
import type { AuthUser } from '@/api/lad/auth/types'
import UserFormDialog from './components/UserFormDialog.vue'
import ResetPasswordDialog from './components/ResetPasswordDialog.vue'
import {
  accountLevelLabel,
  accountLevelOptions,
  statusOptions,
  userTypeLabel,
  userTypeOptions
} from './authConstants'
import { reactive, ref, unref } from 'vue'
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

defineOptions({ name: 'LadAuthUser' })

const ids = ref<string[]>([])
const searchParams = ref<Recordable>({})
const formVisible = ref(false)
const resetVisible = ref(false)
const formRow = ref<AuthUser>()
const resetRow = ref<AuthUser>()

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    username: params.username,
    account: params.account,
    userType: params.userType,
    accountLevel: params.accountLevel,
    status: params.status
  }
  currentPage.value = 1
  getList()
}

const openAdd = () => {
  formRow.value = undefined
  formVisible.value = true
}

const openEdit = (row: AuthUser) => {
  formRow.value = row
  formVisible.value = true
}

const openReset = (row: AuthUser) => {
  resetRow.value = row
  resetVisible.value = true
}

const onSelectionChange = (rows: AuthUser[]) => {
  ids.value = rows.map((r) => r.id)
}

async function batchDelete() {
  if (!ids.value.length) {
    ElMessage.warning('请先勾选用户')
    return
  }
  if (ids.value.some((id) => dataList.value.find((u) => u.id === id)?.builtin)) {
    ElMessage.warning('选中项包含三员内置账号，无法删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.value.length} 个用户吗？`, '批量删除', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await deleteAuthUserApi({ ids: ids.value })
    ElMessage.success('已删除')
    ids.value = []
    getList()
  } catch {
    /* axios 提示 */
  }
}

async function onDelete(row: AuthUser) {
  if (row.builtin) {
    ElMessage.warning('三员内置账号不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.username}」吗？`, '删除用户', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await deleteAuthUserApi({ ids: [row.id] })
    ElMessage.success('已删除')
    getList()
  } catch {
    /* axios 提示 */
  }
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getAuthUserListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

const crudSchemas = reactive<CrudSchema[]>([
  { field: 'selection', search: { hidden: true }, table: { type: 'selection' } },
  { field: 'index', label: '序号', type: 'index', search: { hidden: true } },
  {
    field: 'username',
    label: '姓名',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { minWidth: 100 }
  },
  {
    field: 'account',
    label: '登录账号',
    search: { component: 'Input', componentProps: { clearable: true } },
    table: { minWidth: 120 }
  },
  {
    field: 'userType',
    label: '用户类型',
    search: { component: 'Select', componentProps: { options: userTypeOptions, clearable: true } },
    table: {
      width: 120,
      slots: {
        default: (data: { row: AuthUser }) => <span>{userTypeLabel[data.row.userType]}</span>
      }
    }
  },
  {
    field: 'accountLevel',
    label: '账号分级',
    search: {
      component: 'Select',
      componentProps: { options: accountLevelOptions, clearable: true }
    },
    table: {
      width: 90,
      slots: {
        default: (data: { row: AuthUser }) => (
          <span>{accountLevelLabel[data.row.accountLevel]}</span>
        )
      }
    }
  },
  {
    field: 'roleNames',
    label: '角色',
    search: { hidden: true },
    table: {
      minWidth: 140,
      slots: {
        default: (data: { row: AuthUser }) => (
          <span>{data.row.roleNames?.join('、') || '-'}</span>
        )
      }
    }
  },
  {
    field: 'phone',
    label: '手机号',
    search: { hidden: true },
    table: { width: 120 }
  },
  {
    field: 'status',
    label: '状态',
    search: { component: 'Select', componentProps: { options: statusOptions, clearable: true } },
    table: {
      width: 80,
      slots: {
        default: (data: { row: AuthUser }) => (
          <ElTag type={data.row.status === 'enabled' ? 'success' : 'info'}>
            {data.row.status === 'enabled' ? '启用' : '停用'}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'lastLoginAt',
    label: '最近登录',
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
        default: (data: { row: AuthUser }) => (
          <>
            <BaseButton type="primary" onClick={() => openEdit(data.row)}>
              编辑
            </BaseButton>
            <BaseButton type="primary" class="ml-8px" onClick={() => openReset(data.row)}>
              重置密码
            </BaseButton>
            <BaseButton
              type="danger"
              class="ml-8px"
              disabled={!!data.row.builtin}
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
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
    <div class="mb-10px">
      <BaseButton type="primary" @click="openAdd">新增</BaseButton>
      <BaseButton type="danger" class="ml-12px" @click="batchDelete">批量删除</BaseButton>
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
    <UserFormDialog v-model="formVisible" :row="formRow" @success="getList" />
    <ResetPasswordDialog v-model="resetVisible" :row="resetRow" @success="getList" />
  </ContentWrap>
</template>
