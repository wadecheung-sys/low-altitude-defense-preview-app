import {
  createPlanWeatherCondition,
  normalizePlanWeatherConditions,
  weatherConditionsComplete
} from '@/api/lad/plan/planWeatherConditions'
import type {
  PlanSimulateInput,
  PlanWeatherCondition,
  PlanWeatherConditionLogic,
  PlanWeatherConditionProperty
} from '@/api/lad/plan/types'

export interface PlanSimulateFormState {
  threatLevel: string
  areaLevel: string[]
  weatherConditionLogic: PlanWeatherConditionLogic
  weatherConditions: PlanWeatherCondition[]
}

function readWeatherNumber(
  conditions: PlanWeatherCondition[],
  property: PlanWeatherConditionProperty
): number | undefined {
  const found = conditions.find((item) => item.property === property && item.value !== '')
  if (!found) return undefined
  const value = Number(found.value)
  return Number.isFinite(value) ? value : undefined
}

export function createDefaultPlanSimulateForm(): PlanSimulateFormState {
  const temperature = createPlanWeatherCondition('temperature')
  temperature.operator = '>'
  temperature.value = '28'
  const humidity = createPlanWeatherCondition('humidity')
  humidity.operator = '<'
  humidity.value = '50'
  humidity.nextLogic = 'and'

  return {
    threatLevel: '高危',
    areaLevel: [],
    weatherConditionLogic: 'and',
    weatherConditions: [temperature, humidity]
  }
}

export function normalizePlanSimulateWeather(
  conditions: PlanWeatherCondition[],
  logic: PlanWeatherConditionLogic
): PlanWeatherCondition[] {
  const normalized = normalizePlanWeatherConditions({
    weatherConditions: conditions,
    weatherConditionLogic: logic
  })
  const rows = normalized.weatherConditions ?? []
  return rows.map((condition, index) => ({
    ...condition,
    nextLogic:
      index < rows.length - 1
        ? condition.nextLogic || normalized.weatherConditionLogic || logic
        : undefined
  }))
}

export function planSimulateFormComplete(form: PlanSimulateFormState): boolean {
  if (!form.threatLevel?.trim()) return false
  return weatherConditionsComplete(form.weatherConditions)
}

export function planFormToSimulateInput(form: PlanSimulateFormState): PlanSimulateInput {
  const conditions = normalizePlanSimulateWeather(
    form.weatherConditions,
    form.weatherConditionLogic
  )
  return {
    threatLevel: form.threatLevel.trim(),
    areaLevel: form.areaLevel[0],
    temperature: readWeatherNumber(conditions, 'temperature'),
    humidity: readWeatherNumber(conditions, 'humidity'),
    windPower: readWeatherNumber(conditions, 'windPower'),
    rainfall: readWeatherNumber(conditions, 'rainfall')
  }
}
