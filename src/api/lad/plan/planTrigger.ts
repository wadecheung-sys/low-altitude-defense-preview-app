import { resolveDeviceFunction } from './planDeviceCatalog'
import type { PlanStrategy, PlanTriggerRule } from './types'

export interface PlanTriggerContext {
  weatherFactor?: string
  areaLevel?: string
}

/** 按优先级与场景匹配一条触发规则（先精确天气，再「全部」兜底） */
export function resolvePlanTriggerRule(
  plan: Pick<PlanStrategy, 'triggerRules'>,
  ctx: PlanTriggerContext = {}
): PlanTriggerRule | null {
  const weather = ctx.weatherFactor?.trim() || '全部'
  const rules = [...(plan.triggerRules || [])]
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority)

  if (!rules.length) return null

  const exact = rules.find((r) => r.weatherFactor === weather)
  if (exact) return exact

  if (weather !== '全部') {
    const fallback = rules.find((r) => r.weatherFactor === '全部')
    if (fallback) return fallback
  }

  return rules[0]
}

export function formatTriggerRuleBrief(rule: PlanTriggerRule): string {
  return `${rule.ruleName} · ${rule.weatherFactor} → ${rule.deviceAction}`
}

export function formatTriggerRulesSummary(rules: PlanTriggerRule[]): string {
  if (!rules.length) return '-'
  const enabled = rules.filter((r) => r.enabled)
  if (enabled.length <= 1) {
    const r = enabled[0] || rules[0]
    return r ? `${r.weatherFactor} / ${r.deviceAction}` : '-'
  }
  const weathers = [...new Set(enabled.map((r) => r.weatherFactor))]
  return weathers.join('、')
}

export function normalizeTriggerRule(
  rule: PlanTriggerRule,
  fallbackDeviceType?: string
): PlanTriggerRule {
  const deviceType = rule.deviceType || fallbackDeviceType || ''
  const fn = resolveDeviceFunction(deviceType, rule.deviceFunction)
  if (!fn) {
    throw new Error(`规则「${rule.ruleName}」的设备功能与类型不匹配`)
  }
  return {
    ...rule,
    ruleName: rule.ruleName.trim(),
    deviceType,
    deviceFunction: fn.value,
    deviceAction: fn.deviceAction,
    weatherFactor: rule.weatherFactor || '全部',
    areaLevel: rule.areaLevel || '全部'
  }
}
