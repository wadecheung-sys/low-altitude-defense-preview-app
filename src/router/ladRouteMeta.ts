/**
 * 低空防御业务路由元数据注册表（第一阶段）
 * - 与需求清单序号、原型图、style-kernel 对齐，供路由与占位页复用
 * - 路由树结构见 ladRoutes.ts
 */

export type LadPageType = 'list' | 'detail' | 'form' | 'hub' | 'map'

export interface LadPageMeta {
  /** 稳定页面标识，第二阶段实现时与 views 目录对应 */
  pageKey: string
  /** 页面形态，决定第二阶段采用的 style-kernel */
  pageType: LadPageType
  /** 需求清单一级模块序号（1–10）；子页用 2-detail 等形式 */
  reqModule: string
  /** raw 原型图路径 */
  prototypeRef?: string
  /** 第二阶段优先参照的 style-kernel 文档 */
  styleKernel?: string[]
  /** 实现备注 / 优化说明 */
  phaseNote?: string
}

/** 按 pageKey 索引的元数据（与 ladRoutes meta.pageKey 一致） */
export const LAD_PAGE_META: Record<string, LadPageMeta> = {
  'data-screen': {
    pageKey: 'data-screen',
    pageType: 'map',
    reqModule: '1',
    prototypeRef: 'D:/MyFiles/Desktop/新建文件夹/数据大屏03.html',
    styleKernel: [],
    phaseNote:
      '指挥控制中心演示大屏：中部地图态势、左侧告警与日志、右侧光电跟踪与设备控制、底部一键处置。'
  },
  'incident-history': {
    pageKey: 'incident-history',
    pageType: 'list',
    reqModule: '2',
    prototypeRef: 'raw/历史事件.png',
    styleKernel: ['list-page-core.md', 'example-page-reference.md'],
    phaseNote: '全部无人机飞行记录（按架次/事件）；含检索、轨迹回放；详情见 hidden 路由'
  },
  'incident-target-detail': {
    pageKey: 'incident-target-detail',
    pageType: 'detail',
    reqModule: '2-detail',
    prototypeRef: 'raw/目标详情.png',
    styleKernel: ['form-page-skeleton-b.md'],
    phaseNote: '单次飞行/事件详情：状态变化、轨迹回放；与「无人机主数据」详情分离'
  },
  'black-white-list': {
    pageKey: 'black-white-list',
    pageType: 'list',
    reqModule: '3',
    prototypeRef: 'raw/黑白名单管理.png',
    styleKernel: ['list-page-core.md', 'dialog-core.md'],
    phaseNote: '无人机主数据：未知/黑名单/白名单分类 + SN、型号等基本信息（非飞行记录）'
  },
  'black-white-target-detail': {
    pageKey: 'black-white-target-detail',
    pageType: 'detail',
    reqModule: '3-detail',
    prototypeRef: 'raw/目标详情_1.png',
    styleKernel: ['form-page-skeleton-b.md'],
    phaseNote: '单架无人机档案详情（名单属性与基本信息）'
  },
  'device-archive': {
    pageKey: 'device-archive',
    pageType: 'list',
    reqModule: '4-档案',
    prototypeRef: 'raw/设备档案.png',
    styleKernel: ['list-page-core.md', 'action-column-core.md'],
    phaseNote: '设备档案列表：查询条件、左侧分类树、表格与操作列；查看跳转 archive/detail/:id'
  },
  'device-archive-detail': {
    pageKey: 'device-archive-detail',
    pageType: 'detail',
    reqModule: '4-档案-detail',
    prototypeRef: 'raw/设备档案.png',
    styleKernel: ['form-page-skeleton-b.md'],
    phaseNote: '只读详情：档案图像、基本信息、档案指标三栏'
  },
  'device-info': {
    pageKey: 'device-info',
    pageType: 'list',
    reqModule: '4-信息',
    prototypeRef: 'raw/设备信息.png',
    styleKernel: ['list-page-core.md', 'action-column-core.md'],
    phaseNote: '设备台账列表：查询、新增/修改/详情/删除；示例 DEV-R-01'
  },
  'device-group': {
    pageKey: 'device-group',
    pageType: 'list',
    reqModule: '4-分组',
    styleKernel: ['list-page-core.md', 'dialog-core.md'],
    phaseNote: '设备组管理：按探测、反制、光电或综合联动分组，为后续告警联动提供设备集依据。'
  },
  'device-monitor': {
    pageKey: 'device-monitor',
    pageType: 'list',
    reqModule: '4-信息',
    prototypeRef: 'raw/设备信息.png',
    styleKernel: ['list-page-core.md'],
    phaseNote: '设备管理下与设备信息同级：卡片展示联网状态、运行时长与今日探测/告警/处置统计'
  },
  'device-detail': {
    pageKey: 'device-detail',
    pageType: 'detail',
    reqModule: '4-detail',
    prototypeRef: 'raw/设备详情.png',
    styleKernel: ['form-page-skeleton-b.md']
  },
  'area-management': {
    pageKey: 'area-management',
    pageType: 'list',
    reqModule: '5',
    prototypeRef: 'raw/区域管理.png',
    styleKernel: ['list-page-core.md', 'action-column-core.md'],
    phaseNote: '独立列表页（Search + 工具栏 + Table，同历史事件）；新增/编辑跳转二级页绘制范围'
  },
  'area-edit': {
    pageKey: 'area-edit',
    pageType: 'form',
    reqModule: '5-edit',
    prototypeRef: 'raw/区域管理.png',
    styleKernel: ['form-page-skeleton-b.md'],
    phaseNote: '独立新增/编辑页（ContentDetailWrap）：左侧名称/优先级/颜色等，右侧 GIS 范围绘制'
  },
  'system-sound-alarm': {
    pageKey: 'system-sound-alarm',
    pageType: 'form',
    reqModule: '8-声光',
    phaseNote: '按防护分区配置声光报警方式（演示）'
  },
  'threat-assessment': {
    pageKey: 'threat-assessment',
    pageType: 'list',
    reqModule: '6',
    prototypeRef: 'raw/威胁评估.png',
    styleKernel: ['list-page-core.md', 'dialog-core.md'],
    phaseNote: '评估规则库：动态目标属性条件、优先级、关联预案；模拟测试与单条评估'
  },
  'plan-strategy': {
    pageKey: 'plan-strategy',
    pageType: 'list',
    reqModule: '7',
    prototypeRef: 'raw/预案策略配置.png',
    styleKernel: ['intrusion-plan-accepted.md', 'list-page-core.md', 'dialog-core.md'],
    phaseNote: '预案模型库：天气因素、设备动作、启停；被威胁规则引用'
  },
  'system-params': {
    pageKey: 'system-params',
    pageType: 'list',
    reqModule: '8-参数',
    prototypeRef: 'raw/参数配置.png',
    styleKernel: ['system-params-core.md', 'list-page-core.md'],
    phaseNote: '系统参数列表：关键词/分组/值类型检索；仅可编辑参数值'
  },
  'system-diagnostics': {
    pageKey: 'system-diagnostics',
    pageType: 'hub',
    reqModule: '8-诊断',
    phaseNote: '系统自诊断：各子系统健康检测与状态回传'
  },
  'dict-list': {
    pageKey: 'dict-list',
    pageType: 'list',
    reqModule: '8-字典',
    prototypeRef: 'raw/字典管理.png',
    styleKernel: ['list-page-core.md', 'dialog-core.md'],
    phaseNote: '字典类型维护；「字典项」进入详情页维护条目'
  },
  'dict-detail': {
    pageKey: 'dict-detail',
    pageType: 'detail',
    reqModule: '8-字典-detail',
    prototypeRef: 'raw/字典详情.png',
    styleKernel: ['form-page-skeleton-b.md'],
    phaseNote: '单字典类型下的字典项增删改查与批量删除'
  },
  'auth-user': {
    pageKey: 'auth-user',
    pageType: 'list',
    reqModule: '9-用户',
    prototypeRef: 'raw/用户管理.png',
    styleKernel: ['list-page-core.md', 'user-management-accepted.md'],
    phaseNote: '三员内置账号 + 业务用户；编辑/重置密码/删除；账号分级 debug/duty/observe'
  },
  'auth-permission': {
    pageKey: 'auth-permission',
    pageType: 'list',
    reqModule: '9-权限',
    prototypeRef: 'raw/权限管理.png',
    styleKernel: ['list-page-core.md'],
    phaseNote: 'LAD 菜单权限树；可编辑权限标识与启用状态'
  },
  'auth-role': {
    pageKey: 'auth-role',
    pageType: 'list',
    reqModule: '9-角色',
    prototypeRef: 'raw/角色管理.png',
    styleKernel: ['list-page-core.md', 'dialog-core.md'],
    phaseNote: '角色维护与树形分配功能权限；三员角色不可删'
  },
  'auth-log': {
    pageKey: 'auth-log',
    pageType: 'list',
    reqModule: '9-日志',
    prototypeRef: 'raw/日志管理.png',
    styleKernel: ['system-logs-accepted.md', 'list-page-core.md'],
    phaseNote: '登录/操作日志检索与只读详情'
  },
  'system-integration': {
    pageKey: 'system-integration',
    pageType: 'hub',
    reqModule: '10',
    prototypeRef: 'raw/系统对接及算法服务.png',
    styleKernel: ['link-config-core.md'],
    phaseNote:
      '按原型：系统对接/描述/运行状态/时间范围检索；列表含心跳测试与数据更新时间；全量心跳检测'
  }
}

/** 需求中存在、本阶段刻意不纳入菜单的模块 */
export const LAD_DEFERRED_MODULES = [] as const

export function getLadPageMeta(pageKey?: string): LadPageMeta | undefined {
  if (!pageKey) return undefined
  return LAD_PAGE_META[pageKey]
}
