import type {
  PlanConditionOperator,
  PlanTriggerRule,
  PlanWeatherCondition,
  PlanWeatherConditionLogic,
  PlanWeatherConditionProperty
} from './types'

export const planWeatherPropertyOptions: {
  label: string
  value: PlanWeatherConditionProperty
}[] = [
  { label: '温度', value: 'temperature' },
  { label: '湿度', value: 'humidity' },
  { label: '风力', value: 'windPower' },
  { label: '雨量', value: 'rainfall' }
]

export const planWeatherConditionLogicOptions: {
  label: string
  value: PlanWeatherConditionLogic
}[] = [
  { label: '且', value: 'and' },
  { label: '或', value: 'or' }
]

export const planConditionOperatorOptions: { label: string; value: PlanConditionOperator }[] = [
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '=', value: '=' },
  { label: '≠', value: '!=' }
]

const propertyLabelMap = Object.fromEntries(
  planWeatherPropertyOptions.map((item) => [item.value, item.label])
) as Record<PlanWeatherConditionProperty, string>

export function planWeatherPropertyLabel(property: PlanWeatherConditionProperty) {
  return propertyLabelMap[property] || property
}

export function createPlanWeatherCondition(
  property: PlanWeatherConditionProperty = 'temperature'
): PlanWeatherCondition {
  return {
    id: `wc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    property,
    operator: '>',
    value: '',
    nextLogic: undefined
  }
}

function legacyWeatherConditionsFromRule(rule: Partial<PlanTriggerRule>): PlanWeatherCondition[] {
  const pairs: Array<
    [PlanWeatherConditionProperty, PlanConditionOperator | '', number | null | undefined]
  > = [
    ['temperature', rule.temperatureOperator || '', rule.temperatureValue],
    ['humidity', rule.humidityOperator || '', rule.humidityValue],
    ['windPower', rule.windPowerOperator || '', rule.windPowerValue],
    ['rainfall', rule.rainfallOperator || '', rule.rainfallValue]
  ]

  const conditions = pairs
    .filter(([, operator, value]) => !!operator && value !== undefined && value !== null)
    .map(([property, operator, value]) =>
      createPlanWeatherConditionWithDefaults(property, {
        operator: operator as PlanConditionOperator,
        value: String(value)
      })
    )

  if (conditions.length > 1) {
    conditions.slice(0, -1).forEach((item) => {
      item.nextLogic = rule.weatherConditionLogic || 'and'
    })
  }

  return conditions
}

function createPlanWeatherConditionWithDefaults(
  property: PlanWeatherConditionProperty,
  defaults: Partial<PlanWeatherCondition>
): PlanWeatherCondition {
  return {
    ...createPlanWeatherCondition(property),
    ...defaults,
    property
  }
}

export function resolveRuleWeatherConditions(rule: Partial<PlanTriggerRule>): PlanWeatherCondition[] {
  if (rule.weatherConditions?.length) {
    return rule.weatherConditions.map((item) => ({ ...item }))
  }
  return legacyWeatherConditionsFromRule(rule)
}

export function normalizePlanWeatherConditions(
  rule: Partial<PlanTriggerRule>
): Pick<PlanTriggerRule, 'weatherConditionLogic' | 'weatherConditions'> {
  const weatherConditionLogic = rule.weatherConditionLogic || 'and'
  const source = resolveRuleWeatherConditions(rule)

  const weatherConditions = source.map((item, index) => ({
    id: item.id || createPlanWeatherCondition(item.property).id,
    property: item.property,
    operator: item.operator || '>',
    value: String(item.value ?? '').trim(),
    nextLogic:
      index < source.length - 1 ? item.nextLogic || weatherConditionLogic || 'and' : undefined
  }))

  return { weatherConditionLogic, weatherConditions }
}

export function weatherConditionsComplete(conditions?: PlanWeatherCondition[]) {
  if (!conditions?.length) return true
  return conditions.every(
    (item) => item.property && item.operator && String(item.value ?? '').trim() !== ''
  )
}

export function formatPlanWeatherConditions(rule: Partial<PlanTriggerRule>): string {
  const conditions = resolveRuleWeatherConditions(rule)
  if (!conditions.length) return '天气:全部'

  return conditions
    .map((item, index) => {
      const op = item.operator === '!=' ? '≠' : item.operator
      let text = `${planWeatherPropertyLabel(item.property)}${op}${item.value}`
      if (index < conditions.length - 1) {
        text += item.nextLogic === 'or' ? ' 或 ' : ' 且 '
      }
      return text
    })
    .join('')
}

export function getWeatherContextValue(
  property: PlanWeatherConditionProperty,
  ctx: Partial<Record<PlanWeatherConditionProperty, number | undefined>>
) {
  return ctx[property]
}
