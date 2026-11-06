import type { RuleConditionProperty } from './types'

export const threatConditionUnits: Record<RuleConditionProperty, string> = {
  speed: 'm/s',
  stayDuration: '秒',
  intrusionCount: '次',
  swarmCount: '架',
  altitude: '米',
  signalStrength: 'dBm',
  locatedArea: ''
}

/** 既有数据的逗留时间以分钟保存，界面统一以秒展示。 */
export function threatConditionDisplayValue(
  property: RuleConditionProperty,
  value: string
): string {
  if (property !== 'stayDuration' || !value.trim() || !Number.isFinite(Number(value))) {
    return value
  }
  return String(Number((Number(value) * 60).toFixed(8)))
}

export function threatConditionStoredValue(property: RuleConditionProperty, value: string): string {
  if (property !== 'stayDuration' || !value.trim() || !Number.isFinite(Number(value))) {
    return value
  }
  return String(Number(value) / 60)
}
