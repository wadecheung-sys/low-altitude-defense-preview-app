import { functionLabel } from '../plan/planDeviceCatalog'
import { getPlan, listPlanOptions } from '../plan/planStore'
import { formatDisposalExecNote } from '../plan/planDisposal'
import { resolvePlanTriggerRule } from '../plan/planTrigger'
import { listAreaRegions } from '../area/areaStore'
import { coerceThreatLevelLabel, normalizeThreatLevel } from './threatLevelUtils'
import {
  isMonitorCatchAllRule,
  monitorCatchAllNote,
  THREAT_MONITOR_RULE_ID
} from './threatFallback'
import {
  deriveThreatLevel,
  effectiveRulePriority,
  isSwarmRule,
  isSwarmSimulateInput,
  resolveThreatLevelKey,
  swarmEscalationNote,
  SWARM_TARGET_TYPE
} from './threatSwarm'
import type {
  RuleCondition,
  RuleConditionLogic,
  ThreatAssessResult,
  ThreatAreaScope,
  ThreatLevelLabel,
  ThreatLevelScope,
  ThreatRule,
  ThreatRuleListResult,
  ThreatRuleQuery,
  ThreatRuleSavePayload,
  ThreatSimulateInput,
  ThreatSimulateResult
} from './types'

const propertyLabel: Record<string, string> = {
  speed: '\u901f\u5ea6',
  stayDuration: '\u9017\u7559\u65f6\u95f4',
  intrusionCount: '\u5165\u4fb5\u6b21\u6570',
  swarmCount: '\u8702\u7fa4\u673a\u6570',
  altitude: '\u98de\u884c\u9ad8\u5ea6',
  signalStrength: '\u4fe1\u53f7\u5f3a\u5ea6',
  locatedArea: '\u6240\u5904\u533a\u57df'
}

const threatTargetModelFallbacks = [
  'DJI Mavic 3',
  'DJI Matrice 300 RTK',
  'Autel EVO II',
  'DJI Mini 4 Pro',
  'DJI Air 3',
  'DJI Mavic 3T',
  'DJI Phantom 4 RTK'
]

function normalizeThreatTargetType(value?: string) {
  if (
    value === '\u5168\u90e8' ||
    value === '\u9ed1\u540d\u5355' ||
    value === '\u767d\u540d\u5355'
  ) {
    return value
  }
  return '\u672a\u77e5'
}

function formatAreaConditionValue(value: string) {
  const ids = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (!ids.length) return value
  const areaMap = new Map(listAreaRegions().map((item) => [item.id, item.name]))
  const names = ids.map((id) => areaMap.get(id) || id)
  return names.join('、')
}

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function generateThreatRuleCode() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  let code = ''
  do {
    code = `THREAT-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(
      d.getHours()
    )}${p(d.getMinutes())}${p(d.getSeconds())}${p(Math.floor(Math.random() * 100))}`
  } while (allRules.some((rule) => rule.ruleCode === code))
  return code
}

function normalizeConditionLogic(value?: string): RuleConditionLogic {
  return value === 'or' ? 'or' : 'and'
}

function conditionLogicLabel(logic?: RuleConditionLogic) {
  return logic === 'or' ? ' 或 ' : ' 且 '
}

function normalizeConditionList(
  conditions: RuleCondition[],
  fallbackLogic: RuleConditionLogic = 'and'
) {
  return conditions.map((condition, index) => ({
    ...condition,
    nextLogic:
      index < conditions.length - 1
        ? normalizeConditionLogic(condition.nextLogic || fallbackLogic)
        : undefined
  }))
}

function buildConditionText(c: RuleCondition) {
  const prop = propertyLabel[c.property] || c.property
  if (c.property === 'locatedArea') {
    return `${prop} = ${formatAreaConditionValue(c.value)}`
  }
  const unit =
    c.property === 'speed'
      ? 'm/s'
      : c.property === 'stayDuration'
        ? 'min'
        : c.property === 'swarmCount'
          ? '架'
          : c.property === 'altitude'
            ? 'm'
            : ''
  return `${prop} ${c.operator} ${c.value}${unit}`
}

function buildSummary(conditions: RuleCondition[], logic: RuleConditionLogic = 'and') {
  if (!conditions.length) return '无（任意场景）'
  const normalized = normalizeConditionList(conditions, logic)
  return normalized
    .map((c, index) => {
      const text = buildConditionText(c)
      if (index >= normalized.length - 1) return text
      return `${text}${conditionLogicLabel(c.nextLogic)}`
    })
    .join('')
}

/** 与威胁规则列表/详情中的「判级条件」展示格式一致 */
export function formatThreatConditionSummary(
  conditions: RuleCondition[],
  logic: RuleConditionLogic = 'and'
): string {
  return buildSummary(conditions, logic)
}

function evalConditions(conditions: RuleCondition[], input: ThreatSimulateInput) {
  if (!conditions.length) return true
  const normalized = normalizeConditionList(conditions)
  return normalized.reduce((result, condition, index) => {
    const current = evalCondition(condition, input)
    if (index === 0) return current
    const previous = normalized[index - 1]
    return previous.nextLogic === 'or' ? result || current : result && current
  }, true)
}

function legacyBuildSummary(conditions: RuleCondition[], logic: RuleConditionLogic = 'and') {
  const joiner = logic === 'or' ? ' 或 ' : ' 且 '
  return conditions
    .map((c) => {
      const prop = propertyLabel[c.property] || c.property
      if (c.property === 'locatedArea') {
        return `${prop} = ${formatAreaConditionValue(c.value)}`
      }
      const unit =
        c.property === 'speed'
          ? 'm/s'
          : c.property === 'stayDuration'
            ? 'min'
            : c.property === 'swarmCount'
              ? '\u67b6'
              : c.property === 'altitude'
                ? 'm'
                : ''
      return `${prop} ${c.operator} ${c.value}${unit}`
    })
    .join(joiner)
}
void legacyBuildSummary

function evalCondition(c: RuleCondition, input: ThreatSimulateInput): boolean {
  const num = Number(c.value)
  if (Number.isNaN(num)) return false
  switch (c.property) {
    case 'speed': {
      const v = input.speed ?? 0
      return compare(v, c.operator, num)
    }
    case 'stayDuration': {
      const v = input.stayMinutes ?? 0
      return compare(v, c.operator, num)
    }
    case 'intrusionCount': {
      const v = input.intrusionCount ?? 0
      return compare(v, c.operator, num)
    }
    case 'swarmCount': {
      const v = input.swarmCount ?? input.intrusionCount ?? 0
      return compare(v, c.operator, num)
    }
    default:
      return true
  }
}

function compare(v: number, op: string, n: number) {
  switch (op) {
    case '>':
      return v > n
    case '>=':
      return v >= n
    case '<':
      return v < n
    case '<=':
      return v <= n
    case '=':
      return v === n
    default:
      return false
  }
}

function ruleMatches(rule: ThreatRule, input: ThreatSimulateInput): boolean {
  if (!rule.enabled) return false
  if (
    input.areaRegionType &&
    rule.areaRegionType !== '\u5168\u90e8' &&
    rule.areaRegionType !== input.areaRegionType
  ) {
    return false
  }
  if (
    input.targetType &&
    rule.targetType !== '\u5168\u90e8' &&
    rule.targetType !== input.targetType
  ) {
    return false
  }
  return evalConditions(rule.conditions, input)
}

function normalizeRuleThreatLevel(
  level: string | undefined,
  rule: ThreatRuleSavePayload
): ThreatLevelScope {
  if (level?.trim() === '全部') return '全部'
  return coerceThreatLevelLabel(level) ?? deriveThreatLevel(rule)
}

function normalizePriority(value: unknown) {
  const priority = Number(value)
  if (!Number.isFinite(priority)) return 500
  return Math.min(999, Math.max(0, Math.trunc(priority)))
}

function normalizeThreatTargetModel(row: ThreatRule & Record<string, unknown>) {
  const value = String(row.targetModel || '').trim()
  if (value && value !== '蜂群目标') return value
  if (value === '蜂群目标') return '全部型号'
  const numericId = Number(String(row.id || '').match(/\d+/)?.[0])
  if (Number.isFinite(numericId) && numericId > 0) {
    return threatTargetModelFallbacks[(numericId - 1) % threatTargetModelFallbacks.length]
  }
  return '未知型号'
}

function migrateLegacyRule(row: ThreatRule & Record<string, unknown>): ThreatRule {
  const legacyArea = row.areaLevel as string | undefined
  const legacyScenario = row.scenario as string | undefined
  const areaMap: Record<string, ThreatAreaScope> = {
    '\u4e00\u7ea7': 'nuclear',
    '\u4e8c\u7ea7': 'alert',
    '\u4e09\u7ea7': 'warning',
    '\u8bd5\u98de\u533a': 'testflight'
  }
  let areaRegionType =
    (row.areaRegionType as ThreatAreaScope) || areaMap[legacyArea || ''] || 'warning'
  if (!row.areaRegionType && legacyArea === '\u5168\u90e8') areaRegionType = '\u5168\u90e8'
  let threatLevel: ThreatLevelScope
  if ((row.threatLevel as string) === '全部') {
    threatLevel = '全部'
  } else {
    const coerced = coerceThreatLevelLabel(row.threatLevel as string | undefined) as
      | ThreatLevelLabel
      | undefined
    const enabled = Boolean(row.enabled)
    if (!coerced) {
      threatLevel = deriveThreatLevel({
        enabled,
        priority: row.priority as number,
        targetType: row.targetType as string
      })
    } else {
      threatLevel = coerced
    }
  }
  const { areaLevel: _a, scenario: _s, ...rest } = row
  void _a
  void _s
  void legacyScenario
  return {
    ...rest,
    areaRegionType,
    threatLevel,
    conditionLogic: normalizeConditionLogic(row.conditionLogic as string | undefined),
    targetType: normalizeThreatTargetType(row.targetType as string | undefined),
    targetModel: normalizeThreatTargetModel(row)
  } as ThreatRule
}

type SeedRow = Omit<ThreatRule, 'conditionSummary' | 'conditionLogic'> & {
  conditions: RuleCondition[]
  conditionLogic?: RuleConditionLogic
}

function buildSeedRow(row: SeedRow): ThreatRule {
  const conditionLogic = normalizeConditionLogic(row.conditionLogic)
  return {
    ...row,
    conditionLogic,
    conditionSummary: buildSummary(row.conditions, conditionLogic)
  }
}

const seed: ThreatRule[] = [
  buildSeedRow({
    id: 'rule-001',
    ruleCode: 'PLAN-001',
    ruleName: '保护区-自动驱离',
    areaRegionType: 'warning',
    threatLevel: '高危',
    targetType: '未知',
    targetModel: 'DJI Mavic 3',
    areaName: '保护区',
    conditions: [
      { id: 'c1', property: 'speed', operator: '>', value: '5' },
      { id: 'c2', property: 'stayDuration', operator: '>', value: '10' }
    ],
    priority: 700,
    planId: 'plan-001',
    planName: '自动驱离',
    enabled: true,
    updatedAt: '2026-05-20 10:00:00',
    updatedBy: '张三'
  }),
  buildSeedRow({
    id: 'rule-002',
    ruleCode: 'PLAN-002',
    ruleName: '核心区-黑名单高级告警',
    areaRegionType: 'nuclear',
    threatLevel: '高危',
    targetType: '黑名单',
    targetModel: 'DJI Matrice 300 RTK',
    areaName: '核心保护区',
    conditions: [
      { id: 'c3', property: 'intrusionCount', operator: '>=', value: '1' },
      { id: 'c4', property: 'speed', operator: '>', value: '3' }
    ],
    priority: 950,
    planId: 'plan-002',
    planName: '迫降反制',
    enabled: true,
    updatedAt: '2026-05-19 15:30:00',
    updatedBy: '李四'
  }),
  buildSeedRow({
    id: 'rule-003',
    ruleCode: 'PLAN-003',
    ruleName: '缓冲区-跟踪联动',
    areaRegionType: 'alert',
    threatLevel: '中危',
    targetType: '全部',
    targetModel: '未知型号',
    areaName: '缓冲区',
    conditions: [{ id: 'c5', property: 'speed', operator: '>', value: '8' }],
    priority: 500,
    planId: 'plan-003',
    planName: '光电跟踪联动',
    enabled: true,
    updatedAt: '2026-05-18 09:00:00',
    updatedBy: '系统管理员'
  }),
  buildSeedRow({
    id: 'rule-004',
    ruleCode: 'PLAN-004',
    ruleName: '试飞区-仅告警',
    areaRegionType: 'testflight',
    threatLevel: '无危',
    targetType: '全部',
    targetModel: '未知型号',
    areaName: '试飞区',
    conditions: [{ id: 'c6', property: 'stayDuration', operator: '>', value: '5' }],
    priority: 0,
    planId: 'plan-004',
    planName: '人工复核告警',
    enabled: false,
    updatedAt: '2026-05-01 12:00:00',
    updatedBy: '安全保密员'
  }),
  buildSeedRow({
    id: 'rule-006',
    ruleCode: 'PLAN-006',
    ruleName: '核心区-雷达联动告警',
    areaRegionType: 'nuclear',
    threatLevel: '高危',
    targetType: '黑名单',
    targetModel: 'Autel EVO II',
    areaName: '核心保护区',
    conditions: [{ id: 'c8', property: 'intrusionCount', operator: '>=', value: '1' }],
    priority: 900,
    planId: 'plan-006',
    planName: '雷达监测联动',
    enabled: true,
    updatedAt: '2026-05-16 14:00:00',
    updatedBy: '李四'
  }),
  buildSeedRow({
    id: 'rule-007',
    ruleCode: 'PLAN-007',
    ruleName: '试飞区-告警提示',
    areaRegionType: 'testflight',
    threatLevel: '低危',
    targetType: '全部',
    targetModel: 'DJI Mini 4 Pro',
    areaName: '试飞区',
    conditions: [{ id: 'c9', property: 'speed', operator: '>', value: '2' }],
    priority: 200,
    planId: 'plan-007',
    planName: '试飞区告警提示',
    enabled: true,
    updatedAt: '2026-05-15 09:30:00',
    updatedBy: '系统管理员'
  }),
  buildSeedRow({
    id: 'rule-008',
    ruleCode: 'PLAN-008',
    ruleName: '边界区-全向干扰',
    areaRegionType: 'alert',
    threatLevel: '高危',
    targetType: '全部',
    targetModel: '未知型号',
    areaName: '边界缓冲区',
    conditions: [{ id: 'c10', property: 'speed', operator: '>', value: '6' }],
    priority: 760,
    planId: 'plan-008',
    planName: '边界全向干扰',
    enabled: true,
    updatedAt: '2026-05-14 16:45:00',
    updatedBy: '赵六'
  }),
  buildSeedRow({
    id: 'rule-009',
    ruleCode: 'PLAN-009',
    ruleName: '光电监测上报',
    areaRegionType: 'warning',
    threatLevel: '高危',
    targetType: '未知',
    targetModel: 'DJI Air 3',
    areaName: '保护区',
    conditions: [{ id: 'c11', property: 'stayDuration', operator: '>', value: '3' }],
    priority: 680,
    planId: 'plan-009',
    planName: '光电监测上报',
    enabled: true,
    updatedAt: '2026-05-13 10:10:00',
    updatedBy: '张三'
  }),
  buildSeedRow({
    id: 'rule-010',
    ruleCode: 'PLAN-010',
    ruleName: '导航诱骗驱离',
    areaRegionType: 'nuclear',
    threatLevel: '高危',
    targetType: '黑名单',
    targetModel: 'DJI Mavic 3T',
    areaName: '核心保护区',
    conditions: [{ id: 'c12', property: 'speed', operator: '>', value: '2' }],
    priority: 880,
    planId: 'plan-010',
    planName: '导航诱骗驱离',
    enabled: true,
    updatedAt: '2026-05-12 08:00:00',
    updatedBy: '李四'
  }),
  buildSeedRow({
    id: 'rule-011',
    ruleCode: 'PLAN-011',
    ruleName: '网络断链迫降',
    areaRegionType: 'alert',
    threatLevel: '中危',
    targetType: '全部',
    targetModel: '未知型号',
    areaName: '缓冲区',
    conditions: [{ id: 'c13', property: 'intrusionCount', operator: '>=', value: '2' }],
    priority: 460,
    planId: 'plan-011',
    planName: '网络断链迫降',
    enabled: true,
    updatedAt: '2026-05-11 13:25:00',
    updatedBy: '王五'
  }),
  buildSeedRow({
    id: 'rule-012',
    ruleCode: 'PLAN-012',
    ruleName: '雷达跟踪备注',
    areaRegionType: 'warning',
    threatLevel: '低危',
    targetType: '未知',
    targetModel: 'DJI Phantom 4 RTK',
    areaName: '保护区',
    conditions: [{ id: 'c14', property: 'speed', operator: '>', value: '7' }],
    priority: 240,
    planId: 'plan-012',
    planName: '雷达跟踪备注',
    enabled: true,
    updatedAt: '2026-05-10 17:50:00',
    updatedBy: '系统管理员'
  }),
  buildSeedRow({
    id: 'rule-013',
    ruleCode: 'SWARM-001',
    ruleName: '蜂群入侵-复合反制',
    areaRegionType: 'nuclear',
    threatLevel: '高危',
    targetType: '未知',
    targetModel: '全部型号',
    areaName: '核心保护区',
    conditions: [
      { id: 'c15', property: 'swarmCount', operator: '>=', value: '3' },
      { id: 'c16', property: 'speed', operator: '>', value: '2' }
    ],
    priority: 980,
    planId: 'plan-013',
    planName: '蜂群复合反制',
    enabled: true,
    updatedAt: '2026-05-20 16:00:00',
    updatedBy: '系统管理员'
  }),
  buildSeedRow({
    id: 'rule-014',
    ruleCode: 'SWARM-002',
    ruleName: '蜂群入侵-高功率微波',
    areaRegionType: 'alert',
    threatLevel: '高危',
    targetType: '未知',
    targetModel: '全部型号',
    areaName: '缓冲区',
    conditions: [{ id: 'c17', property: 'swarmCount', operator: '>=', value: '5' }],
    priority: 940,
    planId: 'plan-014',
    planName: '蜂群高功率微波',
    enabled: true,
    updatedAt: '2026-05-20 16:05:00',
    updatedBy: '安全保密员'
  }),
  buildSeedRow({
    id: THREAT_MONITOR_RULE_ID,
    ruleCode: 'MONITOR-001',
    ruleName: '无人机设备监测',
    areaRegionType: '全部',
    threatLevel: '无危',
    targetType: '全部',
    targetModel: '全部型号',
    areaName: '全部',
    conditions: [],
    priority: 1,
    planId: 'plan-015',
    planName: '无人机设备监测',
    enabled: true,
    updatedAt: '2026-05-20 16:30:00',
    updatedBy: '系统管理员'
  })
]

export const THREAT_STORE_VERSION = 13

const seedThreatLevelById = Object.fromEntries(seed.map((s) => [s.id, s.threatLevel])) as Record<
  string,
  ThreatLevelLabel
>

let allRules: ThreatRule[] = seed.map((r) =>
  migrateLegacyRule(r as ThreatRule & Record<string, unknown>)
)

/** 开发热更新时重置内存规则，避免旧结构缺少 threatLevel 导致列表显示空标签 */
function ensureStoreVersion() {
  const g = globalThis as { __ladThreatStoreVer?: number }
  if (g.__ladThreatStoreVer === THREAT_STORE_VERSION) return
  g.__ladThreatStoreVer = THREAT_STORE_VERSION
  allRules = seed.map((r) => migrateLegacyRule(r as ThreatRule & Record<string, unknown>))
}

/** \u5408\u5e76\u79cd\u5b50\uff1a\u8865\u9f50\u5217\u8868\u793a\u4f8b\u6570\u636e */
export function syncRulesFromSeed() {
  ensureStoreVersion()
  const seedIds = new Set(seed.map((s) => s.id))
  const userCreated = allRules.filter((r) => !seedIds.has(r.id))

  const merged = seed.map((s) => {
    const existing = allRules.find((r) => r.id === s.id)
    const plan = getPlan(s.planId)
    const base = {
      ...s,
      conditionLogic: normalizeConditionLogic(s.conditionLogic),
      conditionSummary: buildSummary(s.conditions, normalizeConditionLogic(s.conditionLogic)),
      planName: plan?.planName || s.planName
    }
    if (!existing) return migrateLegacyRule(base as ThreatRule & Record<string, unknown>)
    const seedLevel = seedThreatLevelById[s.id]
    return migrateLegacyRule({
      ...existing,
      ...base,
      threatLevel: seedLevel ?? base.threatLevel,
      areaRegionType: base.areaRegionType,
      conditionLogic: normalizeConditionLogic(existing.conditionLogic || s.conditionLogic),
      conditions: existing.conditions?.length ? existing.conditions : s.conditions,
      conditionSummary: buildSummary(
        existing.conditions?.length ? existing.conditions : s.conditions,
        normalizeConditionLogic(existing.conditionLogic || s.conditionLogic)
      ),
      planName: plan?.planName || existing.planName || s.planName,
      updatedAt: existing.updatedAt,
      updatedBy: existing.updatedBy
    } as ThreatRule & Record<string, unknown>)
  })

  allRules = [
    ...merged,
    ...userCreated.map((r) => migrateLegacyRule(r as ThreatRule & Record<string, unknown>))
  ]
}

ensureStoreVersion()
syncRulesFromSeed()

function filterRules(q: ThreatRuleQuery): ThreatRule[] {
  let rows = [...allRules]
  if (q.ruleCode?.trim()) {
    const kw = q.ruleCode.trim().toLowerCase()
    rows = rows.filter((r) => r.ruleCode.toLowerCase().includes(kw))
  }
  if (q.ruleName?.trim()) {
    const kw = q.ruleName.trim().toLowerCase()
    rows = rows.filter((r) => r.ruleName.toLowerCase().includes(kw))
  }
  if (q.areaRegionType && q.areaRegionType !== '\u5168\u90e8' && q.areaRegionType !== '') {
    rows = rows.filter(
      (r) => r.areaRegionType === q.areaRegionType || r.areaRegionType === '\u5168\u90e8'
    )
  }
  if (q.threatLevel && q.threatLevel !== '\u5168\u90e8' && q.threatLevel !== '') {
    rows = rows.filter((r) => r.threatLevel === q.threatLevel)
  }
  if (q.targetType && q.targetType !== '\u5168\u90e8' && q.targetType !== '') {
    rows = rows.filter((r) => r.targetType === q.targetType || r.targetType === '\u5168\u90e8')
  }
  if (q.targetModel?.trim()) {
    const kw = q.targetModel.trim().toLowerCase()
    rows = rows.filter((r) => r.targetModel.toLowerCase().includes(kw))
  }
  if (q.targetProperty) {
    rows = rows.filter((r) => r.conditions.some((c) => c.property === q.targetProperty))
  }
  if (q.status === 'enabled') rows = rows.filter((r) => r.enabled)
  if (q.status === 'disabled') rows = rows.filter((r) => !r.enabled)
  if (q.updatedBy?.trim()) {
    const kw = q.updatedBy.trim().toLowerCase()
    rows = rows.filter((r) => r.updatedBy.toLowerCase().includes(kw))
  }
  rows.sort((a, b) => b.priority - a.priority)
  return rows
}

export function queryThreatRuleList(q: ThreatRuleQuery): ThreatRuleListResult {
  syncRulesFromSeed()
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 10
  const filtered = filterRules(q)
  const start = (pageIndex - 1) * pageSize
  const list = filtered
    .slice(start, start + pageSize)
    .map((r) => migrateLegacyRule(r as ThreatRule & Record<string, unknown>))
  return { list, total: filtered.length }
}

export function getThreatRule(id: string): ThreatRule | null {
  syncRulesFromSeed()
  const row = allRules.find((r) => r.id === id)
  return row ? { ...row, conditions: row.conditions.map((c) => ({ ...c })) } : null
}

function normalizeSimulateInput(input: ThreatSimulateInput): ThreatSimulateInput {
  const normalizedTargetType =
    input.targetType && input.targetType !== '全部' ? input.targetType : undefined
  const inferredSwarmType =
    input.swarmMode && (input.swarmCount ?? 0) >= 3 ? SWARM_TARGET_TYPE : undefined
  return {
    ...input,
    targetType: normalizedTargetType || inferredSwarmType,
    targetModel:
      input.targetModel && input.targetModel !== '全部型号' && input.targetModel !== '全部'
        ? input.targetModel
        : undefined
  }
}

export function matchThreatRuleForInput(input: ThreatSimulateInput): ThreatRule | undefined {
  syncRulesFromSeed()
  const simInput = normalizeSimulateInput(input)
  const enabled = allRules
    .filter((r) => r.enabled)
    .sort((a, b) => effectiveRulePriority(b, simInput) - effectiveRulePriority(a, simInput))
  return enabled.find((r) => ruleMatches(r, simInput))
}

export function saveThreatRule(body: ThreatRuleSavePayload): ThreatRule {
  const now = formatNow()
  const conditionLogic = normalizeConditionLogic(body.conditionLogic)
  const conditions = normalizeConditionList(body.conditions, conditionLogic)
  const summary = buildSummary(conditions, conditionLogic)
  const plan = getPlan(body.planId)
  if (body.id) {
    const idx = allRules.findIndex((r) => r.id === body.id)
    if (idx < 0) throw new Error('\u89c4\u5219\u4e0d\u5b58\u5728')
    const ruleCode = body.ruleCode.trim() || allRules[idx].ruleCode || generateThreatRuleCode()
    if (allRules.some((r) => r.ruleCode === ruleCode && r.id !== body.id)) {
      throw new Error('\u89c4\u5219\u7f16\u53f7\u5df2\u5b58\u5728')
    }
    const row: ThreatRule = {
      ...allRules[idx],
      ruleCode,
      ruleName: body.ruleName.trim(),
      areaRegionType: body.areaRegionType,
      threatLevel: normalizeRuleThreatLevel(body.threatLevel, body),
      targetType: normalizeThreatTargetType(body.targetType),
      targetModel:
        body.targetModel?.trim() ||
        normalizeThreatTargetModel(allRules[idx] as ThreatRule & Record<string, unknown>),
      areaName: body.areaName?.trim() || allRules[idx].areaName,
      conditionLogic,
      conditions: conditions.map((c) => ({ ...c })),
      conditionSummary: summary,
      priority: normalizePriority(body.priority),
      planId: body.planId,
      planName: plan?.planName || '-',
      enabled: body.enabled,
      updatedAt: now,
      updatedBy: '\u5f53\u524d\u7528\u6237'
    }
    allRules[idx] = row
    return { ...row }
  }
  const ruleCode = body.ruleCode.trim() || generateThreatRuleCode()
  if (allRules.some((r) => r.ruleCode === ruleCode)) {
    throw new Error('\u89c4\u5219\u7f16\u53f7\u5df2\u5b58\u5728')
  }
  const row: ThreatRule = {
    id: `rule-${Date.now()}`,
    ruleCode,
    ruleName: body.ruleName.trim(),
    areaRegionType: body.areaRegionType,
    threatLevel: normalizeRuleThreatLevel(body.threatLevel, body),
    targetType: normalizeThreatTargetType(body.targetType),
    targetModel:
      body.targetModel?.trim() ||
      normalizeThreatTargetModel({
        id: `rule-${Date.now()}`,
        ruleCode,
        conditions
      } as ThreatRule & Record<string, unknown>),
    areaName: body.areaName?.trim() || '-',
    conditionLogic,
    conditions: conditions.map((c) => ({ ...c })),
    conditionSummary: summary,
    priority: normalizePriority(body.priority),
    planId: body.planId,
    planName: plan?.planName || '-',
    enabled: body.enabled,
    updatedAt: now,
    updatedBy: '\u5f53\u524d\u7528\u6237'
  }
  allRules.push(row)
  return { ...row }
}

export function deleteThreatRules(ids: string[]) {
  const set = new Set(ids)
  allRules = allRules.filter((r) => !set.has(r.id))
}

export function toggleThreatRuleEnabled(id: string, enabled: boolean) {
  const idx = allRules.findIndex((r) => r.id === id)
  if (idx < 0) throw new Error('\u89c4\u5219\u4e0d\u5b58\u5728')
  const row = allRules[idx]
  const threatLevel =
    enabled && (!row.threatLevel || !coerceThreatLevelLabel(row.threatLevel))
      ? normalizeRuleThreatLevel(seedThreatLevelById[id] ?? row.threatLevel, {
          ...row,
          enabled: true
        })
      : row.threatLevel
  allRules[idx] = { ...row, enabled, threatLevel, updatedAt: formatNow() }
}

export function simulateThreat(input: ThreatSimulateInput): ThreatSimulateResult {
  const simInput = normalizeSimulateInput(input)
  const scenarioSummary = simInput.simulateConditions?.length
    ? buildSummary(simInput.simulateConditions, simInput.simulateConditionLogic || 'and')
    : ''
  const scenarioPrefix = scenarioSummary ? `模拟场景：${scenarioSummary}。` : ''

  if (simInput.simulateConditions?.length) {
    const scenarioOk = evalConditions(
      normalizeConditionList(simInput.simulateConditions, simInput.simulateConditionLogic || 'and'),
      simInput
    )
    if (!scenarioOk) {
      return {
        matched: false,
        message: `${scenarioPrefix}模拟目标属性不满足已配置的且/或组合条件`
      }
    }
  }

  let matched: ThreatRule | undefined
  const enabled = allRules
    .filter((r) => r.enabled)
    .sort((a, b) => effectiveRulePriority(b, simInput) - effectiveRulePriority(a, simInput))
  matched = enabled.find((r) => ruleMatches(r, simInput))
  if (!matched) {
    matched = allRules.find((r) => r.id === THREAT_MONITOR_RULE_ID && r.enabled)
  }

  if (!matched) {
    return {
      matched: false,
      message: `${scenarioPrefix}未匹配到启用的威胁评估规则`
    }
  }

  const isMonitorCatchAll = isMonitorCatchAllRule(matched)
  const threatLevelLabel = normalizeThreatLevel(matched.threatLevel)
  const swarmNote =
    !isMonitorCatchAll && (isSwarmRule(matched) || isSwarmSimulateInput(simInput))
      ? swarmEscalationNote()
      : undefined
  const monitorNote = isMonitorCatchAll ? monitorCatchAllNote() : undefined
  const prefix = isSwarmSimulateInput(simInput) && !isMonitorCatchAll ? '【蜂群场景】' : ''

  return {
    matched: true,
    rule: { ...matched },
    ruleName: matched.ruleName,
    threatLevel: threatLevelLabel,
    isMonitorCatchAll,
    monitorNote,
    swarmNote,
    message: `${scenarioPrefix}${prefix}命中规则「${matched.ruleName}」，威胁等级结论：${threatLevelLabel}`
  }
}

export function assessThreatRule(id: string): ThreatAssessResult {
  const rule = getThreatRule(id)
  if (!rule) throw new Error('\u89c4\u5219\u4e0d\u5b58\u5728')
  const plan = getPlan(rule.planId)
  const triggerRule = plan ? resolvePlanTriggerRule(plan) : null
  const levelKey = resolveThreatLevelKey(rule)
  const planLabel = plan ? `\u300c${plan.planName}\u300d\uff08${plan.planCode}\uff09` : '-'
  const fnLabel = triggerRule
    ? functionLabel(triggerRule.deviceGroupType, triggerRule.deviceFunction)
    : '-'
  const swarmNote = isSwarmRule(rule) ? swarmEscalationNote(triggerRule?.deviceAction) : undefined
  const swarmSummary = isSwarmRule(rule)
    ? '蜂群维度：多机入侵时默认提升威胁等级，驱离级预案可升级为激光/高功率微波。'
    : ''
  const monitorSummary = isMonitorCatchAllRule(rule)
    ? '兜底监测：未命中更高优先级规则时，默认启动无人机设备监测。'
    : ''
  return {
    rule,
    threatLevel: rule.threatLevel,
    suggestedPlan: plan?.planName || '-',
    planCode: plan?.planCode,
    planDeviceAction: triggerRule?.deviceAction,
    planDeviceType: triggerRule?.deviceGroupType,
    planDeviceFunction: fnLabel,
    alarmLevel: levelKey === 'high' ? '一级告警' : '二级预警',
    summary: `${monitorSummary}${swarmSummary}规则威胁等级「${rule.threatLevel}」；名单类型「${rule.targetType}」；目标型号「${rule.targetModel}」；触发条件：${rule.conditionSummary}`,
    swarmNote,
    triggerNote:
      plan && triggerRule
        ? `\u89c4\u5219\u547d\u4e2d\u540e\u89e6\u53d1\u9884\u6848${planLabel}\uff1b${formatDisposalExecNote(plan)}\uff1b\u89e6\u53d1\u300c${triggerRule.ruleName}\u300d\uff08${triggerRule.weatherFactor}\uff09\u2192 ${fnLabel}\uff1b\u5904\u7f6e\u300c${triggerRule.deviceAction}\u300d${plan.triggerRules.length > 1 ? '\uff1b\u591a\u573a\u666f\u6309\u5929\u6c14\u5207\u6362' : ''}${swarmNote ? `\uff1b${swarmNote}` : ''}`
        : '\u672a\u5173\u8054\u6709\u6548\u9884\u6848'
  }
}

export function getThreatPlanOptions() {
  return listPlanOptions().filter((p) => p.enabled)
}
