import {
  functionLabel,
  planDeviceTypeOptions,
  resolveDeviceFunction
} from './planDeviceCatalog'
import {
  formatDisposalModeDetail,
  normalizePlanDisposal,
  planRequiresManualConfirm,
  PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS
} from './planDisposal'
import {
  formatTriggerRulesSummary,
  normalizeTriggerRule,
  resolvePlanTriggerRule
} from './planTrigger'
import type {
  PlanExecutionPayload,
  PlanStrategy,
  PlanStrategyListResult,
  PlanStrategyQuery,
  PlanStrategySavePayload,
  PlanTriggerRule
} from './types'
import type { PlanTriggerContext } from './planTrigger'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

type PlanSeedRow = Omit<
  PlanStrategy,
  'triggerRules' | 'disposalMode' | 'manualResponseSeconds' | 'disposalModeLabel'
> & {
  triggerRules?: PlanTriggerRule[]
  disposalMode?: PlanStrategy['disposalMode']
  manualResponseSeconds?: number
}

const seed: PlanSeedRow[] = [
  {
    id: 'plan-001',
    planCode: 'contingency-001',
    planName: '\u81ea\u52a8\u9a71\u79bb',
    planRule:
      '1.\u542f\u52a8\u5e72\u6270\u8bbe\u5907\u5e76\u5207\u81f3\u9a71\u79bb\u6a21\u5f0f\n2.\u5355\u6b21\u5de5\u4f5c\u65f6\u957f\u4e0d\u8d85\u8fc730\u79d2\n3.\u65e0\u6548\u679c\u5219\u505c\u6b62\u5e76\u901a\u77e5\u503c\u73ed\u590d\u6838',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u5168\u90e8',
    deviceType: '\u65e0\u7ebf\u7535\u5e72\u6270',
    deviceFunction: 'jam_band_expel',
    deviceAction: '\u9a71\u79bb',
    enabled: true,
    updatedAt: '2026-03-08 10:00:00',
    updatedBy: '\u5f20\u4e09'
  },
  {
    id: 'plan-002',
    planCode: 'contingency-002',
    planName: '\u8feb\u964d\u53cd\u5236',
    planRule:
      '1.\u503c\u73ed\u5458\u5728\u7ebf\u786e\u8ba4\u540e\u4e0b\u53d1\u8feb\u964d\u6307\u4ee4\n2.\u6267\u884c\u671f\u95f4\u6301\u7eed\u5149\u7535\u76d1\u6d4b\n3.\u76ee\u6807\u79bb\u5f00\u6838\u5fc3\u533a\u540e\u81ea\u52a8\u7ed3\u675f',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u6674\u5929',
    deviceType: '\u53cd\u5236\u8bbe\u5907',
    deviceFunction: 'counter_forced_land',
    deviceAction: '\u8feb\u964d',
    enabled: true,
    updatedAt: '2026-03-10 14:20:00',
    updatedBy: '\u674e\u56db'
  },
  {
    id: 'plan-003',
    planCode: 'contingency-003',
    planName: '\u5149\u7535\u8ddf\u8e2a\u8054\u52a8',
    planRule:
      '1.\u542f\u52a8\u5149\u7535\u8bbe\u5907\u8fdb\u5165\u8ddf\u8e2a\u6a21\u5f0f\n2.\u540c\u6b65\u4e0a\u62a5\u76ee\u6807\u8f68\u8ff9\u81f3\u6307\u6325\u5e73\u53f0\n3.\u4e0d\u8054\u52a8\u6253\u51fb\uff1b\u76ee\u6807\u6d88\u5931\u540e\u81ea\u52a8\u505c\u6b62',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u5168\u90e8',
    deviceType: '\u5149\u7535\u8bbe\u5907',
    deviceFunction: 'eo_track_lock',
    deviceAction: '\u8ddf\u8e2a',
    enabled: true,
    updatedAt: '2026-05-18 09:00:00',
    updatedBy: '\u7cfb\u7edf\u7ba1\u7406\u5458'
  },
  {
    id: 'plan-004',
    planCode: 'contingency-004',
    planName: '\u4eba\u5de5\u590d\u6838\u544a\u8b66',
    planRule:
      '1.\u89e6\u53d1\u58f0\u5149\u544a\u8b66\u4e0e\u5e73\u53f0\u5f39\u7a97\n2.\u503c\u73ed\u5458\u5fc5\u987b\u70b9\u51fb\u786e\u8ba4\u540e\u65b9\u53ef\u5347\u7ea7\u5904\u7f6e\n3.\u672a\u786e\u8ba4\u524d\u7981\u6b62\u81ea\u52a8\u9a71\u79bb',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u5168\u90e8',
    deviceType: '\u58f0\u5149\u544a\u8b66',
    deviceFunction: 'alarm_dispatch_notify',
    deviceAction: '\u544a\u8b66',
    enabled: false,
    updatedAt: '2026-05-01 16:00:00',
    updatedBy: '\u5b89\u5168\u4fdd\u5bc6\u5458'
  },
  {
    id: 'plan-006',
    planCode: 'contingency-006',
    planName: '\u96f7\u8fbe\u76d1\u6d4b\u8054\u52a8',
    planRule:
      '1.\u542f\u52a8\u8fb9\u754c\u96f7\u8fbe\u76d1\u6d4b\u5e76\u8bb0\u5f55\u822a\u8ff9\n2.\u4e0d\u4e0b\u53d1\u9a71\u79bb\uff1b\u4ec5\u4f9b\u503c\u73ed\u5224\u65ad\n3.\u5f02\u5e38\u822a\u8ff9\u81ea\u52a8\u6807\u6ce8\u5e76\u63a8\u9001\u544a\u8b66\u9884\u6848',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u5927\u98ce',
    deviceType: '\u96f7\u8fbe',
    deviceFunction: 'radar_track',
    deviceAction: '\u8ddf\u8e2a',
    enabled: true,
    updatedAt: '2026-05-20 08:15:00',
    updatedBy: '\u8d75\u516d'
  },
  {
    id: 'plan-007',
    planCode: 'contingency-007',
    planName: '\u8bd5\u98de\u533a\u544a\u8b66\u63d0\u793a',
    planRule:
      '1.\u4ec5\u5e73\u53f0\u5f39\u7a97\u4e0e\u58f0\u5149\u63d0\u793a\n2.\u4e0d\u542f\u52a8\u5e72\u6270\n3.\u8bb0\u5f55\u64cd\u4f5c\u5458\u4e0e\u65f6\u95f4',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u5168\u90e8',
    deviceType: '\u58f0\u5149\u544a\u8b66',
    deviceFunction: 'alarm_sound_light',
    deviceAction: '\u544a\u8b66',
    enabled: true,
    updatedAt: '2026-05-20 09:00:00',
    updatedBy: '\u5f20\u4e09'
  },
  {
    id: 'plan-008',
    planCode: 'contingency-008',
    planName: '\u8fb9\u754c\u5168\u5411\u5e72\u6270',
    planRule:
      '1.\u5168\u5411\u5e72\u6270\u6a21\u5f0f\u6700\u957f60\u79d2\n2.\u76d1\u6d4b\u5468\u8fb9\u8bbe\u5907\u72b6\u6001\n3.\u5f02\u5e38\u81ea\u52a8\u505c\u6b62\u5e76\u544a\u8b66',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u6674\u5929',
    deviceType: '\u65e0\u7ebf\u7535\u5e72\u6270',
    deviceFunction: 'jam_omni',
    deviceAction: '\u9a71\u79bb',
    enabled: true,
    updatedAt: '2026-05-20 10:00:00',
    updatedBy: '\u674e\u56db'
  },
  {
    id: 'plan-009',
    planCode: 'contingency-009',
    planName: '\u5149\u7535\u76d1\u6d4b\u4e0a\u62a5',
    planRule:
      '1.\u8fde\u7eed\u76d1\u6d4b\u4e0a\u62a5\u81f3\u6307\u6325\u5e73\u53f0\n2.\u4e0d\u81ea\u52a8\u5347\u7ea7\u5904\u7f6e\n3.\u76ee\u6807\u79bb\u5f00\u540e\u505c\u6b62',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u9634\u5929',
    deviceType: '\u5149\u7535\u8bbe\u5907',
    deviceFunction: 'eo_monitor_report',
    deviceAction: '\u8ddf\u8e2a',
    enabled: true,
    updatedAt: '2026-05-20 11:00:00',
    updatedBy: '\u7cfb\u7edf\u7ba1\u7406\u5458'
  },
  {
    id: 'plan-010',
    planCode: 'contingency-010',
    planName: '\u5bfc\u822a\u8bf1\u9a97\u9a71\u79bb',
    planRule:
      '1.\u5bfc\u822a\u8bf1\u9a17\u6a21\u5f0f\u4e0d\u8d85\u8fc745\u79d2\n2.\u6267\u884c\u4e2d\u7981\u6b62\u5207\u6362\u9891\u6bb5\n3.\u7ed3\u675f\u540e\u751f\u6210\u5907\u6ce8',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u5168\u90e8',
    deviceType: '\u65e0\u7ebf\u7535\u5e72\u6270',
    deviceFunction: 'jam_nav_spoof',
    deviceAction: '\u9a71\u79bb',
    enabled: true,
    updatedAt: '2026-05-20 12:00:00',
    updatedBy: '\u738b\u4e94'
  },
  {
    id: 'plan-011',
    planCode: 'contingency-011',
    planName: '\u7f51\u7edc\u65ad\u94fe\u8feb\u964d',
    planRule:
      '1.\u65ad\u94fe\u6301\u7eed\u81f3\u76ee\u6807\u79bb\u5f00\n2.\u9700\u4e8c\u7ea7\u5ba1\u6279\u540e\u6267\u884c\n3.\u5931\u8d25\u81ea\u52a8\u56de\u9000\u544a\u8b66\u9884\u6848',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u96e8\u5929',
    deviceType: '\u53cd\u5236\u8bbe\u5907',
    deviceFunction: 'counter_net_cut',
    deviceAction: '\u8feb\u964d',
    enabled: false,
    updatedAt: '2026-05-20 13:00:00',
    updatedBy: '\u5b89\u5168\u4fdd\u5bc6\u5458'
  },
  {
    id: 'plan-012',
    planCode: 'contingency-012',
    planName: '\u96f7\u8fbe\u8ddf\u8e2a\u5907\u6ce8',
    planRule:
      '1.\u8bb0\u5f55\u822a\u8ff9\u4e0e\u901f\u5ea6\u66f2\u7ebf\n2.\u4e0d\u8054\u52a8\u6253\u51fb\n3.\u5f02\u5e38\u8f68\u8ff9\u6807\u6ce8\u4f20\u503c\u73ed',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u5927\u98ce',
    deviceType: '\u96f7\u8fbe',
    deviceFunction: 'radar_track',
    deviceAction: '\u8ddf\u8e2a',
    enabled: true,
    updatedAt: '2026-05-20 14:00:00',
    updatedBy: '\u8d75\u516d'
  },
  {
    id: 'plan-013',
    planCode: 'contingency-013',
    planName: '\u8702\u7fa4\u590d\u5408\u53cd\u5236',
    planRule:
      '1.\u68c0\u6d4b\u8702\u7fa4\u22653\u67b6\u540e\u81ea\u52a8\u5347\u7ea7\u5a01\u80f1\n2.\u4eba\u5de5\u4e8c\u7ea7\u786e\u8ba4\u540e\u5f00\u5149\n3.\u9a71\u79bb\u5931\u8d25\u65f6\u4e0d\u56de\u9000\u9a71\u79bb\u9884\u6848',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u6674\u5929',
    deviceType: '\u6fc0\u5149\u6253\u51fb\u8bbe\u5907',
    deviceFunction: 'laser_precision_strike',
    deviceAction: '\u6fc0\u5149\u6253\u51fb',
    enabled: true,
    updatedAt: '2026-05-20 15:00:00',
    updatedBy: '\u7cfb\u7edf\u7ba1\u7406\u5458'
  },
  {
    id: 'plan-014',
    planCode: 'contingency-014',
    planName: '\u8702\u7fa4\u9ad8\u529f\u7387\u5fae\u6ce2',
    planRule:
      '1.\u5bf9\u5165\u4fb5\u8702\u7fa4\u5b9e\u65bd\u533a\u57df\u5fae\u6ce2\n2.\u9700\u6307\u6325\u5458\u4e8c\u7ea7\u6388\u6743\n3.\u6253\u51fb\u540e\u5168\u5411\u76d1\u6d4b\u5907\u6ce8',
    areaLevel: '\u5168\u90e8',
    weatherFactor: '\u6674\u5929',
    deviceType: '\u9ad8\u529f\u7387\u5fae\u6ce2\u8bbe\u5907',
    deviceFunction: 'hpm_swarm_burst',
    deviceAction: '\u9ad8\u529f\u7387\u5fae\u6ce2',
    enabled: true,
    updatedAt: '2026-05-20 15:10:00',
    updatedBy: '\u7cfb\u7edf\u7ba1\u7406\u5458'
  }
]

/** 数据版本：升级后会合并种子数据 */
export const PLAN_STORE_VERSION = 12

/** 默认兜底规则优先级（低于各场景专用规则，便于「大雾」等覆盖「全部」） */
export const PLAN_DEFAULT_RULE_PRIORITY = 5

const SWARM_PLAN_013_RULES: PlanTriggerRule[] = [
  {
    id: 'ptr-plan-013-1',
    ruleName: '默认-全部场景',
    priority: PLAN_DEFAULT_RULE_PRIORITY,
    weatherFactor: '全部',
    areaLevel: '全部',
    deviceType: '激光打击设备',
    deviceFunction: 'laser_precision_strike',
    deviceAction: '激光打击',
    enabled: true
  },
  {
    id: 'ptr-plan-013-2',
    ruleName: '大雾天',
    priority: 25,
    weatherFactor: '大雾',
    areaLevel: '全部',
    deviceType: '高功率微波设备',
    deviceFunction: 'hpm_swarm_burst',
    deviceAction: '高功率微波',
    enabled: true,
    remark: '大雾能见度低时改用区域微波覆盖'
  }
]

function triggerRuleId(planId: string, index: number) {
  return `ptr-${planId}-${index}`
}

function isLegacyPlanRule(rule?: string) {
  const text = rule || ''
  return (
    /m\/s/i.test(text) ||
    /\u901f\u5ea6\s*>/.test(text) ||
    /\u901f\u5ea6>/.test(text) ||
    /\u9ed1\u540d\u5355\u76ee\u6807/.test(text) ||
    /\u4e14\u901f\u5ea6</.test(text)
  )
}

function isLegacyPlanRow(p: PlanStrategy & { triggerRules?: PlanTriggerRule[] }) {
  return (
    !p.triggerRules?.length ||
    !p.deviceType ||
    !p.deviceFunction ||
    !p.disposalMode ||
    isLegacyPlanRule(p.planRule)
  )
}

function legacyToTriggerRules(p: PlanStrategy & { triggerRules?: PlanTriggerRule[] }): PlanTriggerRule[] {
  if (p.triggerRules?.length) {
    return p.triggerRules.map((r) => ({ ...r }))
  }
  const deviceType = p.deviceType || planDeviceTypeOptions[0].value
  const fn = resolveDeviceFunction(deviceType, p.deviceFunction)
  return [
    {
      id: triggerRuleId(p.id, 1),
      ruleName: '默认-全部场景',
      priority: PLAN_DEFAULT_RULE_PRIORITY,
      weatherFactor: '全部',
      areaLevel: p.areaLevel || '全部',
      deviceType,
      deviceFunction: p.deviceFunction || fn?.value || '',
      deviceAction: p.deviceAction || fn?.deviceAction || '',
      enabled: true
    }
  ]
}

function applySeedTriggerOverrides(p: PlanStrategy): PlanStrategy {
  if (p.id === 'plan-013' && (!p.triggerRules?.length || p.triggerRules.length < 2)) {
    return {
      ...p,
      planName: '蜂群复合反制',
      planRule:
        '1.检测蜂群≥3架后自动升级威慑\n2.默认激光打击；大雾天自动切换高功率微波\n3.驱离失败时不回退驱离预案',
      triggerRules: SWARM_PLAN_013_RULES.map((r) => ({ ...r }))
    }
  }
  return p
}

function enrichPlan(p: PlanStrategy & { triggerRules?: PlanTriggerRule[] }): PlanStrategy {
  const base = applySeedTriggerOverrides({ ...p })
  const triggerRules = legacyToTriggerRules(base).map((r, i) =>
    normalizeTriggerRule(
      { ...r, id: r.id || triggerRuleId(base.id, i + 1) },
      base.deviceType
    )
  )
  const withRules: PlanStrategy = { ...base, triggerRules }
  const primary = resolvePlanTriggerRule(withRules) || triggerRules[0]
  const enabledWeathers = [
    ...new Set(triggerRules.filter((r) => r.enabled).map((r) => r.weatherFactor))
  ]
  const safeRules = triggerRules.length
    ? triggerRules
    : [normalizeTriggerRule(legacyToTriggerRules(base)[0], base.deviceType)]

  const disposal = normalizePlanDisposal({ ...base, id: base.id })

  return {
    ...withRules,
    ...disposal,
    triggerRules: safeRules,
    triggerRuleCount: safeRules.length,
    triggerRulesSummary: formatTriggerRulesSummary(safeRules),
    areaLevel: primary?.areaLevel || '全部',
    weatherFactor:
      enabledWeathers.length > 1 ? '多场景' : primary?.weatherFactor || '全部',
    deviceType: primary?.deviceType || '',
    deviceFunction: primary?.deviceFunction || '',
    deviceAction: primary?.deviceAction || ''
  }
}

function ensureStoreVersion() {
  const g = globalThis as { __ladPlanStoreVer?: number }
  if (g.__ladPlanStoreVer === PLAN_STORE_VERSION) return
  g.__ladPlanStoreVer = PLAN_STORE_VERSION
  allPlans = seed.map((p) => enrichPlan(p as PlanStrategy))
}

let allPlans: PlanStrategy[] = seed.map((p) => enrichPlan(p as PlanStrategy))

/** 合并种子：补齐缺失字段，替换旧版示例数据 */
export function syncPlansFromSeed() {
  ensureStoreVersion()
  const seedIds = new Set(seed.map((s) => s.id))
  const userCreated = allPlans
    .filter((p) => !seedIds.has(p.id))
    .map((p) => enrichPlan(p as PlanStrategy))

  const merged = seed.map((s) => {
    const existing = allPlans.find((p) => p.id === s.id)
    const row = enrichPlan({ ...s } as PlanStrategy)
    if (existing && !isLegacyPlanRow(existing)) {
      return {
        ...row,
        planRule: isLegacyPlanRule(existing.planRule) ? row.planRule : existing.planRule,
        updatedAt: existing.updatedAt,
        updatedBy: existing.updatedBy
      }
    }
    return row
  })

  allPlans = [...merged, ...userCreated]
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
  if (q.deviceType?.trim() && q.deviceType !== '\u5168\u90e8') {
    const dt = q.deviceType.trim()
    rows = rows.filter(
      (r) =>
        r.deviceType === dt ||
        r.triggerRules?.some((tr) => tr.deviceType === dt && tr.enabled)
    )
  }
  if (q.weatherFactor?.trim() && q.weatherFactor !== '\u5168\u90e8') {
    const wf = q.weatherFactor.trim()
    rows = rows.filter(
      (r) =>
        r.weatherFactor === wf ||
        r.weatherFactor === '\u591a\u573a\u666f' ||
        r.triggerRules?.some(
          (tr) =>
            tr.enabled &&
            (tr.weatherFactor === wf || tr.weatherFactor === '\u5168\u90e8')
        )
    )
  }
  if (q.deviceAction?.trim() && q.deviceAction !== '\u5168\u90e8') {
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
  if (q.updatedAtStart) rows = rows.filter((r) => r.updatedAt >= q.updatedAtStart!)
  if (q.updatedAtEnd) rows = rows.filter((r) => r.updatedAt <= q.updatedAtEnd!)
  return rows
}

export function queryPlanList(q: PlanStrategyQuery): PlanStrategyListResult {
  syncPlansFromSeed()
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 10
  const filtered = filterPlans(q).map((p) => enrichPlan({ ...p }))
  const start = (pageIndex - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total: filtered.length }
}

export function listPlanOptions() {
  syncPlansFromSeed()
  return allPlans.map((p) => ({
    id: p.id,
    planCode: p.planCode,
    planName: p.planName,
    enabled: p.enabled
  }))
}

export function getPlan(id: string): PlanStrategy | null {
  syncPlansFromSeed()
  const row = allPlans.find((p) => p.id === id)
  return row ? enrichPlan({ ...row }) : null
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
    weatherFactor: matched.weatherFactor,
    deviceType: matched.deviceType,
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
  const triggerRules = body.triggerRules.map((r, i) => {
    const name = (r.ruleName || '').trim()
    if (!name) throw new Error('请填写每条触发规则的名称')
    if (names.has(name)) throw new Error(`触发规则名称「${name}」重复`)
    names.add(name)
    return normalizeTriggerRule(
      {
        ...r,
        id: r.id || `ptr-new-${i + 1}`,
        ruleName: name,
        priority: Number(r.priority) || 10,
        enabled: r.enabled !== false
      },
      r.deviceType
    )
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
  const draft: PlanStrategy = {
    id: normalized.id || `plan-${Date.now()}`,
    planCode: normalized.planCode.trim(),
    planName: normalized.planName.trim(),
    planRule: normalized.planRule?.trim() || '-',
    disposalMode: normalized.disposalMode,
    manualResponseSeconds: normalized.manualResponseSeconds,
    triggerRules: normalized.triggerRules,
    areaLevel: '全部',
    weatherFactor: '全部',
    deviceType: '',
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
  if (idx < 0) throw new Error('\u9884\u6848\u4e0d\u5b58\u5728')
  allPlans[idx] = { ...allPlans[idx], enabled, updatedAt: formatNow() }
}

export function formatPlanExecBrief(plan: PlanStrategy, ctx: PlanTriggerContext = {}) {
  const enriched = enrichPlan(plan)
  const matched = resolvePlanTriggerRule(enriched, ctx) || enriched.triggerRules[0]
  const fn = functionLabel(matched.deviceType, matched.deviceFunction)
  const rulePart =
    enriched.triggerRules.length > 1 ? `（${matched.ruleName}）` : ''
  return `${matched.deviceType} / ${fn}${rulePart}`
}

export { resolvePlanTriggerRule } from './planTrigger'
export {
  formatDisposalModeDetail,
  planDisposalModeOptions,
  PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS
} from './planDisposal'
