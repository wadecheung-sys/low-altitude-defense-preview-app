import { functionLabel } from './planDeviceCatalog'
import { normalizePlanDisposal, planRequiresManualConfirm } from './planDisposal'
import {
  formatTriggerCondition,
  formatTriggerRuleAreaLevel,
  formatTriggerRulesSummary,
  findMatchingTriggerRule,
  normalizeTriggerRule,
  resolvePlanTriggerRule
} from './planTrigger'
import { formatTriggerRuleWeather } from './planWeatherConditions'
import type {
  PlanExecutionPayload,
  PlanSimulateInput,
  PlanSimulateResult,
  PlanStrategy,
  PlanStrategyListResult,
  PlanStrategyQuery,
  PlanStrategySavePayload,
  PlanTriggerRule
} from './types'
import type { PlanTriggerContext } from './planTrigger'
import { PLAN_DEFAULT_PRIORITY, normalizePlanPriority } from './planDefaults'
import { matchesPlanThreatLevel, isSimulateThreatLevelAll } from './planThreatLevel'
import { THREAT_LEVEL_ALL } from '@/api/lad/threat/threatLevelUtils'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function generatePlanCode() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  let code = ''
  do {
    code = `PLAN-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(
      d.getHours()
    )}${p(d.getMinutes())}${p(d.getSeconds())}${p(Math.floor(Math.random() * 100))}`
  } while (allPlans.some((plan) => plan.planCode === code))
  return code
}

type SeedInput = Omit<
  PlanStrategy,
  | 'triggerRules'
  | 'weatherFactor'
  | 'deviceGroupName'
  | 'deviceGroupType'
  | 'deviceFunction'
  | 'deviceAction'
  | 'triggerRuleCount'
  | 'triggerRulesSummary'
  | 'disposalModeLabel'
> & {
  triggerRules: PlanTriggerRule[]
}

export { PLAN_DEFAULT_PRIORITY } from './planDefaults'
export const PLAN_STORE_VERSION = 22

function normalizePriority(value: unknown) {
  return normalizePlanPriority(value)
}

const legacyCountermeasureMigration: Record<
  string,
  Pick<PlanTriggerRule, 'deviceFunction' | 'deviceAction'>
> = {
  alarm_sound_light: { deviceFunction: 'sound_light_expulsion', deviceAction: '声光驱离' },
  eo_track_lock: { deviceFunction: 'navigation_spoofing', deviceAction: '导航诱骗' },
  eo_evidence_tracking: { deviceFunction: 'navigation_spoofing', deviceAction: '导航诱骗' },
  radar_track: { deviceFunction: 'radio_jamming', deviceAction: '无线电干扰' },
  fusion_monitor_report: { deviceFunction: 'sound_light_expulsion', deviceAction: '声光驱离' }
}

function sanitizeTriggerRule(rule: PlanTriggerRule): PlanTriggerRule {
  const migrated = legacyCountermeasureMigration[rule.deviceFunction]
  return {
    ...rule,
    ...migrated,
    deviceGroupId: '',
    deviceGroupName: '',
    deviceGroupType: ''
  }
}

const seed: SeedInput[] = [
  {
    id: 'plan-001',
    planCode: 'contingency-001',
    planName: '自动驱离',
    planRule:
      '1. 启动干扰设备并切至驱离模式\n2. 单次工作时长不超过30秒\n3. 无效果则停止并通知值班复核',
    disposalMode: 'auto',
    manualResponseSeconds: 20,
    threatLevel: '高危',
    areaLevel: '全部',
    priority: 70,
    enabled: true,
    updatedAt: '2026-03-08 10:00:00',
    updatedBy: '张三',
    triggerRules: [
      {
        id: 'ptr-plan-001-1',
        ruleName: '晴天默认驱离',
        sortOrder: 1,
        weatherFactor: '晴天',
        weatherConditionLogic: 'and',
        weatherConditions: [
          { id: 'wc-p001-1', property: 'temperature', operator: '>', value: '20' },
          { id: 'wc-p001-2', property: 'humidity', operator: '<', value: '90', nextLogic: 'and' }
        ],
        areaLevel: ['ar-10001'],
        deviceGroupId: 'dg-1001',
        deviceGroupName: '核心区转台压制-FG310F',
        deviceGroupType: '反制组',
        deviceFunction: 'radio_jamming',
        deviceAction: '无线电干扰',
        enabled: true
      },
      {
        id: 'ptr-plan-001-2',
        ruleName: '兜底人工复核告警',
        sortOrder: 2,
        weatherFactor: '全部',
        deviceGroupId: 'dg-1003',
        deviceGroupName: '1#光电-GD',
        deviceGroupType: '光电协同组',
        deviceFunction: 'sound_light_expulsion',
        deviceAction: '声光驱离',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-002',
    planCode: 'contingency-002',
    planName: '迫降反制',
    planRule:
      '1. 值班员在线确认后下发迫降指令\n2. 执行期间持续光电监测\n3. 目标离开核心区后自动结束',
    disposalMode: 'manual',
    manualResponseSeconds: 0,
    threatLevel: '高危',
    areaLevel: '全部',
    priority: 85,
    enabled: true,
    updatedAt: '2026-03-10 14:20:00',
    updatedBy: '李四',
    triggerRules: [
      {
        id: 'ptr-plan-002-1',
        ruleName: '雨天迫降反制',
        sortOrder: 1,
        weatherFactor: '雨天',
        weatherConditions: [{ id: 'wc-p002-1', property: 'rainfall', operator: '>', value: '5' }],
        areaLevel: ['ar-10001', 'ar-10002'],
        deviceGroupId: 'dg-1004',
        deviceGroupName: '西区导航诱骗-DY506F',
        deviceGroupType: '反制组',
        deviceFunction: 'navigation_spoofing',
        deviceAction: '导航诱骗',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-003',
    planCode: 'contingency-003',
    planName: '光电跟踪联动',
    planRule: '1. 启动光电设备进入跟踪模式\n2. 同步上报目标轨迹至指挥平台\n3. 目标消失后自动停止',
    disposalMode: 'auto',
    manualResponseSeconds: 10,
    threatLevel: '中危',
    areaLevel: '全部',
    priority: 40,
    enabled: true,
    updatedAt: '2026-05-18 09:00:00',
    updatedBy: '系统管理员',
    triggerRules: [
      {
        id: 'ptr-plan-003-1',
        ruleName: '阴天光电跟踪',
        weatherFactor: '阴天',
        deviceGroupId: 'dg-1003',
        deviceGroupName: '南门光电观察组',
        deviceGroupType: '光电协同组',
        deviceFunction: 'eo_track_lock',
        deviceAction: '目标锁定',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-004',
    planCode: 'contingency-004',
    planName: '人工复核告警',
    planRule: '1. 触发声光告警与平台弹窗\n2. 值班员确认后升级处置\n3. 未确认前禁止自动驱离',
    disposalMode: 'manual',
    manualResponseSeconds: 0,
    threatLevel: '全部',
    areaLevel: '全部',
    priority: PLAN_DEFAULT_PRIORITY,
    enabled: true,
    updatedAt: '2026-05-01 16:00:00',
    updatedBy: '安全保密员',
    triggerRules: [
      {
        id: 'ptr-plan-004-1',
        ruleName: '兜底人工复核告警',
        weatherFactor: '全部',
        deviceGroupId: 'dg-1003',
        deviceGroupName: '南门光电观察组',
        deviceGroupType: '光电协同组',
        deviceFunction: 'alarm_sound_light',
        deviceAction: '声光警示',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-006',
    planCode: 'contingency-006',
    planName: '雷达监测联动',
    planRule:
      '1. 启动边界雷达监测并记录航迹\n2. 不下发驱离，仅供值班判断\n3. 异常轨迹自动标注并推送告警预案',
    disposalMode: 'auto',
    manualResponseSeconds: 15,
    threatLevel: '中危',
    areaLevel: '全部',
    priority: 45,
    enabled: true,
    updatedAt: '2026-05-20 08:15:00',
    updatedBy: '赵六',
    triggerRules: [
      {
        id: 'ptr-plan-006-1',
        ruleName: '大风雷达监测',
        weatherFactor: '大风',
        deviceGroupId: 'dg-1002',
        deviceGroupName: '东侧频谱侦测-PL671F',
        deviceGroupType: '探测组',
        deviceFunction: 'radar_track',
        deviceAction: '持续跟踪',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-007',
    planCode: 'contingency-007',
    planName: '试飞区告警提示',
    planRule: '1. 仅平台弹窗与声光提示\n2. 不启动干扰\n3. 记录操作员与时间',
    disposalMode: 'manual',
    manualResponseSeconds: 0,
    threatLevel: '低危',
    areaLevel: '全部',
    priority: 20,
    enabled: true,
    updatedAt: '2026-05-20 09:00:00',
    updatedBy: '张三',
    triggerRules: [
      {
        id: 'ptr-plan-007-1',
        ruleName: '试飞区低等级提示',
        weatherFactor: '全部',
        deviceGroupId: 'dg-1003',
        deviceGroupName: '南门光电观察组',
        deviceGroupType: '光电协同组',
        deviceFunction: 'alarm_sound_light',
        deviceAction: '声光警示',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-008',
    planCode: 'contingency-008',
    planName: '边界全向干扰',
    planRule: '1. 全向干扰模式最长60秒\n2. 监测周边设备状态\n3. 异常自动停止并告警',
    disposalMode: 'auto',
    manualResponseSeconds: 15,
    threatLevel: '高危',
    areaLevel: '全部',
    priority: 65,
    enabled: true,
    updatedAt: '2026-05-20 10:00:00',
    updatedBy: '李四',
    triggerRules: [
      {
        id: 'ptr-plan-008-1',
        ruleName: '高等级全向干扰',
        weatherFactor: '晴天',
        deviceGroupId: 'dg-1001',
        deviceGroupName: '核心区转台压制-FG310F',
        deviceGroupType: '反制组',
        deviceFunction: 'radio_jamming',
        deviceAction: '无线电干扰',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-009',
    planCode: 'contingency-009',
    planName: '光电监测上报',
    planRule: '1. 连续监测上报至指挥平台\n2. 不自动升级处置\n3. 目标离开后停止',
    disposalMode: 'auto',
    manualResponseSeconds: 5,
    threatLevel: '低危',
    areaLevel: '全部',
    priority: 35,
    enabled: true,
    updatedAt: '2026-05-20 11:00:00',
    updatedBy: '系统管理员',
    triggerRules: [
      {
        id: 'ptr-plan-009-1',
        ruleName: '低等级光电监测',
        weatherFactor: '阴天',
        deviceGroupId: 'dg-1003',
        deviceGroupName: '南门光电观察组',
        deviceGroupType: '光电协同组',
        deviceFunction: 'eo_evidence_tracking',
        deviceAction: '取证跟踪',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-010',
    planCode: 'contingency-010',
    planName: '导航诱骗驱离',
    planRule: '1. 导航诱骗模式不超过45秒\n2. 执行中禁止切换频段\n3. 结束后生成备注',
    disposalMode: 'auto',
    manualResponseSeconds: 10,
    threatLevel: '中危',
    areaLevel: '全部',
    priority: 60,
    enabled: true,
    updatedAt: '2026-05-20 12:00:00',
    updatedBy: '王五',
    triggerRules: [
      {
        id: 'ptr-plan-010-1',
        ruleName: '中等级导航诱骗',
        weatherFactor: '全部',
        deviceGroupId: 'dg-1004',
        deviceGroupName: '西区导航诱骗-DY506F',
        deviceGroupType: '反制组',
        deviceFunction: 'navigation_spoofing',
        deviceAction: '导航诱骗',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-011',
    planCode: 'contingency-011',
    planName: '网络断链迫降',
    planRule: '1. 断链持续至目标离开\n2. 需二级审批后执行\n3. 失败自动回退告警预案',
    disposalMode: 'manual',
    manualResponseSeconds: 0,
    threatLevel: '高危',
    areaLevel: '全部',
    priority: 75,
    enabled: false,
    updatedAt: '2026-05-20 13:00:00',
    updatedBy: '安全保密员',
    triggerRules: [
      {
        id: 'ptr-plan-011-1',
        ruleName: '高等级断链迫降',
        weatherFactor: '雨天',
        deviceGroupId: 'dg-1004',
        deviceGroupName: '西区导航诱骗-DY506F',
        deviceGroupType: '反制组',
        deviceFunction: 'navigation_spoofing',
        deviceAction: '导航诱骗',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-012',
    planCode: 'contingency-012',
    planName: '雷达跟踪备注',
    planRule: '1. 记录航迹与速度曲线\n2. 不联动打击\n3. 异常轨迹标注传值班',
    disposalMode: 'auto',
    manualResponseSeconds: 5,
    threatLevel: '低危',
    areaLevel: '全部',
    priority: 25,
    enabled: true,
    updatedAt: '2026-05-20 14:00:00',
    updatedBy: '赵六',
    triggerRules: [
      {
        id: 'ptr-plan-012-1',
        ruleName: '低等级雷达跟踪',
        weatherFactor: '大风',
        deviceGroupId: 'dg-1002',
        deviceGroupName: '东侧频谱侦测-PL671F',
        deviceGroupType: '探测组',
        deviceFunction: 'radar_track',
        deviceAction: '持续跟踪',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-013',
    planCode: 'contingency-013',
    planName: '蜂群复合反制',
    planRule:
      '1. 检测蜂群≥3架后自动升级威慑\n2. 大雾天切换微波，其余场景激光打击\n3. 驱离失败时不回退驱离预案',
    disposalMode: 'manual',
    manualResponseSeconds: 0,
    threatLevel: '高危',
    areaLevel: '全部',
    priority: 90,
    enabled: true,
    updatedAt: '2026-05-20 15:00:00',
    updatedBy: '系统管理员',
    triggerRules: [
      {
        id: 'ptr-plan-013-1',
        ruleName: '晴天蜂群激光打击',
        weatherFactor: '晴天',
        deviceGroupId: 'dg-1007',
        deviceGroupName: '1#激光-JG',
        deviceGroupType: '反制组',
        deviceFunction: 'laser_strike',
        deviceAction: '激光打击',
        enabled: true
      },
      {
        id: 'ptr-plan-013-2',
        ruleName: '大雾蜂群微波打击',
        weatherFactor: '大雾',
        deviceGroupId: 'dg-1008',
        deviceGroupName: '1#微波-WB',
        deviceGroupType: '反制组',
        deviceFunction: 'microwave_strike',
        deviceAction: '微波打击',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-014',
    planCode: 'contingency-014',
    planName: '蜂群高功率微波',
    planRule: '1. 对入侵蜂群实施区域微波\n2. 需指挥员二级授权\n3. 打击后全向监测备注',
    disposalMode: 'manual',
    manualResponseSeconds: 0,
    threatLevel: '高危',
    areaLevel: '全部',
    priority: 95,
    enabled: true,
    updatedAt: '2026-05-20 15:10:00',
    updatedBy: '系统管理员',
    triggerRules: [
      {
        id: 'ptr-plan-014-1',
        ruleName: '高等级蜂群微波打击',
        weatherFactor: '晴天',
        deviceGroupId: 'dg-1008',
        deviceGroupName: '1#微波-WB',
        deviceGroupType: '反制组',
        deviceFunction: 'microwave_strike',
        deviceAction: '微波打击',
        enabled: true
      }
    ]
  },
  {
    id: 'plan-015',
    planCode: 'contingency-015',
    planName: '无人机设备监测',
    planRule:
      '1. 发现无人机目标后启动全流程监测\n2. 雷达/光电/无线电多源融合跟踪并上报\n3. 不自动升级打击，供值班员后续研判',
    disposalMode: 'auto',
    manualResponseSeconds: 0,
    threatLevel: '无',
    areaLevel: '全部',
    priority: 1,
    enabled: true,
    updatedAt: '2026-05-20 16:30:00',
    updatedBy: '系统管理员',
    triggerRules: [
      {
        id: 'ptr-plan-015-1',
        ruleName: '默认无人机监测',
        weatherFactor: '全部',
        deviceGroupId: 'dg-1002',
        deviceGroupName: '东侧频谱侦测-PL671F',
        deviceGroupType: '探测组',
        deviceFunction: 'fusion_monitor_report',
        deviceAction: '融合上报',
        enabled: true
      }
    ]
  }
]

function enrichPlan(plan: SeedInput | PlanStrategy): PlanStrategy {
  const triggerRules = (plan.triggerRules || []).map((rule, index) =>
    normalizeTriggerRule(
      sanitizeTriggerRule({ ...rule, sortOrder: Number(rule.sortOrder) || index + 1 })
    )
  )
  const primary = resolvePlanTriggerRule({ triggerRules }) || triggerRules[0]
  const disposal = normalizePlanDisposal({ ...plan, id: plan.id })
  return {
    ...(plan as PlanStrategy),
    ...disposal,
    triggerRules,
    priority: normalizePriority((plan as PlanStrategy).priority),
    weatherFactor: undefined,
    triggerConditionSummary: primary ? formatTriggerCondition(primary) : '全部',
    deviceGroupName: primary?.deviceGroupName || '',
    deviceGroupType: primary?.deviceGroupType || '',
    deviceFunction: primary?.deviceFunction || '',
    deviceAction: primary?.deviceAction || '',
    triggerRuleCount: triggerRules.length,
    triggerRulesSummary: formatTriggerRulesSummary(triggerRules)
  }
}

let allPlans: PlanStrategy[] = seed.map((item) => enrichPlan(item))

function ensureStoreVersion() {
  const g = globalThis as { __ladPlanStoreVer?: number }
  if (g.__ladPlanStoreVer === PLAN_STORE_VERSION) return
  g.__ladPlanStoreVer = PLAN_STORE_VERSION
  allPlans = seed.map((item) => enrichPlan(item))
}

export function syncPlansFromSeed() {
  ensureStoreVersion()
  const seedIds = new Set(seed.map((item) => item.id))
  const userCreated = allPlans
    .filter((item) => !seedIds.has(item.id))
    .map((item) => enrichPlan(item))
  allPlans = [...seed.map((item) => enrichPlan(item)), ...userCreated]
}

syncPlansFromSeed()

function filterPlans(q: PlanStrategyQuery): PlanStrategy[] {
  let rows = [...allPlans]
  if (q.planCode?.trim()) {
    const kw = q.planCode.trim().toLowerCase()
    rows = rows.filter((r) => r.planCode.toLowerCase().includes(kw))
  }
  if (q.planName?.trim()) {
    const kw = q.planName.trim().toLowerCase()
    rows = rows.filter((r) => r.planName.toLowerCase().includes(kw))
  }
  if (q.disposalMode === 'auto' || q.disposalMode === 'manual') {
    rows = rows.filter((r) => r.disposalMode === q.disposalMode)
  }
  if (q.deviceAction?.trim() && q.deviceAction !== '全部') {
    rows = rows.filter((r) => r.deviceAction === q.deviceAction)
  }
  if (q.planRule?.trim()) {
    const kw = q.planRule.trim().toLowerCase()
    rows = rows.filter((r) => r.planRule.toLowerCase().includes(kw))
  }
  if (q.updatedBy?.trim()) {
    const kw = q.updatedBy.trim().toLowerCase()
    rows = rows.filter((r) => r.updatedBy.toLowerCase().includes(kw))
  }
  const updatedAtStart = q.updatedAtStart
  if (updatedAtStart) rows = rows.filter((r) => r.updatedAt >= updatedAtStart)
  const updatedAtEnd = q.updatedAtEnd
  if (updatedAtEnd) rows = rows.filter((r) => r.updatedAt <= updatedAtEnd)
  rows.sort((a, b) => b.priority - a.priority)
  return rows
}

export function queryPlanList(q: PlanStrategyQuery): PlanStrategyListResult {
  syncPlansFromSeed()
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 10
  const filtered = filterPlans(q).map((item) => enrichPlan(item))
  const start = (pageIndex - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total: filtered.length }
}

export function listPlanOptions() {
  syncPlansFromSeed()
  return [...allPlans]
    .sort((a, b) => b.priority - a.priority)
    .map((p) => ({
      id: p.id,
      planCode: p.planCode,
      planName: p.planName,
      enabled: p.enabled
    }))
}

export function getPlan(id: string): PlanStrategy | null {
  syncPlansFromSeed()
  const row = allPlans.find((p) => p.id === id)
  return row ? enrichPlan(row) : null
}

export function buildPlanExecutionPayload(
  plan: PlanStrategy,
  ctx: PlanTriggerContext = {}
): PlanExecutionPayload {
  const enriched = enrichPlan(plan)
  const matched = resolvePlanTriggerRule(enriched, ctx)
  if (!matched) {
    throw new Error('预案未配置可用的触发策略规则')
  }
  return {
    planId: enriched.id,
    planCode: enriched.planCode,
    planName: enriched.planName,
    triggerRuleId: matched.id,
    triggerRuleName: matched.ruleName,
    weatherFactor: undefined,
    areaLevel: matched.areaLevel,
    temperatureOperator: matched.temperatureOperator,
    temperatureValue: matched.temperatureValue,
    humidityOperator: matched.humidityOperator,
    humidityValue: matched.humidityValue,
    windPowerOperator: matched.windPowerOperator,
    windPowerValue: matched.windPowerValue,
    rainfallOperator: matched.rainfallOperator,
    rainfallValue: matched.rainfallValue,
    deviceGroupName: matched.deviceGroupName,
    deviceFunction: matched.deviceFunction,
    deviceAction: matched.deviceAction,
    execNote: enriched.planRule,
    disposalMode: enriched.disposalMode,
    manualResponseSeconds: enriched.manualResponseSeconds,
    requiresManualConfirm: planRequiresManualConfirm(enriched)
  }
}

function normalizeSaveBody(body: PlanStrategySavePayload): PlanStrategySavePayload {
  if (!body.triggerRules?.length) {
    throw new Error('请至少配置一条触发策略规则')
  }
  const names = new Set<string>()
  const triggerRules = body.triggerRules.map((rule, index) => {
    const name = (rule.ruleName || '').trim()
    if (!name) throw new Error('请填写每条触发规则的名称')
    if (names.has(name)) throw new Error(`触发规则名称“${name}”重复`)
    names.add(name)
    return normalizeTriggerRule({
      ...rule,
      id: rule.id || `ptr-new-${index + 1}`,
      ruleName: name,
      sortOrder: Number(rule.sortOrder) || index + 1,
      enabled: rule.enabled !== false
    })
  })
  const disposal = normalizePlanDisposal({
    id: body.id || 'plan-new',
    disposalMode: body.disposalMode,
    manualResponseSeconds: body.manualResponseSeconds
  })
  return { ...body, ...disposal, triggerRules }
}

export function savePlan(body: PlanStrategySavePayload): PlanStrategy {
  const normalized = normalizeSaveBody(body)
  const now = formatNow()
  const planCode = normalized.planCode.trim() || generatePlanCode()
  const draft: PlanStrategy = {
    id: normalized.id || `plan-${Date.now()}`,
    planCode,
    planName: normalized.planName.trim(),
    planRule: normalized.planRule?.trim() || '-',
    disposalMode: normalized.disposalMode,
    manualResponseSeconds: normalized.manualResponseSeconds,
    threatLevel: normalized.threatLevel || '全部',
    areaLevel: normalized.areaLevel || '全部',
    priority: normalizePriority(normalized.priority),
    triggerRules: normalized.triggerRules,
    weatherFactor: undefined,
    deviceGroupName: '',
    deviceGroupType: '',
    deviceFunction: '',
    deviceAction: '',
    enabled: normalized.enabled,
    updatedAt: now,
    updatedBy: '当前用户'
  }
  const row = enrichPlan(draft)
  if (normalized.id) {
    const idx = allPlans.findIndex((p) => p.id === normalized.id)
    if (idx < 0) throw new Error('预案不存在')
    if (allPlans.some((p) => p.planCode === row.planCode && p.id !== normalized.id)) {
      throw new Error('预案编号已存在')
    }
    allPlans[idx] = { ...allPlans[idx], ...row }
    return { ...allPlans[idx] }
  }
  if (allPlans.some((p) => p.planCode === row.planCode)) {
    throw new Error('预案编号已存在')
  }
  allPlans.push(row)
  return { ...row }
}

export function deletePlans(ids: string[]) {
  const set = new Set(ids)
  allPlans = allPlans.filter((p) => !set.has(p.id))
}

export function togglePlanEnabled(id: string, enabled: boolean) {
  const idx = allPlans.findIndex((p) => p.id === id)
  if (idx < 0) throw new Error('预案不存在')
  allPlans[idx] = { ...allPlans[idx], enabled, updatedAt: formatNow() }
}

export function simulatePlan(input: PlanSimulateInput): PlanSimulateResult {
  syncPlansFromSeed()
  const threatLevel = input.threatLevel?.trim()
  if (!threatLevel) {
    return {
      matched: false,
      threatLevel: THREAT_LEVEL_ALL,
      message: '请先选择威胁等级'
    }
  }

  const ctx: PlanTriggerContext = {
    areaLevel: input.areaLevel,
    temperature: input.temperature,
    humidity: input.humidity,
    windPower: input.windPower,
    rainfall: input.rainfall
  }

  const enabledPlans = allPlans
    .filter((plan) => plan.enabled && matchesPlanThreatLevel(plan.threatLevel, threatLevel))
    .sort((a, b) => b.priority - a.priority)

  for (const plan of enabledPlans) {
    const enriched = enrichPlan(plan)
    const triggerRule = findMatchingTriggerRule(enriched, ctx)
    if (!triggerRule) continue

    const fnLabel = functionLabel(triggerRule.deviceGroupType, triggerRule.deviceFunction)
    const actionText = triggerRule.deviceAction || fnLabel

    return {
      matched: true,
      threatLevel,
      planName: enriched.planName,
      planCode: enriched.planCode,
      planThreatLevel: enriched.threatLevel || '全部',
      disposalMode: enriched.disposalMode,
      disposalModeLabel: enriched.disposalModeLabel,
      priority: normalizePlanPriority(enriched.priority),
      triggerRuleName: triggerRule.ruleName,
      triggerAreaLevel: formatTriggerRuleAreaLevel(triggerRule),
      triggerWeatherSummary: formatTriggerRuleWeather(triggerRule),
      deviceAction: triggerRule.deviceAction,
      deviceFunctionLabel: fnLabel,
      message: `命中预案「${enriched.planName}」，触发策略「${triggerRule.ruleName}」，反制动作「${actionText}」`
    }
  }

  return {
    matched: false,
    threatLevel,
    message: isSimulateThreatLevelAll(threatLevel)
      ? '未匹配到符合条件的启用预案'
      : `威胁等级「${threatLevel}」下未匹配到符合条件的启用预案`
  }
}

export function formatPlanExecBrief(plan: PlanStrategy, ctx: PlanTriggerContext = {}) {
  const enriched = enrichPlan(plan)
  const matched = resolvePlanTriggerRule(enriched, ctx) || enriched.triggerRules[0]
  const fn = functionLabel('', matched.deviceFunction)
  const rulePart = enriched.triggerRules.length > 1 ? `（${matched.ruleName}）` : ''
  return `${fn}${rulePart}`
}

export { resolvePlanTriggerRule } from './planTrigger'
export {
  formatDisposalModeDetail,
  planDisposalModeOptions,
  PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS
} from './planDisposal'
