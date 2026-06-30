import type { RuleCondition, RuleConditionLogic } from '@/api/lad/threat/types'

export interface ThreatSimulateGeneralFormState {
  targetType: string
  targetModel: string
  /** 模拟匹配用，编辑弹窗无此项但规则库按区域类型匹配 */
  areaRegionType: string
  conditionLogic: RuleConditionLogic
  conditions: RuleCondition[]
}

/** 规范化模拟表单中的目标属性条件（保留且/或关系） */
export function normalizeSimulateConditions(
  conditions: RuleCondition[],
  conditionLogic: RuleConditionLogic = 'and'
): RuleCondition[] {
  return conditions.map((condition, index) => ({
    ...condition,
    operator: condition.operator || '=',
    nextLogic:
      index < conditions.length - 1
        ? condition.nextLogic === 'or' || condition.nextLogic === 'and'
          ? condition.nextLogic
          : conditionLogic
        : undefined
  }))
}

/** 默认命中「保护区-自动驱离」(rule-001) */
export function createDefaultGeneralSimulateForm(): ThreatSimulateGeneralFormState {
  return {
    targetType: '未知',
    targetModel: 'DJI Mavic 3',
    areaRegionType: 'warning',
    conditionLogic: 'and',
    conditions: normalizeSimulateConditions([
      { id: 'sim-speed', property: 'speed', operator: '=', value: '6' },
      { id: 'sim-stay', property: 'stayDuration', operator: '=', value: '12' }
    ])
  }
}

function readNumericValue(conditions: RuleCondition[], property: RuleCondition['property']) {
  const row = conditions.find((item) => item.property === property)
  if (!row?.value.trim()) return undefined
  const num = Number(row.value)
  return Number.isNaN(num) ? undefined : num
}

export function generalFormToSimulateInput(form: ThreatSimulateGeneralFormState) {
  const conditions = normalizeSimulateConditions(form.conditions, form.conditionLogic)
  return {
    speed: readNumericValue(conditions, 'speed'),
    stayMinutes: readNumericValue(conditions, 'stayDuration'),
    intrusionCount: readNumericValue(conditions, 'intrusionCount'),
    swarmCount: readNumericValue(conditions, 'swarmCount') ?? 1,
    targetType: form.targetType === '全部' ? undefined : form.targetType,
    targetModel:
      form.targetModel === '全部型号' || form.targetModel === '全部' ? undefined : form.targetModel,
    areaRegionType: form.areaRegionType === '全部' ? undefined : form.areaRegionType,
    simulateConditions: conditions,
    simulateConditionLogic: form.conditionLogic
  }
}
