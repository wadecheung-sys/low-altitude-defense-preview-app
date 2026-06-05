import { resolveDeviceFunction } from './planDeviceCatalog'
import type { PlanStrategy, PlanTriggerRule } from './types'

export interface PlanTriggerContext {
  weatherFactor?: string
}

function isAllValue(value?: string) {
  return !value || value === '全部'
}

function bySortOrder(a: PlanTriggerRule, b: PlanTriggerRule) {
  const left = Number(a.sortOrder) || Number.MAX_SAFE_INTEGER
  const right = Number(b.sortOrder) || Number.MAX_SAFE_INTEGER
  return left - right
}

export function resolvePlanTriggerRule(
  plan: Pick<PlanStrategy, 'triggerRules'>,
  ctx: PlanTriggerContext = {}
): PlanTriggerRule | null {
  const weatherFactor = ctx.weatherFactor?.trim() || '全部'
  const rules = [...(plan.triggerRules || [])].filter((r) => r.enabled).sort(bySortOrder)

  if (!rules.length) return null

  const matched = rules.filter(
    (rule) =>
      isAllValue(rule.weatherFactor) ||
      isAllValue(weatherFactor) ||
      rule.weatherFactor === weatherFactor
  )

  if (matched.length) return [...matched].sort(bySortOrder)[0]

  return rules[0]
}

export function formatTriggerRuleBrief(rule: PlanTriggerRule): string {
  return `${rule.ruleName} / 排序${rule.sortOrder || '-'} / ${rule.weatherFactor} / ${rule.deviceGroupName} / ${rule.deviceAction}`
}

export function formatTriggerRulesSummary(rules: PlanTriggerRule[]): string {
  if (!rules.length) return '-'
  const enabled = rules.filter((r) => r.enabled)
  if (enabled.length <= 1) {
    const r = enabled[0] || rules[0]
    return r ? `${r.weatherFactor} / ${r.deviceGroupName} / ${r.deviceAction}` : '-'
  }
  return enabled.map((rule) => formatTriggerRuleBrief(rule)).join('；')
}

export function normalizeTriggerRule(rule: PlanTriggerRule): PlanTriggerRule {
  const fn = resolveDeviceFunction(rule.deviceGroupType, rule.deviceFunction)
  if (!fn) {
    throw new Error(`规则“${rule.ruleName}”的设备功能与设备组类型不匹配`)
  }
  return {
    ...rule,
    ruleName: rule.ruleName.trim(),
    sortOrder: Number(rule.sortOrder) || 1,
    deviceFunction: fn.value,
    deviceAction: fn.deviceAction,
    weatherFactor: rule.weatherFactor || '全部'
  }
}
