import type { AreaRegionType } from '@/api/lad/area/types'

export type ThreatAreaScope = AreaRegionType | '全部'

/** 威胁等级（字典 threat_level 维护：高/中/低/无） */
export type ThreatLevelLabel = '高' | '中' | '低' | '无'

export type RuleConditionProperty =
  | 'speed'
  | 'stayDuration'
  | 'intrusionCount'
  | 'swarmCount'
  | 'altitude'
  | 'signalStrength'

export type RuleConditionOperator = '>' | '>=' | '<' | '<=' | '='

export interface RuleCondition {
  id: string
  property: RuleConditionProperty
  operator: RuleConditionOperator
  value: string
}

export interface ThreatRule {
  id: string
  ruleCode: string
  ruleName: string
  /** 规则生效的区域类型（字典 area_region_type；全部表示不限） */
  areaRegionType: ThreatAreaScope
  targetType: string
  /** 评估输出的威胁等级，后续可扩展为按等级关联预案 */
  threatLevel: ThreatLevelLabel
  areaName: string
  conditions: RuleCondition[]
  /** 列表展示用 */
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
  threatLevel: ThreatLevelLabel
  areaName?: string
  conditions: RuleCondition[]
  priority: number
  planId: string
  enabled: boolean
}

export interface ThreatSimulateInput {
  speed?: number
  stayMinutes?: number
  intrusionCount?: number
  /** 同时探测到的无人机数量（蜂群维度） */
  swarmCount?: number
  targetType?: string
  areaRegionType?: string
  /** 当前天气场景，用于匹配预案内多条触发策略 */
  weatherFactor?: string
}

export interface ThreatSimulateResult {
  matched: boolean
  rule?: ThreatRule
  planId?: string
  planCode?: string
  planName?: string
  /** 预案配置的主处置动作；由预案统一下发，非规则直接指定 */
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
  /** 命中规则后将触发的预案及执行方式说明 */
  triggerNote: string
  swarmNote?: string
}
