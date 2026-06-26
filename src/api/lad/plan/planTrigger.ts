import { resolveDeviceFunction } from './planDeviceCatalog'
import type { PlanConditionOperator, PlanStrategy, PlanTriggerRule } from './types'

export interface PlanTriggerContext {
  areaLevel?: string
  temperature?: number
  humidity?: number
  windPower?: number
  rainfall?: number
}

function bySortOrder(a: PlanTriggerRule, b: PlanTriggerRule) {
  const left = Number(a.sortOrder) || Number.MAX_SAFE_INTEGER
  const right = Number(b.sortOrder) || Number.MAX_SAFE_INTEGER
  return left - right
}

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function compareValue(actual: unknown, operator?: PlanConditionOperator | '', expected?: unknown) {
  if (!operator || expected === undefined || expected === null || expected === '') return true
  const left = toFiniteNumber(actual)
  const right = toFiniteNumber(expected)
  if (left === null || right === null) return true

  if (operator === '>') return left > right
  if (operator === '<') return left < right
  if (operator === '=') return left === right
  return left !== right
}

function matchesArea(rule: PlanTriggerRule, areaLevel?: string) {
  const selected = Array.isArray(rule.areaLevel) ? rule.areaLevel.filter(Boolean) : []
  if (!selected.length || !areaLevel) return true
  return selected.includes(areaLevel)
}

function matchesRule(rule: PlanTriggerRule, ctx: PlanTriggerContext) {
  return (
    matchesArea(rule, ctx.areaLevel) &&
    compareValue(ctx.temperature, rule.temperatureOperator, rule.temperatureValue) &&
    compareValue(ctx.humidity, rule.humidityOperator, rule.humidityValue) &&
    compareValue(ctx.windPower, rule.windPowerOperator, rule.windPowerValue) &&
    compareValue(ctx.rainfall, rule.rainfallOperator, rule.rainfallValue)
  )
}

export function resolvePlanTriggerRule(
  plan: Pick<PlanStrategy, 'triggerRules'>,
  ctx: PlanTriggerContext = {}
): PlanTriggerRule | null {
  const rules = [...(plan.triggerRules || [])].filter((r) => r.enabled).sort(bySortOrder)
  if (!rules.length) return null

  const matched = rules.filter((rule) => matchesRule(rule, ctx))
  if (matched.length) return [...matched].sort(bySortOrder)[0]

  return rules[0]
}

function formatNumericCondition(
  label: string,
  operator?: PlanConditionOperator | '',
  value?: number | null
) {
  if (!operator || value === undefined || value === null) return `${label}:全部`
  return `${label}:${operator === '!=' ? '≠' : operator}${value}`
}

export function formatTriggerCondition(rule: PlanTriggerRule): string {
  return [
    formatNumericCondition('温度', rule.temperatureOperator, rule.temperatureValue),
    formatNumericCondition('湿度', rule.humidityOperator, rule.humidityValue),
    formatNumericCondition('风力', rule.windPowerOperator, rule.windPowerValue),
    formatNumericCondition('雨量', rule.rainfallOperator, rule.rainfallValue)
  ].join(' ')
}

export function formatTriggerRuleBrief(rule: PlanTriggerRule): string {
  return `${rule.ruleName} / 排序${rule.sortOrder || '-'} / ${formatTriggerCondition(rule)} / ${rule.deviceGroupName} / ${rule.deviceAction}`
}

export function formatTriggerRulesSummary(rules: PlanTriggerRule[]): string {
  if (!rules.length) return '-'
  const enabled = rules.filter((r) => r.enabled)
  if (enabled.length <= 1) {
    const r = enabled[0] || rules[0]
    return r ? `${formatTriggerCondition(r)} / ${r.deviceGroupName} / ${r.deviceAction}` : '-'
  }
  return enabled.map((rule) => formatTriggerRuleBrief(rule)).join('；')
}

export function normalizeTriggerRule(rule: PlanTriggerRule): PlanTriggerRule {
  const fn = resolveDeviceFunction(rule.deviceGroupType, rule.deviceFunction)
  if (!fn) {
    throw new Error(`规则“${rule.ruleName}”的反制动作与设备组类型不匹配`)
  }
  return {
    ...rule,
    ruleName: rule.ruleName.trim(),
    sortOrder: Number(rule.sortOrder) || 1,
    areaLevel: Array.isArray(rule.areaLevel) ? rule.areaLevel.filter(Boolean) : [],
    temperatureOperator: rule.temperatureOperator || '',
    temperatureValue: toFiniteNumber(rule.temperatureValue),
    humidityOperator: rule.humidityOperator || '',
    humidityValue: toFiniteNumber(rule.humidityValue),
    windPowerOperator: rule.windPowerOperator || '',
    windPowerValue: toFiniteNumber(rule.windPowerValue),
    rainfallOperator: rule.rainfallOperator || '',
    rainfallValue: toFiniteNumber(rule.rainfallValue),
    deviceFunction: fn.value,
    deviceAction: fn.deviceAction,
    weatherFactor: undefined
  }
}
