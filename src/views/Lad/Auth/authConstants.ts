import type { AuthAccountLevel, AuthLogType, AuthUserType, PermissionNodeType } from '@/api/lad/auth/types'

export const userTypeOptions = [
  { label: '系统管理员', value: 'system' },
  { label: '安全保密员', value: 'security' },
  { label: '安全审计员', value: 'audit' },
  { label: '业务操作员', value: 'operator' }
]

export const userTypeLabel: Record<AuthUserType, string> = {
  system: '系统管理员',
  security: '安全保密员',
  audit: '安全审计员',
  operator: '业务操作员'
}

export const accountLevelOptions = [
  { label: '调试', value: 'debug' },
  { label: '执勤', value: 'duty' },
  { label: '观察', value: 'observe' }
]

export const accountLevelLabel: Record<AuthAccountLevel, string> = {
  debug: '调试',
  duty: '执勤',
  observe: '观察'
}

export const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' }
]

export const logTypeOptions = [
  { label: '登录日志', value: 'login' },
  { label: '操作日志', value: 'operation' }
]

export const logTypeLabel: Record<AuthLogType, string> = {
  login: '登录',
  operation: '操作'
}

export const logResultOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failure' }
]

export const permTypeLabel: Record<PermissionNodeType, string> = {
  directory: '目录',
  menu: '菜单',
  button: '按钮'
}

export const roleUserTypeOptions = [
  { label: '不限', value: 'any' },
  ...userTypeOptions
]
