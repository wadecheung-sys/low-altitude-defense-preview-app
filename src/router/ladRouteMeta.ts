export type LadPageType = 'list' | 'detail' | 'form' | 'hub' | 'map'

export interface LadPageMeta {
  pageKey: string
  pageType: LadPageType
  reqModule: string
  prototypeRef?: string
  styleKernel?: string[]
  phaseNote?: string
}

export const LAD_PAGE_META: Record<string, LadPageMeta> = {
  'data-screen': {
    pageKey: 'data-screen',
    pageType: 'map',
    reqModule: '1',
    prototypeRef: 'D:/MyFiles/Desktop/新建文件夹/数据大屏03.html',
    phaseNote: '指挥控制中心演示大屏。'
  },
  'incident-history': {
    pageKey: 'incident-history',
    pageType: 'list',
    reqModule: '2',
    phaseNote: '历史事件列表与检索。'
  },
  'incident-target-detail': {
    pageKey: 'incident-target-detail',
    pageType: 'detail',
    reqModule: '2-detail',
    phaseNote: '单次飞行事件详情。'
  },
  'black-white-list': {
    pageKey: 'black-white-list',
    pageType: 'list',
    reqModule: '3',
    phaseNote: '黑白名单主数据列表。'
  },
  'black-white-target-detail': {
    pageKey: 'black-white-target-detail',
    pageType: 'detail',
    reqModule: '3-detail',
    phaseNote: '无人机档案详情。'
  },
  'device-archive': {
    pageKey: 'device-archive',
    pageType: 'list',
    reqModule: '4-档案',
    phaseNote: '设备档案列表。'
  },
  'device-archive-detail': {
    pageKey: 'device-archive-detail',
    pageType: 'detail',
    reqModule: '4-档案-detail',
    phaseNote: '设备档案详情。'
  },
  'device-info': {
    pageKey: 'device-info',
    pageType: 'list',
    reqModule: '4-信息',
    phaseNote: '设备信息列表。'
  },
  'device-group': {
    pageKey: 'device-group',
    pageType: 'list',
    reqModule: '4-分组',
    phaseNote: '设备分组管理。'
  },
  'device-monitor': {
    pageKey: 'device-monitor',
    pageType: 'list',
    reqModule: '4-监控',
    phaseNote: '设备运行监控。'
  },
  'device-detail': {
    pageKey: 'device-detail',
    pageType: 'detail',
    reqModule: '4-detail',
    phaseNote: '设备详情表单。'
  },
  'area-management': {
    pageKey: 'area-management',
    pageType: 'list',
    reqModule: '5',
    phaseNote: '区域管理列表。'
  },
  'area-edit': {
    pageKey: 'area-edit',
    pageType: 'form',
    reqModule: '5-edit',
    phaseNote: '区域新增与编辑。'
  },
  'system-sound-alarm': {
    pageKey: 'system-sound-alarm',
    pageType: 'form',
    reqModule: '8-声光',
    phaseNote: '声光报警配置。'
  },
  'threat-assessment': {
    pageKey: 'threat-assessment',
    pageType: 'list',
    reqModule: '6',
    phaseNote: '威胁评估规则列表。'
  },
  'plan-strategy': {
    pageKey: 'plan-strategy',
    pageType: 'list',
    reqModule: '7',
    phaseNote: '预案策略配置列表。'
  },
  'system-params': {
    pageKey: 'system-params',
    pageType: 'list',
    reqModule: '8-参数',
    phaseNote: '系统参数配置。'
  },
  'dict-list': {
    pageKey: 'dict-list',
    pageType: 'list',
    reqModule: '8-字典',
    phaseNote: '字典管理列表。'
  },
  'dict-detail': {
    pageKey: 'dict-detail',
    pageType: 'detail',
    reqModule: '8-字典-detail',
    phaseNote: '字典详情。'
  },
  'auth-user': {
    pageKey: 'auth-user',
    pageType: 'list',
    reqModule: '9-用户',
    phaseNote: '用户管理列表。'
  },
  'auth-permission': {
    pageKey: 'auth-permission',
    pageType: 'list',
    reqModule: '9-权限',
    phaseNote: '功能权限配置。'
  },
  'auth-role': {
    pageKey: 'auth-role',
    pageType: 'list',
    reqModule: '9-角色',
    phaseNote: '角色管理列表。'
  },
  'auth-log': {
    pageKey: 'auth-log',
    pageType: 'list',
    reqModule: '9-日志',
    phaseNote: '日志管理列表。'
  }
}

export const LAD_DEFERRED_MODULES = [] as const

export function getLadPageMeta(pageKey?: string): LadPageMeta | undefined {
  if (!pageKey) return undefined
  return LAD_PAGE_META[pageKey]
}
