import { functionLabel } from '../plan/planDeviceCatalog'
import { getPlan, listPlanOptions } from '../plan/planStore'
import { formatDisposalExecNote } from '../plan/planDisposal'
import { resolvePlanTriggerRule } from '../plan/planTrigger'
import { listAreaRegions } from '../area/areaStore'
import { coerceThreatLevelLabel } from './threatLevelUtils'
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
  ThreatAssessResult,
  ThreatAreaScope,
  ThreatLevelLabel,
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

function buildSummary(conditions: RuleCondition[]) {
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
    .join('; ')
}

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
  return rule.conditions.every((c) => evalCondition(c, input))
}

function normalizeThreatLevel(
  level: string | undefined,
  rule: ThreatRuleSavePayload
): ThreatLevelLabel {
  const coerced = coerceThreatLevelLabel(level) as ThreatLevelLabel | undefined
  if (coerced && coerced !== '\u65e0') return coerced
  if (coerced === '\u65e0' && !rule.enabled) return '\u65e0'
  return deriveThreatLevel(rule)
}

function normalizePriority(value: unknown) {
  const priority = Number(value)
  if (!Number.isFinite(priority)) return 500
  return Math.min(999, Math.max(0, Math.trunc(priority)))
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
  let threatLevel = coerceThreatLevelLabel(row.threatLevel as string | undefined) as
    | ThreatLevelLabel
    | undefined
  const enabled = Boolean(row.enabled)
  if (!threatLevel || (threatLevel === '\u65e0' && enabled)) {
    threatLevel = deriveThreatLevel({
      enabled,
      priority: row.priority as number,
      targetType: row.targetType as string
    })
  }
  const { areaLevel: _a, scenario: _s, ...rest } = row
  void _a
  void _s
  void legacyScenario
  return {
    ...rest,
    areaRegionType,
    threatLevel,
    targetType: normalizeThreatTargetType(row.targetType as string | undefined)
  } as ThreatRule
}

type SeedRow = Omit<ThreatRule, 'conditionSummary'> & { conditions: RuleCondition[] }

function buildSeedRow(row: SeedRow): ThreatRule {
  return {
    ...row,
    conditionSummary: buildSummary(row.conditions)
  }
}

const seed: ThreatRule[] = [
  buildSeedRow({
    id: 'rule-001',
    ruleCode: 'PLAN-001',
    ruleName: '保护区-自动驱离',
    areaRegionType: 'warning',
    threatLevel: '高',
    targetType: '多旋翼',
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
    threatLevel: '高',
    targetType: '黑名单',
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
    threatLevel: '中',
    targetType: '全部',
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
    threatLevel: '无',
    targetType: '全部',
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
    threatLevel: '高',
    targetType: '黑名单',
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
    threatLevel: '低',
    targetType: '全部',
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
    threatLevel: '高',
    targetType: '全部',
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
    threatLevel: '高',
    targetType: '多旋翼',
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
    threatLevel: '高',
    targetType: '黑名单',
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
    threatLevel: '中',
    targetType: '全部',
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
    threatLevel: '低',
    targetType: '多旋翼',
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
    threatLevel: '高',
    targetType: '无人机蜂群',
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
    threatLevel: '高',
    targetType: '无人机蜂群',
    areaName: '缓冲区',
    conditions: [{ id: 'c17', property: 'swarmCount', operator: '>=', value: '5' }],
    priority: 940,
    planId: 'plan-014',
    planName: '蜂群高功率微波',
    enabled: true,
    updatedAt: '2026-05-20 16:05:00',
    updatedBy: '安全保密员'
  })
]

export const THREAT_STORE_VERSION = 9

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
      conditionSummary: buildSummary(s.conditions),
      planName: plan?.planName || s.planName
    }
    if (!existing) return migrateLegacyRule(base as ThreatRule & Record<string, unknown>)
    const seedLevel = seedThreatLevelById[s.id]
    return migrateLegacyRule({
      ...existing,
      ...base,
      threatLevel: seedLevel ?? base.threatLevel,
      areaRegionType: base.areaRegionType,
      conditions: existing.conditions?.length ? existing.conditions : s.conditions,
      conditionSummary: buildSummary(
        existing.conditions?.length ? existing.conditions : s.conditions
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

export function saveThreatRule(body: ThreatRuleSavePayload): ThreatRule {
  const now = formatNow()
  const summary = buildSummary(body.conditions)
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
      threatLevel: normalizeThreatLevel(body.threatLevel, body),
      targetType: normalizeThreatTargetType(body.targetType),
      areaName: body.areaName?.trim() || allRules[idx].areaName,
      conditions: body.conditions.map((c) => ({ ...c })),
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
    threatLevel: normalizeThreatLevel(body.threatLevel, body),
    targetType: normalizeThreatTargetType(body.targetType),
    areaName: body.areaName?.trim() || '-',
    conditions: body.conditions.map((c) => ({ ...c })),
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
    enabled && (row.threatLevel === '\u65e0' || !coerceThreatLevelLabel(row.threatLevel))
      ? normalizeThreatLevel(seedThreatLevelById[id] ?? row.threatLevel, { ...row, enabled: true })
      : row.threatLevel
  allRules[idx] = { ...row, enabled, threatLevel, updatedAt: formatNow() }
}

export function simulateThreat(input: ThreatSimulateInput): ThreatSimulateResult {
  const simInput: ThreatSimulateInput = {
    ...input,
    targetType: input.targetType || ((input.swarmCount ?? 0) >= 3 ? SWARM_TARGET_TYPE : undefined)
  }
  const enabled = allRules
    .filter((r) => r.enabled)
    .sort((a, b) => effectiveRulePriority(b, simInput) - effectiveRulePriority(a, simInput))
  const matched = enabled.find((r) => ruleMatches(r, simInput))
  if (!matched) {
    return {
      matched: false,
      message:
        '\u672a\u5339\u914d\u5230\u542f\u7528\u89c4\u5219\uff0c\u4e0d\u89e6\u53d1\u9884\u6848'
    }
  }
  const plan = getPlan(matched.planId)
  if (!plan?.enabled) {
    return {
      matched: false,
      message: '\u5339\u914d\u89c4\u5219\u4f46\u5173\u8054\u9884\u6848\u5df2\u505f\u7528'
    }
  }
  const triggerRule = resolvePlanTriggerRule(plan, {
    weatherFactor: simInput.weatherFactor
  })
  if (!triggerRule) {
    return {
      matched: false,
      message:
        '\u5339\u914d\u89c4\u5219\u4f46\u9884\u6848\u65e0\u53ef\u7528\u89e6\u53d1\u7b56\u7565'
    }
  }
  const fnLabel = functionLabel(triggerRule.deviceType, triggerRule.deviceFunction)
  const swarmNote =
    isSwarmRule(matched) || isSwarmSimulateInput(simInput)
      ? swarmEscalationNote(triggerRule.deviceAction)
      : undefined
  const swarmPrefix = isSwarmSimulateInput(simInput) ? '\u3010\u8702\u7fa4\u5347\u7ea7\u3011' : ''
  const scene =
    simInput.weatherFactor && simInput.weatherFactor !== '\u5168\u90e8'
      ? `\uff08\u573a\u666f\u300c${simInput.weatherFactor}\u300d\u2192 \u89c4\u5219\u300c${triggerRule.ruleName}\u300d\uff09`
      : ''
  const disposalNote = formatDisposalExecNote(plan)
  return {
    matched: true,
    rule: { ...matched },
    planId: plan.id,
    planCode: plan.planCode,
    planName: plan.planName,
    planDeviceAction: triggerRule.deviceAction,
    planDeviceType: triggerRule.deviceType,
    planDeviceFunction: fnLabel,
    swarmNote,
    message: `${swarmPrefix}\u5339\u914d\u89c4\u5219\u300c${matched.ruleName}\u300d\uff0c\u5c06\u89e6\u53d1\u9884\u6848\u300c${plan.planName}\u300d\uff08${plan.planCode}\uff09${scene}\u2192 ${triggerRule.deviceType} / ${fnLabel}\uff1b${disposalNote}`
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
    ? functionLabel(triggerRule.deviceType, triggerRule.deviceFunction)
    : '-'
  const swarmNote = isSwarmRule(rule) ? swarmEscalationNote(triggerRule?.deviceAction) : undefined
  const swarmSummary = isSwarmRule(rule)
    ? '\u8702\u7fa4\u7ef4\u5ea6\uff1a\u591a\u673a\u5165\u4fb5\u65f6\u9ed8\u8ba4\u63d0\u5347\u5a01\u80f1\uff0c\u9a71\u79bb\u7ea7\u9884\u6848\u53ef\u5347\u7ea7\u4e3a\u6fc0\u5149/\u9ad8\u529f\u7387\u5fae\u6ce2\u3002'
    : ''
  return {
    rule,
    threatLevel: rule.threatLevel,
    suggestedPlan: plan?.planName || '-',
    planCode: plan?.planCode,
    planDeviceAction: triggerRule?.deviceAction,
    planDeviceType: triggerRule?.deviceType,
    planDeviceFunction: fnLabel,
    alarmLevel: levelKey === 'high' ? '\u4e00\u7ea7\u544a\u8b66' : '\u4e8c\u7ea7\u9884\u8b66',
    summary: `${swarmSummary}\u89c4\u5219\u5a01\u80f1\u7b49\u7ea7\u300c${rule.threatLevel}\u300d\uff1b\u76ee\u6807\u7c7b\u578b\u300c${rule.targetType}\u300d\uff1b\u89e6\u53d1\u6761\u4ef6\uff1a${rule.conditionSummary}`,
    swarmNote,
    triggerNote:
      plan && triggerRule
        ? `\u89c4\u5219\u547d\u4e2d\u540e\u89e6\u53d1\u9884\u6848${planLabel}\uff1b${formatDisposalExecNote(plan)}\uff1b\u89e6\u53d1\u300c${triggerRule.ruleName}\u300d\uff08${triggerRule.weatherFactor}\uff09\u2192 ${triggerRule.deviceType} / ${fnLabel}\uff1b\u5904\u7f6e\u300c${triggerRule.deviceAction}\u300d${plan.triggerRules.length > 1 ? '\uff1b\u591a\u573a\u666f\u6309\u5929\u6c14\u5207\u6362' : ''}${swarmNote ? `\uff1b${swarmNote}` : ''}`
        : '\u672a\u5173\u8054\u6709\u6548\u9884\u6848'
  }
}

export function getThreatPlanOptions() {
  return listPlanOptions().filter((p) => p.enabled)
}
