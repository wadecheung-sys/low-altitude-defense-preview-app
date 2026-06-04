import request from '@/axios'
import type {
  AuthLogItem,
  AuthLogListResult,
  AuthLogQuery,
  AuthPermissionNode,
  AuthPermissionSavePayload,
  AuthResetPasswordPayload,
  AuthRole,
  AuthRoleListResult,
  AuthRoleQuery,
  AuthRoleSavePayload,
  AuthUser,
  AuthUserListResult,
  AuthUserQuery,
  AuthUserSavePayload
} from './types'

export function getAuthUserListApi(params: AuthUserQuery): Promise<IResponse<AuthUserListResult>> {
  return request.get({ url: '/mock/lad/auth/user/list', params })
}

export function saveAuthUserApi(data: AuthUserSavePayload): Promise<IResponse<AuthUser>> {
  return request.post({ url: '/mock/lad/auth/user/save', data })
}

export function deleteAuthUserApi(data: { ids: string[] }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/auth/user/delete', data })
}

export function resetAuthPasswordApi(data: AuthResetPasswordPayload): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/auth/user/reset-password', data })
}

export function getAuthRoleListApi(params: AuthRoleQuery): Promise<IResponse<AuthRoleListResult>> {
  return request.get({ url: '/mock/lad/auth/role/list', params })
}

export function getAuthRoleOptionsApi(): Promise<IResponse<AuthRole[]>> {
  return request.get({ url: '/mock/lad/auth/role/options' })
}

export function saveAuthRoleApi(data: AuthRoleSavePayload): Promise<IResponse<AuthRole>> {
  return request.post({ url: '/mock/lad/auth/role/save', data })
}

export function deleteAuthRoleApi(data: { id: string }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/auth/role/delete', data })
}

export function getAuthPermissionTreeApi(): Promise<IResponse<AuthPermissionNode[]>> {
  return request.get({ url: '/mock/lad/auth/permission/tree' })
}

export function saveAuthPermissionApi(
  data: AuthPermissionSavePayload
): Promise<IResponse<AuthPermissionNode>> {
  return request.post({ url: '/mock/lad/auth/permission/save', data })
}

export function getAuthLogListApi(params: AuthLogQuery): Promise<IResponse<AuthLogListResult>> {
  return request.get({ url: '/mock/lad/auth/log/list', params })
}

export function getAuthLogDetailApi(params: { id: string }): Promise<IResponse<AuthLogItem>> {
  return request.get({ url: '/mock/lad/auth/log/detail', params })
}
