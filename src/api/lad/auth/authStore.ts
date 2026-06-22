import { LAD_PERMISSION_SEED } from './permissionSeed'
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

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function cloneTree(nodes: AuthPermissionNode[]): AuthPermissionNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined
  }))
}

function flattenTree(
  nodes: AuthPermissionNode[],
  out: AuthPermissionNode[] = []
): AuthPermissionNode[] {
  for (const n of nodes) {
    const { children, ...rest } = n
    out.push({ ...rest })
    if (children?.length) flattenTree(children, out)
  }
  return out
}

function rebuildTree(flat: AuthPermissionNode[]): AuthPermissionNode[] {
  const map = new Map<string, AuthPermissionNode>()
  flat.forEach((n) => map.set(n.id, { ...n, children: [] }))
  const roots: AuthPermissionNode[] = []
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(node)
    } else if (!node.parentId) {
      roots.push(node)
    }
  })
  const sortNodes = (list: AuthPermissionNode[]) => {
    list.sort((a, b) => a.sort - b.sort)
    list.forEach((n) => n.children?.length && sortNodes(n.children))
  }
  sortNodes(roots)
  return roots
}

let permissionTree: AuthPermissionNode[] = cloneTree(LAD_PERMISSION_SEED)

const rolesSeed: AuthRole[] = [
  {
    id: 'role-sys',
    roleCode: 'ROLE_SYSTEM_ADMIN',
    roleName: '系统管理员',
    userType: 'system',
    status: 'enabled',
    permissionIds: flattenTree(cloneTree(LAD_PERMISSION_SEED)).map((p) => p.id),
    remark: '三员-系统管理员，负责系统配置与用户维护',
    updatedAt: '2026-05-18 08:00:00'
  },
  {
    id: 'role-sec',
    roleCode: 'ROLE_SECURITY_ADMIN',
    roleName: '安全保密员',
    userType: 'security',
    status: 'enabled',
    permissionIds: [
      'pm-root',
      'pm-incident',
      'pm-incident-view',
      'pm-list',
      'pm-list-view',
      'pm-list-save',
      'pm-device',
      'pm-device-archive',
      'pm-device-archive-view',
      'pm-device-info',
      'pm-device-info-view',
      'pm-area',
      'pm-area-view',
      'pm-area-save',
      'pm-threat',
      'pm-threat-view',
      'pm-threat-save',
      'pm-plan',
      'pm-plan-view',
      'pm-plan-save',
      'pm-auth',
      'pm-auth-user',
      'pm-auth-user-save',
      'pm-auth-role',
      'pm-auth-role-save',
      'pm-auth-perm',
      'pm-auth-perm-edit'
    ],
    remark: '三员-安全保密员，负责权限与角色分配',
    updatedAt: '2026-05-18 08:05:00'
  },
  {
    id: 'role-audit',
    roleCode: 'ROLE_AUDIT_ADMIN',
    roleName: '安全审计员',
    userType: 'audit',
    status: 'enabled',
    permissionIds: [
      'pm-root',
      'pm-incident',
      'pm-incident-view',
      'pm-auth',
      'pm-auth-log',
      'pm-auth-log-view',
      'pm-system',
      'pm-system-params',
      'pm-system-params-edit'
    ],
    remark: '三员-安全审计员，只读业务与日志审计',
    updatedAt: '2026-05-18 08:10:00'
  },
  {
    id: 'role-duty',
    roleCode: 'ROLE_DUTY_OPERATOR',
    roleName: '执勤操作员',
    userType: 'operator',
    status: 'enabled',
    permissionIds: [
      'pm-root',
      'pm-incident',
      'pm-incident-view',
      'pm-incident-export',
      'pm-list',
      'pm-list-view',
      'pm-list-save',
      'pm-area',
      'pm-area-view',
      'pm-threat',
      'pm-threat-view',
      'pm-plan',
      'pm-plan-view'
    ],
    remark: '执勤席日常处置',
    updatedAt: '2026-05-19 10:00:00'
  },
  {
    id: 'role-observe',
    roleCode: 'ROLE_OBSERVE',
    roleName: '观察员',
    userType: 'operator',
    status: 'enabled',
    permissionIds: [
      'pm-root',
      'pm-incident',
      'pm-incident-view',
      'pm-list',
      'pm-list-view',
      'pm-area',
      'pm-area-view',
      'pm-threat',
      'pm-threat-view'
    ],
    remark: '只读观察，无写操作',
    updatedAt: '2026-05-19 10:05:00'
  }
]

let allRoles: AuthRole[] = rolesSeed.map((r) => ({ ...r, permissionIds: [...r.permissionIds] }))

const usersSeed: AuthUser[] = [
  {
    id: 'u-sys',
    username: '系统管理员',
    account: 'sysadmin',
    userType: 'system',
    accountLevel: 'debug',
    roleIds: ['role-sys'],
    roleNames: ['系统管理员'],
    phone: '13800001001',
    email: 'sysadmin@lad.local',
    status: 'enabled',
    lastLoginAt: '2026-05-20 08:30:00',
    createdAt: '2026-05-01 09:00:00',
    builtin: true
  },
  {
    id: 'u-sec',
    username: '安全保密员',
    account: 'secadmin',
    userType: 'security',
    accountLevel: 'debug',
    roleIds: ['role-sec'],
    roleNames: ['安全保密员'],
    phone: '13800001002',
    email: 'secadmin@lad.local',
    status: 'enabled',
    lastLoginAt: '2026-05-20 09:00:00',
    createdAt: '2026-05-01 09:00:00',
    builtin: true
  },
  {
    id: 'u-audit',
    username: '安全审计员',
    account: 'auditadmin',
    userType: 'audit',
    accountLevel: 'observe',
    roleIds: ['role-audit'],
    roleNames: ['安全审计员'],
    phone: '13800001003',
    email: 'auditadmin@lad.local',
    status: 'enabled',
    lastLoginAt: '2026-05-20 09:15:00',
    createdAt: '2026-05-01 09:00:00',
    builtin: true
  },
  {
    id: 'u-duty-01',
    username: '张执勤',
    account: 'zhangduty',
    userType: 'operator',
    accountLevel: 'duty',
    roleIds: ['role-duty'],
    roleNames: ['执勤操作员'],
    phone: '13800002001',
    status: 'enabled',
    lastLoginAt: '2026-05-19 22:10:00',
    createdAt: '2026-05-10 14:00:00'
  },
  {
    id: 'u-duty-02',
    username: '李观察',
    account: 'liobserve',
    userType: 'operator',
    accountLevel: 'observe',
    roleIds: ['role-observe'],
    roleNames: ['观察员'],
    status: 'enabled',
    lastLoginAt: '2026-05-18 16:40:00',
    createdAt: '2026-05-12 11:00:00'
  },
  {
    id: 'u-debug',
    username: '王调试',
    account: 'wangdebug',
    userType: 'operator',
    accountLevel: 'debug',
    roleIds: ['role-duty', 'role-observe'],
    roleNames: ['执勤操作员', '观察员'],
    phone: '13800002003',
    status: 'disabled',
    createdAt: '2026-05-15 10:00:00'
  }
]

let allUsers: AuthUser[] = usersSeed.map((u) => ({ ...u }))

const logsSeed: AuthLogItem[] = [
  {
    id: 'log-001',
    logType: 'login',
    operator: '系统管理员',
    account: 'sysadmin',
    module: '登录',
    action: '用户登录',
    ip: '192.168.1.101',
    result: 'success',
    detail: '登录成功',
    createdAt: '2026-05-20 08:30:12'
  },
  {
    id: 'log-002',
    logType: 'operation',
    operator: '安全保密员',
    account: 'secadmin',
    module: '角色管理',
    action: '分配权限',
    ip: '192.168.1.102',
    result: 'success',
    detail: '为角色「执勤操作员」更新功能权限',
    createdAt: '2026-05-20 09:05:33'
  },
  {
    id: 'log-003',
    logType: 'operation',
    operator: '张执勤',
    account: 'zhangduty',
    module: '黑白名单管理',
    action: '新增目标',
    ip: '192.168.2.50',
    result: 'success',
    detail: '目标 SN=UAV-20260520-001 加入黑名单',
    createdAt: '2026-05-19 22:12:08'
  },
  {
    id: 'log-004',
    logType: 'login',
    operator: '李观察',
    account: 'liobserve',
    module: '登录',
    action: '用户登录',
    ip: '192.168.2.51',
    result: 'success',
    createdAt: '2026-05-18 16:40:01'
  },
  {
    id: 'log-005',
    logType: 'login',
    operator: '王调试',
    account: 'wangdebug',
    module: '登录',
    action: '用户登录',
    ip: '10.0.0.88',
    result: 'failure',
    detail: '账号已停用',
    createdAt: '2026-05-17 11:20:45'
  },
  {
    id: 'log-006',
    logType: 'operation',
    operator: '系统管理员',
    account: 'sysadmin',
    module: '参数配置',
    action: '修改参数',
    ip: '192.168.1.101',
    result: 'success',
    detail: '修改 sys.session.timeout = 30',
    createdAt: '2026-05-20 10:15:00'
  },
  {
    id: 'log-007',
    logType: 'operation',
    operator: '安全审计员',
    account: 'auditadmin',
    module: '日志管理',
    action: '查看日志',
    ip: '192.168.1.103',
    result: 'success',
    detail: '查看操作日志 log-003',
    createdAt: '2026-05-20 09:20:18'
  },
  {
    id: 'log-008',
    logType: 'operation',
    operator: '张执勤',
    account: 'zhangduty',
    module: '区域管理',
    action: '保存区域',
    ip: '192.168.2.50',
    result: 'success',
    detail: '更新三级防护区边界',
    createdAt: '2026-05-19 15:33:22'
  }
]

const allLogs: AuthLogItem[] = [...logsSeed]

function roleNamesByIds(ids: string[]) {
  return ids.map((id) => allRoles.find((r) => r.id === id)?.roleName).filter(Boolean) as string[]
}

function filterUsers(q: AuthUserQuery): AuthUser[] {
  let rows = [...allUsers]
  if (q.username?.trim()) {
    const kw = q.username.trim().toLowerCase()
    rows = rows.filter((r) => r.username.toLowerCase().includes(kw))
  }
  if (q.account?.trim()) {
    const kw = q.account.trim().toLowerCase()
    rows = rows.filter((r) => r.account.toLowerCase().includes(kw))
  }
  if (q.userType) rows = rows.filter((r) => r.userType === q.userType)
  if (q.accountLevel) rows = rows.filter((r) => r.accountLevel === q.accountLevel)
  if (q.status) rows = rows.filter((r) => r.status === q.status)
  return rows
}

export function queryAuthUserList(q: AuthUserQuery): AuthUserListResult {
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 10
  const filtered = filterUsers(q)
  const start = (pageIndex - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total: filtered.length }
}

export function saveAuthUser(body: AuthUserSavePayload): AuthUser {
  const now = formatNow()
  const roleNames = roleNamesByIds(body.roleIds)
  if (body.id) {
    const idx = allUsers.findIndex((u) => u.id === body.id)
    if (idx < 0) throw new Error('用户不存在')
    if (allUsers.some((u) => u.account === body.account && u.id !== body.id)) {
      throw new Error('登录账号已存在')
    }
    const row: AuthUser = {
      ...allUsers[idx],
      username: body.username.trim(),
      account: body.account.trim(),
      userType: body.userType,
      accountLevel: body.accountLevel,
      roleIds: [...body.roleIds],
      roleNames,
      phone: body.phone?.trim(),
      email: body.email?.trim(),
      status: body.status
    }
    allUsers[idx] = row
    appendLog(
      'operation',
      row.username,
      row.account,
      '用户管理',
      body.id === row.id ? '修改用户' : '修改用户',
      `更新用户 ${row.account}`
    )
    return { ...row }
  }
  if (allUsers.some((u) => u.account === body.account)) throw new Error('登录账号已存在')
  const row: AuthUser = {
    id: `u-${Date.now()}`,
    username: body.username.trim(),
    account: body.account.trim(),
    userType: body.userType,
    accountLevel: body.accountLevel,
    roleIds: [...body.roleIds],
    roleNames,
    phone: body.phone?.trim(),
    email: body.email?.trim(),
    status: body.status,
    createdAt: now
  }
  allUsers.push(row)
  appendLog('operation', '系统', 'sysadmin', '用户管理', '新增用户', `创建用户 ${row.account}`)
  return { ...row }
}

export function deleteAuthUsers(ids: string[]) {
  const blocked = ids.filter((id) => allUsers.find((u) => u.id === id)?.builtin)
  if (blocked.length) throw new Error('三员内置账号不可删除')
  const set = new Set(ids)
  allUsers = allUsers.filter((u) => !set.has(u.id))
  appendLog('operation', '系统', 'sysadmin', '用户管理', '删除用户', `删除 ${ids.length} 个用户`)
}

export function resetAuthPassword(body: AuthResetPasswordPayload) {
  const user = allUsers.find((u) => u.id === body.id)
  if (!user) throw new Error('用户不存在')
  appendLog(
    'operation',
    user.username,
    user.account,
    '用户管理',
    '重置密码',
    `为用户 ${user.account} 重置密码`
  )
}

function appendLog(
  logType: AuthLogItem['logType'],
  operator: string,
  account: string,
  module: string,
  action: string,
  detail?: string
) {
  allLogs.unshift({
    id: `log-${Date.now()}`,
    logType,
    operator,
    account,
    module,
    action,
    ip: '127.0.0.1',
    result: 'success',
    detail,
    createdAt: formatNow()
  })
}

export function queryAuthRoleList(q: AuthRoleQuery): AuthRoleListResult {
  let rows = [...allRoles]
  if (q.roleName?.trim()) {
    const kw = q.roleName.trim().toLowerCase()
    rows = rows.filter((r) => r.roleName.toLowerCase().includes(kw))
  }
  if (q.roleCode?.trim()) {
    const kw = q.roleCode.trim().toLowerCase()
    rows = rows.filter((r) => r.roleCode.toLowerCase().includes(kw))
  }
  if (q.status) rows = rows.filter((r) => r.status === q.status)
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 10
  const start = (pageIndex - 1) * pageSize
  return { list: rows.slice(start, start + pageSize), total: rows.length }
}

export function listAllRoles() {
  return allRoles.map((r) => ({ ...r }))
}

export function saveAuthRole(body: AuthRoleSavePayload): AuthRole {
  const now = formatNow()
  if (body.id) {
    const idx = allRoles.findIndex((r) => r.id === body.id)
    if (idx < 0) throw new Error('角色不存在')
    if (allRoles.some((r) => r.roleCode === body.roleCode && r.id !== body.id)) {
      throw new Error('角色编码已存在')
    }
    const row: AuthRole = {
      ...allRoles[idx],
      roleCode: body.roleCode.trim(),
      roleName: body.roleName.trim(),
      userType: body.userType,
      status: body.status,
      permissionIds: [...body.permissionIds],
      remark: body.remark,
      updatedAt: now
    }
    allRoles[idx] = row
    syncUserRoleNames()
    return { ...row }
  }
  if (allRoles.some((r) => r.roleCode === body.roleCode)) throw new Error('角色编码已存在')
  const row: AuthRole = {
    id: `role-${Date.now()}`,
    roleCode: body.roleCode.trim(),
    roleName: body.roleName.trim(),
    userType: body.userType,
    status: body.status,
    permissionIds: [...body.permissionIds],
    remark: body.remark,
    updatedAt: now
  }
  allRoles.push(row)
  return { ...row }
}

export function deleteAuthRole(id: string) {
  const role = allRoles.find((r) => r.id === id)
  if (!role) return
  if (['role-sys', 'role-sec', 'role-audit'].includes(id)) {
    throw new Error('三员内置角色不可删除')
  }
  if (allUsers.some((u) => u.roleIds.includes(id))) {
    throw new Error('仍有用户绑定该角色，无法删除')
  }
  allRoles = allRoles.filter((r) => r.id !== id)
}

function syncUserRoleNames() {
  allUsers = allUsers.map((u) => ({
    ...u,
    roleNames: roleNamesByIds(u.roleIds)
  }))
}

export function getPermissionTree() {
  return cloneTree(permissionTree)
}

export function saveAuthPermission(body: AuthPermissionSavePayload) {
  const flat = flattenTree(cloneTree(permissionTree))
  const idx = flat.findIndex((p) => p.id === body.id)
  if (idx < 0) throw new Error('权限节点不存在')
  flat[idx] = { ...flat[idx], permCode: body.permCode.trim(), status: body.status }
  permissionTree = rebuildTree(flat)
  return flat[idx]
}

export function queryAuthLogList(q: AuthLogQuery): AuthLogListResult {
  let rows = [...allLogs]
  if (q.logType) rows = rows.filter((r) => r.logType === q.logType)
  if (q.operator?.trim()) {
    const kw = q.operator.trim().toLowerCase()
    rows = rows.filter((r) => r.operator.toLowerCase().includes(kw))
  }
  if (q.account?.trim()) {
    const kw = q.account.trim().toLowerCase()
    rows = rows.filter((r) => r.account.toLowerCase().includes(kw))
  }
  if (q.module?.trim()) {
    const kw = q.module.trim().toLowerCase()
    rows = rows.filter((r) => r.module.toLowerCase().includes(kw))
  }
  if (q.result) rows = rows.filter((r) => r.result === q.result)
  if (q.createdAtStart) rows = rows.filter((r) => r.createdAt >= q.createdAtStart!)
  if (q.createdAtEnd) rows = rows.filter((r) => r.createdAt <= q.createdAtEnd!)
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 10
  const start = (pageIndex - 1) * pageSize
  return { list: rows.slice(start, start + pageSize), total: rows.length }
}

export function getAuthLog(id: string) {
  const row = allLogs.find((l) => l.id === id)
  return row ? { ...row } : null
}
