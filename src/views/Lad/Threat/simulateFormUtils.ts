import type { RuleCondition, RuleConditionLogic, ThreatLevelScope } from '@/api/lad/threat/types'

export interface ThreatSimulateGeneralFormState {
  targetType: string
  targetModel: string
  /** 模拟匹配用，编辑弹窗无此项但规则库按区域类型匹配 */
  areaRegionType: string
  threatLevel: ThreatLevelScope
  priority: number
  enabled: boolean
  conditionLogic: RuleConditionLogic
  conditions: RuleCondition[]
}

/** 默认命中「保护区-自动驱离」(rule-001) */
export function createDefaultGeneralSimulateForm(): ThreatSimulateGeneralFormState {
  return {
    targetType: '未知',
    targetModel: 'DJI Mavic 3',
    areaRegionType: 'warning',
    threatLevel: '高危',
    priority: 700,
    enabled: true,
    conditionLogic: 'and',
    conditions: [
      { id: 'sim-speed', property: 'speed', operator: '=', value: '6' },
      { id: 'sim-stay', property: 'stayDuration', operator: '=', value: '12' }
    ]
  }
}

function readNumericValue(conditions: RuleCondition[], property: RuleCondition['property']) {
  const row = conditions.find((item) => item.property === property)
  if (!row?.value.trim()) return undefined
  const num = Number(row.value)
  return Number.isNaN(num) ? undefined : num
}

export function generalFormToSimulateInput(form: ThreatSimulateGeneralFormState) {
  return {
    speed: readNumericValue(form.conditions, 'speed'),
    stayMinutes: readNumericValue(form.conditions, 'stayDuration'),
    intrusionCount: readNumericValue(form.conditions, 'intrusionCount'),
    swarmCount: readNumericValue(form.conditions, 'swarmCount') ?? 1,
    targetType: form.targetType === '全部' ? undefined : form.targetType,
    targetModel:
      form.targetModel === '全部型号' || form.targetModel === '全部' ? undefined : form.targetModel,
    areaRegionType: form.areaRegionType === '全部' ? undefined : form.areaRegionType
  }
}
