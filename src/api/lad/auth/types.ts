/** 三员 + 业务操作员 */
export type AuthUserType = 'system' | 'security' | 'audit' | 'operator'

/** 账号分级：调试 / 执勤 / 观察 */
export type AuthAccountLevel = 'debug' | 'duty' | 'observe'

export type AuthStatus = 'enabled' | 'disabled'

export interface AuthUser {
  id: string
  username: string
  account: string
  userType: AuthUserType
  accountLevel: AuthAccountLevel
  roleIds: string[]
  roleNames: string[]
  phone?: string
  email?: string
  status: AuthStatus
  lastLoginAt?: string
  createdAt: string
  /** 三员账号不可删除 */
  builtin?: boolean
}

export interface AuthUserQuery {
  pageIndex?: number
  pageSize?: number
  username?: string
  account?: string
  userType?: AuthUserType | ''
  accountLevel?: AuthAccountLevel | ''
  status?: AuthStatus | ''
}

export interface AuthUserListResult {
  list: AuthUser[]
  total: number
}

export interface AuthUserSavePayload {
  id?: string
  username: string
  account: string
  userType: AuthUserType
  accountLevel: AuthAccountLevel
  roleIds: string[]
  phone?: string
  email?: string
  status: AuthStatus
  password?: string
}

export interface AuthResetPasswordPayload {
  id: string
  newPassword: string
}

export interface AuthRole {
  id: string
  roleCode: string
  roleName: string
  userType: AuthUserType | 'any'
  status: AuthStatus
  permissionIds: string[]
  remark?: string
  updatedAt: string
}

export interface AuthRoleQuery {
  pageIndex?: number
  pageSize?: number
  roleName?: string
  roleCode?: string
  status?: AuthStatus | ''
}

export interface AuthRoleListResult {
  list: AuthRole[]
  total: number
}

export interface AuthRoleSavePayload {
  id?: string
  roleCode: string
  roleName: string
  userType: AuthUserType | 'any'
  status: AuthStatus
  permissionIds: string[]
  remark?: string
}

export type PermissionNodeType = 'directory' | 'menu' | 'button'

export interface AuthPermissionNode {
  id: string
  parentId: string | null
  name: string
  permCode: string
  nodeType: PermissionNodeType
  path?: string
  sort: number
  status: AuthStatus
  children?: AuthPermissionNode[]
}

export interface AuthPermissionSavePayload {
  id: string
  permCode: string
  status: AuthStatus
}

export type AuthLogType = 'login' | 'operation'

export type AuthLogResult = 'success' | 'failure'

export interface AuthLogItem {
  id: string
  logType: AuthLogType
  operator: string
  account: string
  module: string
  action: string
  ip: string
  result: AuthLogResult
  detail?: string
  createdAt: string
}

export interface AuthLogQuery {
  pageIndex?: number
  pageSize?: number
  logType?: AuthLogType | ''
  operator?: string
  account?: string
  module?: string
  result?: AuthLogResult | ''
  createdAtStart?: string
  createdAtEnd?: string
}

export interface AuthLogListResult {
  list: AuthLogItem[]
  total: number
}
