import type { AreaRegionType } from '@/api/lad/area/types'
import type { ThreatLevelLabel, ThreatLevelScope } from './threatLevelUtils'

export type { ThreatLevelLabel, ThreatLevelScope } from './threatLevelUtils'

export type ThreatAreaScope = AreaRegionType | '全部'

export type RuleConditionProperty =
  | 'speed'
  | 'stayDuration'
  | 'intrusionCount'
  | 'swarmCount'
  | 'altitude'
  | 'signalStrength'
  | 'locatedArea'

export type RuleConditionOperator = '>' | '>=' | '<' | '<=' | '='
export type RuleConditionLogic = 'and' | 'or'

export interface RuleCondition {
  id: string
  property: RuleConditionProperty
  operator: RuleConditionOperator
  value: string
  nextLogic?: RuleConditionLogic
}

export interface ThreatRule {
  id: string
  ruleCode: string
  ruleName: string
  areaRegionType: ThreatAreaScope
  targetType: string
  targetModel: string
  threatLevel: ThreatLevelScope
  areaName: string
  conditionLogic: RuleConditionLogic
  conditions: RuleCondition[]
  conditionSummary: string
  priority: number
  planId: string
  planName: string
  enabled: boolean
  updatedAt: string
  updatedBy: string
}

export interface ThreatRuleQuery {
  pageIndex?: number
  pageSize?: number
  ruleCode?: string
  ruleName?: string
  areaRegionType?: string
  threatLevel?: string
  targetType?: string
  targetModel?: string
  targetProperty?: string
  status?: 'enabled' | 'disabled' | ''
  updatedBy?: string
}

export interface ThreatRuleListResult {
  list: ThreatRule[]
  total: number
}

export interface ThreatRuleSavePayload {
  id?: string
  ruleCode: string
  ruleName: string
  areaRegionType: ThreatAreaScope
  targetType: string
  targetModel?: string
  threatLevel: ThreatLevelScope
  areaName?: string
  conditionLogic: RuleConditionLogic
  conditions: RuleCondition[]
  priority: number
  planId: string
  enabled: boolean
}

export interface ThreatSimulateInput {
  speed?: number
  stayMinutes?: number
  intrusionCount?: number
  swarmCount?: number
  targetType?: string
  targetModel?: string
  areaRegionType?: string
  weatherFactor?: string
  temperature?: number
  humidity?: number
  windPower?: number
  rainfall?: number
  /** 蜂群模式模拟时置为 true */
  swarmMode?: boolean
  /** 一般模式：模拟表单中的目标属性条件（含且/或关系） */
  simulateConditions?: RuleCondition[]
  simulateConditionLogic?: RuleConditionLogic
}

export interface ThreatSimulateResult {
  matched: boolean
  rule?: ThreatRule
  ruleName?: string
  threatLevel?: string
  planId?: string
  planCode?: string
  planName?: string
  planDeviceAction?: string
  planDeviceType?: string
  planDeviceFunction?: string
  disposalModeLabel?: string
  triggerStrategyName?: string
  outcomeSummary?: string
  message: string
  swarmNote?: string
  isMonitorCatchAll?: boolean
  monitorNote?: string
}

export interface ThreatAssessResult {
  rule: ThreatRule
  threatLevel: string
  suggestedPlan: string
  planCode?: string
  planDeviceAction?: string
  planDeviceType?: string
  planDeviceFunction?: string
  alarmLevel: string
  summary: string
  triggerNote: string
  swarmNote?: string
}
