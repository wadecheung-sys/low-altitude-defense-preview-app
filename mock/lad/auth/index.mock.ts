import { SUCCESS_CODE } from '@/constants'
import {
  deleteAuthRole,
  deleteAuthUsers,
  getAuthLog,
  getPermissionTree,
  listAllRoles,
  queryAuthLogList,
  queryAuthRoleList,
  queryAuthUserList,
  resetAuthPassword,
  saveAuthPermission,
  saveAuthRole,
  saveAuthUser
} from '@/api/lad/auth/authStore'
import type {
  AuthLogQuery,
  AuthRoleQuery,
  AuthUserQuery
} from '@/api/lad/auth/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/auth/user/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: AuthUserQuery }) => ({
      code: SUCCESS_CODE,
      data: queryAuthUserList(query)
    })
  },
  {
    url: '/mock/lad/auth/user/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof saveAuthUser>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: saveAuthUser(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/auth/user/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => {
      try {
        deleteAuthUsers(body.ids)
        return { code: SUCCESS_CODE, data: null }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '删除失败' }
      }
    }
  },
  {
    url: '/mock/lad/auth/user/reset-password',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof resetAuthPassword>[0] }) => {
      try {
        resetAuthPassword(body)
        return { code: SUCCESS_CODE, data: null }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '重置失败' }
      }
    }
  },
  {
    url: '/mock/lad/auth/role/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: AuthRoleQuery }) => ({
      code: SUCCESS_CODE,
      data: queryAuthRoleList(query)
    })
  },
  {
    url: '/mock/lad/auth/role/options',
    method: 'get',
    timeout,
    response: () => ({ code: SUCCESS_CODE, data: listAllRoles() })
  },
  {
    url: '/mock/lad/auth/role/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof saveAuthRole>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: saveAuthRole(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/auth/role/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { id: string } }) => {
      try {
        deleteAuthRole(body.id)
        return { code: SUCCESS_CODE, data: null }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '删除失败' }
      }
    }
  },
  {
    url: '/mock/lad/auth/permission/tree',
    method: 'get',
    timeout,
    response: () => ({ code: SUCCESS_CODE, data: getPermissionTree() })
  },
  {
    url: '/mock/lad/auth/permission/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof saveAuthPermission>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: saveAuthPermission(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/auth/log/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: AuthLogQuery }) => ({
      code: SUCCESS_CODE,
      data: queryAuthLogList(query)
    })
  },
  {
    url: '/mock/lad/auth/log/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id: string } }) => {
      const row = getAuthLog(query.id)
      if (!row) return { code: 404, message: '日志不存在' }
      return { code: SUCCESS_CODE, data: row }
    }
  }
]
