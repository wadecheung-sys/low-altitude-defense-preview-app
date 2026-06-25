import type { RouteMeta } from 'vue-router'
import { Layout, getParentLayout } from '@/utils/routerHelper'
import { getLadPageMeta } from './ladRouteMeta'

const commandScreenPage = () => import('@/views/Lad/Command/CommandScreen.vue')
const historyEventPage = () => import('@/views/Lad/Incident/HistoryEvent.vue')
const incidentTargetDetailPage = () => import('@/views/Lad/Incident/IncidentTargetDetail.vue')
const blackWhiteListPage = () => import('@/views/Lad/List/BlackWhiteList.vue')
const blackWhiteTargetDetailPage = () => import('@/views/Lad/List/BlackWhiteTargetDetail.vue')
const deviceArchivePage = () => import('@/views/Lad/Device/DeviceArchive.vue')
const deviceArchiveDetailPage = () => import('@/views/Lad/Device/DeviceArchiveDetail.vue')
const deviceGroupManagementPage = () => import('@/views/Lad/Device/DeviceGroupManagement.vue')
const deviceInfoListPage = () => import('@/views/Lad/Device/DeviceInfoList.vue')
const deviceInfoDetailPage = () => import('@/views/Lad/Device/DeviceInfoDetail.vue')
const deviceRuntimeMonitorPage = () => import('@/views/Lad/Device/DeviceRuntimeMonitor.vue')
const areaListPage = () => import('@/views/Lad/Area/AreaList.vue')
const areaEditPage = () => import('@/views/Lad/Area/AreaEdit.vue')
const systemParamsPage = () => import('@/views/Lad/System/SystemParams.vue')
const dictListPage = () => import('@/views/Lad/System/DictList.vue')
const dictDetailPage = () => import('@/views/Lad/System/DictDetail.vue')
const authUserPage = () => import('@/views/Lad/Auth/AuthUser.vue')
const authPermissionPage = () => import('@/views/Lad/Auth/AuthPermission.vue')
const authRolePage = () => import('@/views/Lad/Auth/AuthRole.vue')
const authLogPage = () => import('@/views/Lad/Auth/AuthLog.vue')
const threatRuleListPage = () => import('@/views/Lad/Threat/ThreatRuleList.vue')
const threatSoundAlarmPage = () => import('@/views/Lad/Threat/ThreatSoundAlarm.vue')
const planStrategyListPage = () => import('@/views/Lad/Plan/PlanStrategyList.vue')

function ladMeta(pageKey: string, extra: Partial<RouteMeta> = {}): RouteMeta {
  const base = getLadPageMeta(pageKey)
  return {
    pageKey,
    pageType: base?.pageType,
    reqModule: base?.reqModule,
    prototypeRef: base?.prototypeRef,
    styleKernel: base?.styleKernel,
    phaseNote: base?.phaseNote,
    ...extra
  }
}

export const ladAsyncRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/lad/data-screen-nav',
    component: Layout,
    redirect: '/lad/data-screen',
    name: 'LadDataScreenNav',
    meta: {
      title: '指挥控制中心',
      icon: 'vi-ant-design:fund-projection-screen-outlined',
      reqModule: '1'
    },
    children: [
      {
        path: 'index',
        name: 'LadDataScreenNavIndex',
        component: commandScreenPage,
        meta: ladMeta('data-screen', {
          title: '指挥控制中心',
          hidden: true,
          canTo: true,
          activeMenu: '/lad/data-screen-nav'
        })
      }
    ]
  },
  {
    path: '/lad/incident',
    component: Layout,
    redirect: '/lad/incident/history',
    name: 'LadIncident',
    meta: {
      title: '历史事件',
      icon: 'vi-ant-design:history-outlined',
      reqModule: '2'
    },
    children: [
      {
        path: 'history',
        name: 'LadIncidentHistory',
        component: historyEventPage,
        meta: ladMeta('incident-history', {
          title: '历史事件',
          affix: true
        })
      },
      {
        path: 'target/:id',
        name: 'LadIncidentTargetDetail',
        component: incidentTargetDetailPage,
        meta: ladMeta('incident-target-detail', {
          title: '飞行记录详情',
          hidden: true,
          canTo: true,
          noCache: true,
          activeMenu: '/lad/incident/history'
        })
      }
    ]
  },
  {
    path: '/lad/list',
    component: Layout,
    redirect: '/lad/list/black-white',
    name: 'LadBlackWhite',
    meta: {
      title: '黑白名单管理',
      icon: 'vi-ant-design:file-protect-outlined',
      reqModule: '3'
    },
    children: [
      {
        path: 'black-white',
        name: 'LadBlackWhiteList',
        component: blackWhiteListPage,
        meta: ladMeta('black-white-list', {
          title: '黑白名单管理'
        })
      },
      {
        path: 'incident/target/:id',
        name: 'LadBlackWhiteIncidentTargetDetail',
        component: incidentTargetDetailPage,
        meta: ladMeta('incident-target-detail', {
          title: '飞行记录详情',
          hidden: true,
          canTo: true,
          noCache: true,
          activeMenu: '/lad/list/black-white'
        })
      },
      {
        path: 'target/:id',
        name: 'LadBlackWhiteTargetDetail',
        component: blackWhiteTargetDetailPage,
        meta: ladMeta('black-white-target-detail', {
          title: '无人机详情',
          hidden: true,
          canTo: true,
          activeMenu: '/lad/list/black-white'
        })
      }
    ]
  },
  {
    path: '/lad/device',
    component: Layout,
    redirect: '/lad/device/archive',
    name: 'LadDevice',
    meta: {
      title: '设备管理',
      icon: 'vi-ant-design:cluster-outlined',
      alwaysShow: true,
      reqModule: '4'
    },
    children: [
      {
        path: 'archive',
        name: 'LadDeviceArchive',
        component: deviceArchivePage,
        meta: ladMeta('device-archive', {
          title: '设备档案'
        })
      },
      {
        path: 'archive/add',
        name: 'LadDeviceArchiveAdd',
        component: deviceArchiveDetailPage,
        meta: ladMeta('device-archive-detail', {
          title: '新增设备档案',
          hidden: true,
          canTo: true,
          noTagsView: true,
          activeMenu: '/lad/device/archive'
        })
      },
      {
        path: 'archive/edit/:id',
        name: 'LadDeviceArchiveEdit',
        component: deviceArchiveDetailPage,
        meta: ladMeta('device-archive-detail', {
          title: '编辑设备档案',
          hidden: true,
          canTo: true,
          noTagsView: true,
          activeMenu: '/lad/device/archive'
        })
      },
      {
        path: 'archive/detail/:id',
        name: 'LadDeviceArchiveDetail',
        component: deviceArchiveDetailPage,
        meta: ladMeta('device-archive-detail', {
          title: '设备档案详情',
          hidden: true,
          canTo: true,
          noTagsView: true,
          activeMenu: '/lad/device/archive'
        })
      },
      {
        path: 'info',
        component: getParentLayout(),
        redirect: '/lad/device/info/list',
        name: 'LadDeviceInfoWrap',
        meta: {
          title: '设备信息',
          reqModule: '4-信息'
        },
        children: [
          {
            path: 'list',
            name: 'LadDeviceInfoList',
            component: deviceInfoListPage,
            meta: ladMeta('device-info', {
              title: '设备信息'
            })
          },
          {
            path: 'add',
            name: 'LadDeviceInfoAdd',
            component: deviceInfoDetailPage,
            meta: ladMeta('device-detail', {
              title: '新增设备',
              hidden: true,
              canTo: true,
              noTagsView: true,
              activeMenu: '/lad/device/info/list'
            })
          },
          {
            path: 'edit/:id',
            name: 'LadDeviceInfoEdit',
            component: deviceInfoDetailPage,
            meta: ladMeta('device-detail', {
              title: '修改设备',
              hidden: true,
              canTo: true,
              noTagsView: true,
              activeMenu: '/lad/device/info/list'
            })
          },
          {
            path: 'detail/:id',
            name: 'LadDeviceDetail',
            component: deviceInfoDetailPage,
            meta: ladMeta('device-detail', {
              title: '设备详情',
              hidden: true,
              canTo: true,
              noTagsView: true,
              activeMenu: '/lad/device/info/list'
            })
          }
        ]
      },
      {
        path: 'monitor',
        name: 'LadDeviceRuntimeMonitor',
        component: deviceRuntimeMonitorPage,
        meta: ladMeta('device-monitor', {
          title: '设备运行监控'
        })
      },
      {
        path: 'monitor/detail/:id',
        name: 'LadDeviceMonitorDetail',
        component: deviceInfoDetailPage,
        meta: ladMeta('device-detail', {
          title: '设备详情',
          hidden: true,
          canTo: true,
          noTagsView: true,
          activeMenu: '/lad/device/monitor'
        })
      },
      {
        path: 'group',
        name: 'LadDeviceGroupManagement',
        component: deviceGroupManagementPage,
        meta: ladMeta('device-group', {
          title: '设备组管理'
        })
      }
    ]
  },
  {
    path: '/lad/area',
    component: Layout,
    redirect: '/lad/area/list',
    name: 'LadArea',
    meta: {
      title: '区域管理',
      icon: 'vi-ant-design:environment-outlined',
      reqModule: '5'
    },
    children: [
      {
        path: 'list',
        name: 'LadAreaList',
        component: areaListPage,
        meta: ladMeta('area-management', {
          title: '区域管理'
        })
      },
      {
        path: 'add',
        name: 'LadAreaAdd',
        component: areaEditPage,
        meta: ladMeta('area-edit', {
          title: '新增区域',
          hidden: true,
          canTo: true,
          noTagsView: true,
          activeMenu: '/lad/area/list'
        })
      },
      {
        path: 'edit/:id',
        name: 'LadAreaEdit',
        component: areaEditPage,
        meta: ladMeta('area-edit', {
          title: '编辑区域',
          hidden: true,
          canTo: true,
          noTagsView: true,
          activeMenu: '/lad/area/list'
        })
      }
    ]
  },
  {
    path: '/lad/threat',
    component: Layout,
    redirect: '/lad/threat/index',
    name: 'LadThreat',
    meta: {
      title: '威胁评估',
      icon: 'vi-ant-design:alert-outlined',
      reqModule: '6'
    },
    children: [
      {
        path: 'index',
        name: 'LadThreatIndex',
        component: threatRuleListPage,
        meta: ladMeta('threat-assessment', {
          title: '威胁评估'
        })
      }
    ]
  },
  {
    path: '/lad/plan',
    component: Layout,
    redirect: '/lad/plan/index',
    name: 'LadPlan',
    meta: {
      title: '预案策略配置',
      icon: 'vi-ant-design:deployment-unit-outlined',
      reqModule: '7'
    },
    children: [
      {
        path: 'index',
        name: 'LadPlanIndex',
        component: planStrategyListPage,
        meta: ladMeta('plan-strategy', {
          title: '预案策略配置'
        })
      }
    ]
  },
  {
    path: '/lad/system',
    component: Layout,
    redirect: '/lad/system/params',
    name: 'LadSystem',
    meta: {
      title: '系统管理',
      icon: 'vi-ant-design:setting-outlined',
      alwaysShow: true,
      reqModule: '8'
    },
    children: [
      {
        path: 'params',
        name: 'LadSystemParams',
        component: systemParamsPage,
        meta: ladMeta('system-params', {
          title: '参数配置'
        })
      },
      {
        path: 'sound-alarm',
        name: 'LadSystemSoundAlarm',
        component: threatSoundAlarmPage,
        meta: ladMeta('system-sound-alarm', {
          title: '声光报警'
        })
      },
      {
        path: 'dict',
        component: getParentLayout(),
        redirect: '/lad/system/dict/list',
        name: 'LadSystemDictWrap',
        meta: {
          title: '字典管理',
          reqModule: '8-字典'
        },
        children: [
          {
            path: 'list',
            name: 'LadSystemDictList',
            component: dictListPage,
            meta: ladMeta('dict-list', {
              title: '字典管理'
            })
          },
          {
            path: 'detail/:id',
            name: 'LadSystemDictDetail',
            component: dictDetailPage,
            meta: ladMeta('dict-detail', {
              title: '字典详情',
              hidden: true,
              canTo: true,
              activeMenu: '/lad/system/dict/list'
            })
          }
        ]
      }
    ]
  },
  {
    path: '/lad/auth',
    component: Layout,
    redirect: '/lad/auth/user',
    name: 'LadAuth',
    meta: {
      title: '权限管理',
      icon: 'vi-eos-icons:role-binding',
      alwaysShow: true,
      reqModule: '9'
    },
    children: [
      {
        path: 'user',
        name: 'LadAuthUser',
        component: authUserPage,
        meta: ladMeta('auth-user', {
          title: '用户管理'
        })
      },
      {
        path: 'permission',
        name: 'LadAuthPermission',
        component: authPermissionPage,
        meta: ladMeta('auth-permission', {
          title: '功能权限'
        })
      },
      {
        path: 'role',
        name: 'LadAuthRole',
        component: authRolePage,
        meta: ladMeta('auth-role', {
          title: '角色管理'
        })
      },
      {
        path: 'log',
        name: 'LadAuthLog',
        component: authLogPage,
        meta: ladMeta('auth-log', {
          title: '日志管理'
        })
      }
    ]
  }
]
