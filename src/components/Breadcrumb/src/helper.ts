import { pathResolve } from '@/utils/routerHelper'
import type { RouteLocationNormalizedLoaded, RouteRecordNormalized } from 'vue-router'

export const filterBreadcrumb = (
  routes: AppRouteRecordRaw[] = [],
  parentPath = ''
): AppRouteRecordRaw[] => {
  const res: AppRouteRecordRaw[] = []

  for (const route of routes) {
    const meta = route?.meta
    if (!meta) continue
    if (meta.hidden && !meta.canTo) {
      continue
    }

    // getParentLayout 包装层：跳过自身标题，保留子节点链路（设备信息、字典管理等）
    if (meta.breadcrumbWrap && route.children?.length) {
      res.push(...filterBreadcrumb(route.children, pathResolve(parentPath, route.path)))
      continue
    }

    // 保留完整父级链路；单子路由不再折叠（避免「预案策略配置」等缺一级面包屑）
    const data: AppRouteRecordRaw = { ...route, children: route.children ? [...route.children] : undefined }

    data.path = pathResolve(parentPath, data.path)

    if (data.children) {
      data.children = filterBreadcrumb(data.children, data.path)
    }
    res.push(data)
  }
  return res
}

export function flattenBreadcrumbRoutes(routes: AppRouteRecordRaw[] = []): AppRouteRecordRaw[] {
  const result: AppRouteRecordRaw[] = []
  for (const route of routes) {
    const { children, ...node } = route
    result.push(node as AppRouteRecordRaw)
    if (children?.length) {
      result.push(...flattenBreadcrumbRoutes(children))
    }
  }
  return result
}

function isLayoutShell(record: RouteRecordNormalized) {
  return !record.meta?.title || record.meta.breadcrumb === false
}

function resolveWrapListChild(
  record: RouteRecordNormalized,
  flatRoutes: AppRouteRecordRaw[],
  flatByName: Map<string, AppRouteRecordRaw>
) {
  if (record.children?.length) {
    const listChild = record.children.find((child) => !child.meta?.hidden)
    if (listChild?.name) {
      return flatByName.get(String(listChild.name))
    }
  }

  const wrapPath = record.path.startsWith('/') ? record.path : `/${record.path}`
  return flatRoutes.find(
    (item) =>
      item.path.startsWith(`${wrapPath}/`) && !item.path.includes(':') && !item.meta?.hidden
  )
}

function injectActiveMenuParent(
  trail: AppRouteRecordRaw[],
  flatRoutes: AppRouteRecordRaw[],
  route: RouteLocationNormalizedLoaded
) {
  const activeMenu = route.meta?.activeMenu
  if (!activeMenu || !trail.length) return trail

  const parent = flatRoutes.find((item) => item.path === activeMenu)
  if (!parent) return trail
  if (trail.some((item) => item.path === parent.path || item.name === parent.name)) {
    return trail
  }

  const last = trail[trail.length - 1]
  if (!last) return trail
  return [...trail.slice(0, -1), parent, last]
}

function pushTrailItem(trail: AppRouteRecordRaw[], item?: AppRouteRecordRaw) {
  if (!item) return
  if (trail.some((node) => node.name === item.name && node.path === item.path)) return
  trail.push(item)
}

/** 基于 matched + 路由树解析面包屑（支持 :id 动态路由与 breadcrumbWrap） */
export function resolveBreadcrumbTrail(
  route: RouteLocationNormalizedLoaded,
  menuRouters: AppRouteRecordRaw[] = []
): AppRouteRecordRaw[] {
  const flatRoutes = flattenBreadcrumbRoutes(filterBreadcrumb(menuRouters))
  const flatByName = new Map<string, AppRouteRecordRaw>()
  flatRoutes.forEach((item) => {
    if (item.name) flatByName.set(String(item.name), item)
  })

  const trail: AppRouteRecordRaw[] = []

  for (const record of route.matched) {
    if (isLayoutShell(record)) continue

    const meta = record.meta
    const name = record.name ? String(record.name) : ''

    if (meta.breadcrumbWrap) {
      pushTrailItem(trail, resolveWrapListChild(record, flatRoutes, flatByName))
      continue
    }

    if (name && flatByName.has(name)) {
      pushTrailItem(trail, flatByName.get(name))
      continue
    }

    if (meta.canTo && name) {
      pushTrailItem(trail, {
        name,
        path: String(record.path).includes(':') ? route.fullPath : record.path,
        meta: { ...meta }
      } as AppRouteRecordRaw)
    }
  }

  return injectActiveMenuParent(trail, flatRoutes, route)
}

export function getBreadcrumbLinkPath(
  item: AppRouteRecordRaw,
  index: number,
  total: number
): string {
  const isLast = index === total - 1
  const path = item.path || ''
  const isDynamic = path.includes(':')
  if (isLast || !path || isDynamic || item.redirect === 'noredirect') {
    return ''
  }
  return path
}
