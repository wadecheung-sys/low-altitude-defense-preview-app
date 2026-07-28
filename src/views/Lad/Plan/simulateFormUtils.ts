import {
  createPlanWeatherCondition,
  normalizePlanWeatherConditions,
  weatherConditionsComplete
} from '@/api/lad/plan/planWeatherConditions'
import type {
  PlanSimulateInput,
  PlanWeatherCondition,
  PlanWeatherConditionProperty
} from '@/api/lad/plan/types'

export interface PlanSimulateFormState {
  threatLevel: string
  areaLevel: string
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
  temperature.operator = '='
  temperature.value = '28'
  const humidity = createPlanWeatherCondition('humidity')
  humidity.operator = '='
  humidity.value = '50'

  return {
    threatLevel: '高危',
    areaLevel: 'ar-10001',
    weatherConditions: [temperature, humidity]
  }
}

export function normalizePlanSimulateWeather(
  conditions: PlanWeatherCondition[]
): PlanWeatherCondition[] {
  const normalized = normalizePlanWeatherConditions({
    weatherConditions: conditions,
    weatherConditionLogic: 'and'
  })
  const rows = normalized.weatherConditions ?? []
  return rows.map((condition, index) => ({
    ...condition,
    operator: '=',
    nextLogic: index < rows.length - 1 ? 'and' : undefined
  }))
}

export function planSimulateFormComplete(form: PlanSimulateFormState): boolean {
  if (!form.threatLevel?.trim()) return false
  if (!form.areaLevel?.trim()) return false
  return weatherConditionsComplete(form.weatherConditions)
}

export function planFormToSimulateInput(form: PlanSimulateFormState): PlanSimulateInput {
  const conditions = normalizePlanSimulateWeather(form.weatherConditions)
  return {
    threatLevel: form.threatLevel.trim(),
    areaLevel: form.areaLevel || undefined,
    temperature: readWeatherNumber(conditions, 'temperature'),
    humidity: readWeatherNumber(conditions, 'humidity'),
    windPower: readWeatherNumber(conditions, 'windPower'),
    rainfall: readWeatherNumber(conditions, 'rainfall')
  }
}
