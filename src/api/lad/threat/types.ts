import type { AreaRegionType } from '@/api/lad/area/types'

export type ThreatAreaScope = AreaRegionType | '全部'

export type ThreatLevelLabel = '高' | '中' | '低' | '无'

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
  threatLevel: ThreatLevelLabel
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
  threatLevel: ThreatLevelLabel
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
}

export interface ThreatSimulateResult {
  matched: boolean
  rule?: ThreatRule
  planId?: string
  planCode?: string
  planName?: string
  planDeviceAction?: string
  planDeviceType?: string
  planDeviceFunction?: string
  message: string
  swarmNote?: string
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
