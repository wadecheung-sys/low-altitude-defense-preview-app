import { listAreaRegions } from '@/api/lad/area/areaStore'
import { countermeasureActionLabel } from '@/api/lad/plan/planDeviceCatalog'
import { getPlan } from '@/api/lad/plan/planStore'
import type { PlanTriggerContext } from '@/api/lad/plan/planTrigger'
import { resolvePlanTriggerRule } from '@/api/lad/plan/planTrigger'
import {
  getWeatherContextValue,
  planWeatherPropertyLabel,
  resolveRuleWeatherConditions
} from '@/api/lad/plan/planWeatherConditions'
import type { PlanStrategy, PlanTriggerRule, PlanWeatherCondition } from '@/api/lad/plan/types'
import type { DisposalTimelineDetailItem } from './disposalTimeline'
import { resolveMatchedThreatRule } from './threatAssessmentHitDetails'
import type { HistoryEventItem } from './types'

function weatherPropertyUnit(property: PlanWeatherCondition['property']): string {
  switch (property) {
    case 'temperature':
      return '℃'
    case 'humidity':
      return '%'
    case 'windPower':
      return '级'
    case 'rainfall':
      return 'mm'
    default:
      return ''
  }
}

function formatWeatherOperator(operator: PlanWeatherCondition['operator']): string {
  return operator === '!=' ? '≠' : operator
}

function formatWeatherActual(
  property: PlanWeatherCondition['property'],
  ctx: PlanTriggerContext
): string {
  const value = getWeatherContextValue(property, ctx)
  if (value === undefined || value === null) return '--'
  return `${value}${weatherPropertyUnit(property)}`
}

function formatWeatherThreshold(condition: PlanWeatherCondition): string {
  const unit = weatherPropertyUnit(condition.property)
  return `${formatWeatherOperator(condition.operator)} ${condition.value}${unit}`
}

function formatTriggerAreaLevel(rule: PlanTriggerRule): string {
  const selected = rule.areaLevel?.filter(Boolean) || []
  if (!selected.length) return '全部'
  const areaMap = new Map(listAreaRegions().map((item) => [item.id, item.name]))
  return selected.map((id) => areaMap.get(id) || id).join('、')
}

function buildWeatherConditionDetails(
  rule: PlanTriggerRule,
  ctx: PlanTriggerContext
): DisposalTimelineDetailItem[] {
  const conditions = resolveRuleWeatherConditions(rule)
  if (!conditions.length) {
    if (rule.weatherFactor && rule.weatherFactor !== '全部') {
      return [{ label: '天气场景', value: rule.weatherFactor }]
    }
    return [{ label: '天气要素', value: '全部' }]
  }

  return conditions.map((condition) => ({
    label: planWeatherPropertyLabel(condition.property),
    value: `${formatWeatherActual(condition.property, ctx)}（规则：${formatWeatherThreshold(condition)}）`
  }))
}

function buildPlanTriggerContext(row: HistoryEventItem): PlanTriggerContext {
  const ctx = row.planTriggerContext
  return {
    areaLevel: ctx.areaId,
    temperature: ctx.temperature,
    humidity: ctx.humidity,
    windPower: ctx.windPower,
    rainfall: ctx.rainfall
  }
}

export function resolvePlanTriggerForEvent(row: HistoryEventItem):
  | {
      plan: PlanStrategy
      triggerRule: PlanTriggerRule
      ctx: PlanTriggerContext
    }
  | null {
  const threatRule = resolveMatchedThreatRule(row)
  if (!threatRule?.planId) return null
  const plan = getPlan(threatRule.planId)
  if (!plan?.enabled) return null
  const ctx = buildPlanTriggerContext(row)
  const triggerRule = resolvePlanTriggerRule(plan, ctx)
  if (!triggerRule) return null
  return { plan, triggerRule, ctx }
}

export function resolvePlanDisplayName(row: HistoryEventItem, fallback: string): string {
  return resolvePlanTriggerForEvent(row)?.plan.planName || fallback
}

export function resolvePlanTriggerAction(row: HistoryEventItem, fallback: string): string {
  const resolved = resolvePlanTriggerForEvent(row)
  if (!resolved) return fallback
  return (
    countermeasureActionLabel(resolved.triggerRule.deviceFunction) ||
    resolved.triggerRule.deviceAction ||
    fallback
  )
}

export function buildDisposalExecutionStageDetails(
  row: HistoryEventItem,
  options: {
    skipped: boolean
    skipReason: string
    fallbackPlanName: string
    fallbackActionName: string
    countermeasureDevice: string
  }
): DisposalTimelineDetailItem[] {
  if (options.skipped) {
    return []
  }

  if (row.disposalExecutionSource === 'manual') {
    return [
      { label: '执行来源', value: '数据大屏人工操作' },
      { label: '操作人', value: row.disposalOperator || '值班员' },
      { label: '选中设备', value: options.countermeasureDevice },
      {
        label: '执行动作',
        value: row.manualDisposalAction || options.fallbackActionName || '--'
      },
      { label: '预案策略', value: '未自动触发' }
    ]
  }

  const resolved = resolvePlanTriggerForEvent(row)
  if (!resolved) {
    return []
  }

  const { plan, triggerRule, ctx } = resolved
  return [
    { label: '策略名称', value: plan.planName },
    { label: '触发规则', value: triggerRule.ruleName },
    ...buildWeatherConditionDetails(triggerRule, ctx),
    { label: '所处区域', value: formatTriggerAreaLevel(triggerRule) },
    {
      label: '反制动作',
      value:
        countermeasureActionLabel(triggerRule.deviceFunction) || triggerRule.deviceAction || '--'
    },
    { label: '联动设备', value: options.countermeasureDevice }
  ]
}
