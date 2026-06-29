import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'
import { NO_RESET_WHITE_LIST } from '@/constants'
import { ladAsyncRouterMap } from './ladRoutes'

const { t } = useI18n()

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/login',
    name: 'Root',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'RedirectWrap',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/lad/data-screen',
    component: () => import('@/views/Lad/Command/CommandScreen.vue'),
    name: 'LadDataScreen',
    meta: {
      hidden: true,
      title: '指挥控制中心',
      noTagsView: true
    }
  },
  {
    path: '/lad/command',
    redirect: '/lad/data-screen',
    name: 'LadCommandLegacy',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/lad/command/index',
    name: 'LadCommandIndexLegacy',
    redirect: '/lad/data-screen',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/personal',
    component: Layout,
    redirect: '/personal/personal-center',
    name: 'Personal',
    meta: {
      title: t('router.personal'),
      hidden: true,
      canTo: true
    },
    children: [
      {
        path: 'personal-center',
        component: () => import('@/views/Personal/PersonalCenter/PersonalCenter.vue'),
        name: 'PersonalCenter',
        meta: {
          title: t('router.personalCenter'),
          hidden: true,
          canTo: true
        }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  },
  // 菜单结构调整后的旧路径兼容（区域/威胁/预案已提升为一级菜单）
  {
    path: '/lad/device/area',
    redirect: '/lad/area/list',
    name: 'LadLegacyDeviceArea',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/lad/area/index',
    redirect: '/lad/area/list',
    name: 'LadLegacyAreaIndex',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/lad/device/threat',
    redirect: '/lad/threat/index',
    name: 'LadLegacyDeviceThreat',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/lad/device/plan',
    redirect: '/lad/plan/index',
    name: 'LadLegacyDevicePlan',
    meta: { hidden: true, noTagsView: true }
  },
  {
    path: '/lad/threat/sound-alarm',
    redirect: '/lad/system/sound-alarm',
    name: 'LadLegacyThreatSoundAlarm',
    meta: { hidden: true, noTagsView: true }
  }
]

export const asyncRouterMap: AppRouteRecordRaw[] = ladAsyncRouterMap

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  strict: true,
  routes: constantRouterMap as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !NO_RESET_WHITE_LIST.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
