import { pathResolve } from '@/utils/routerHelper'

export const filterBreadcrumb = (
  routes: AppRouteRecordRaw[],
  parentPath = ''
): AppRouteRecordRaw[] => {
  const res: AppRouteRecordRaw[] = []

  for (const route of routes) {
    const meta = route?.meta
    if (meta.hidden && !meta.canTo) {
      continue
    }

    // getParentLayout 包装层：跳过自身标题，保留子节点链路（设备信息、字典管理等）
    if (meta.breadcrumbWrap && route.children?.length) {
      res.push(...filterBreadcrumb(route.children, pathResolve(parentPath, route.path)))
      continue
    }

    // 保留完整父级链路；单子路由不再折叠（避免「预案策略配置」等缺一级面包屑）
    const data: AppRouteRecordRaw = { ...route }

    data.path = pathResolve(parentPath, data.path)

    if (data.children) {
      data.children = filterBreadcrumb(data.children, data.path)
    }
    res.push(data)
  }
  return res
}
