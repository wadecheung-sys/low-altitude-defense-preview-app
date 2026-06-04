import router from './router'
import type { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { LAD_HOME_PATH } from '@/constants/lad'
import { useUserStoreWithOut } from '@/store/modules/user'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

router.beforeEach(async (to, from, next) => {
  start()
  loadStart()
  const permissionStore = usePermissionStoreWithOut()
  const userStore = useUserStoreWithOut()
  if (userStore.isLoggedIn) {
    if (to.path === '/login') {
      next({ path: LAD_HOME_PATH })
    } else {
      if (permissionStore.getIsAddRouters) {
        next()
        return
      }

      // 低空防御项目：固定使用 ladRoutes 静态表（与 reference「综合示例-页面」一致）
      await permissionStore.generateRoutes('static')

      permissionStore.getAddRouters.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw)
      })

      const redirectPath = (from.query.redirect as string) || to.path
      let redirect = decodeURIComponent(redirectPath)
      if (!redirect || redirect === '/' || redirect === '/login') {
        redirect = LAD_HOME_PATH
      } else {
        const resolved = router.resolve(redirect)
        if (resolved.name === '404Page' || resolved.name === 'NoFind') {
          redirect = LAD_HOME_PATH
        }
      }

      // 与 reference 一致：path 相同时保留 query（如 archive-detail?id=）
      const nextData =
        to.path === redirect ? { ...to, replace: true } : { path: redirect, replace: true }
      permissionStore.setIsAddRouters(true)
      next(nextData)
    }
  } else {
    if (NO_REDIRECT_WHITE_LIST.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
    }
  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
