import type { RouteRecordRaw } from 'vue-router'
import { defineComponent } from 'vue'

/**
* redirect: noredirect        当设置 noredirect 的时候该路由在面包屑导航中不可被点击
* name:'router-name'          设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
* meta : {
    hidden: true              当设置 true 的时候该路由不会再侧边栏出现 如404，login等页面(默认 false)

    alwaysShow: true          当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式，
                              只有一个时，会将那个子路由当做根路由显示在侧边栏，
                              若你想不管路由下面的 children 声明的个数都显示你的根路由，
                              你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，
                              一直显示根路由(默认 false)

    title: 'title'            设置该路由在侧边栏和面包屑中展示的名字

    icon: 'svg-name'          设置该路由的图标

    noCache: true             如果设置为true，则不会被 <keep-alive> 缓存(默认 false)

    breadcrumb: false         如果设置为false，则不会在breadcrumb面包屑中显示(默认 true)

    affix: true               如果设置为true，则会一直固定在tag项中(默认 false)

    noTagsView: true          如果设置为true，则不会出现在tag中(默认 false)

    activeMenu: '/dashboard'  显示高亮的路由路径

    canTo: true               设置为true即使hidden为true，也依然可以进行路由跳转(默认 false)

    permission: ['edit','add', 'delete']    设置该路由的权限
  }
**/

/** 页面形态（与 ladRouteMeta.LadPageType 一致） */
type LadPageType = 'list' | 'detail' | 'form' | 'hub' | 'map'

interface RouteMetaCustom extends Record<string | number | symbol, unknown> {
  hidden?: boolean
  alwaysShow?: boolean
  title?: string
  icon?: string
  noCache?: boolean
  breadcrumb?: boolean
  affix?: boolean
  activeMenu?: string
  noTagsView?: boolean
  canTo?: boolean
  permission?: string[]
  /** LAD：稳定页面标识，对应 ladRouteMeta.ts */
  pageKey?: string
  pageType?: LadPageType
  /** LAD：需求清单模块序号 */
  reqModule?: string
  /** LAD：原型图路径 */
  prototypeRef?: string
  /** LAD：style-kernel 文档名列表 */
  styleKernel?: string[]
  /** LAD：阶段备注 */
  phaseNote?: string
  /** LAD：getParentLayout 包装路由，面包屑跳过本层、保留子节点 */
  breadcrumbWrap?: boolean
}

declare module 'vue-router' {
  interface RouteMeta extends RouteMetaCustom {}
}

type Component<T = any> =
  | ReturnType<typeof defineComponent>
  | (() => Promise<typeof import('*.vue')>)
  | (() => Promise<T>)

declare global {
  declare interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'meta' | 'children'> {
    name: string
    meta: RouteMetaCustom
    component?: Component | string
    children?: AppRouteRecordRaw[]
    props?: Recordable
    fullPath?: string
  }

  declare interface AppCustomRouteRecordRaw
    extends Omit<RouteRecordRaw, 'meta' | 'component' | 'children'> {
    name: string
    meta: RouteMetaCustom
    component: string
    path: string
    redirect: string
    children?: AppCustomRouteRecordRaw[]
  }
}
