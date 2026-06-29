import { resolveDeviceFunction } from './planDeviceCatalog'
import {
  formatPlanWeatherConditions,
  getWeatherContextValue,
  normalizePlanWeatherConditions,
  resolveRuleWeatherConditions
} from './planWeatherConditions'
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

function matchesWeather(rule: PlanTriggerRule, ctx: PlanTriggerContext) {
  const conditions = resolveRuleWeatherConditions(rule)
  if (!conditions.length) return true

  const weatherCtx = {
    temperature: ctx.temperature,
    humidity: ctx.humidity,
    windPower: ctx.windPower,
    rainfall: ctx.rainfall
  }

  let matched = compareValue(
    getWeatherContextValue(conditions[0].property, weatherCtx),
    conditions[0].operator,
    conditions[0].value
  )

  for (let index = 0; index < conditions.length - 1; index += 1) {
    const next = conditions[index + 1]
    const nextMatched = compareValue(
      getWeatherContextValue(next.property, weatherCtx),
      next.operator,
      next.value
    )
    const logic = conditions[index].nextLogic || rule.weatherConditionLogic || 'and'
    matched = logic === 'or' ? matched || nextMatched : matched && nextMatched
  }

  return matched
}

function matchesRule(rule: PlanTriggerRule, ctx: PlanTriggerContext) {
  return matchesArea(rule, ctx.areaLevel) && matchesWeather(rule, ctx)
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

export function formatTriggerCondition(rule: PlanTriggerRule): string {
  return formatPlanWeatherConditions(rule)
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
  const weather = normalizePlanWeatherConditions(rule)
  return {
    ...rule,
    ruleName: rule.ruleName.trim(),
    sortOrder: Number(rule.sortOrder) || 1,
    areaLevel: Array.isArray(rule.areaLevel) ? rule.areaLevel.filter(Boolean) : [],
    ...weather,
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
