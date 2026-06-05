export type PlanEnabled = boolean

export type PlanDisposalMode = 'auto' | 'manual'

export interface PlanTriggerRule {
  id: string
  ruleName: string
  sortOrder?: number
  weatherFactor: string
  deviceGroupId: string
  deviceGroupName: string
  deviceGroupType: string
  deviceFunction: string
  deviceAction: string
  enabled: boolean
  remark?: string
}

export interface PlanStrategy {
  id: string
  planCode: string
  planName: string
  planRule: string
  disposalMode: PlanDisposalMode
  manualResponseSeconds: number
  disposalModeLabel?: string
  threatLevel: string
  areaLevel: string
  triggerRules: PlanTriggerRule[]
  priority: number
  weatherFactor: string
  deviceGroupName: string
  deviceGroupType: string
  deviceFunction: string
  deviceAction: string
  enabled: PlanEnabled
  updatedAt: string
  updatedBy: string
  triggerRuleCount?: number
  triggerRulesSummary?: string
}

export interface PlanStrategyQuery {
  pageIndex?: number
  pageSize?: number
  planCode?: string
  planName?: string
  planRule?: string
  deviceAction?: string
  weatherFactor?: string
  disposalMode?: PlanDisposalMode | ''
  areaLevel?: string
  updatedBy?: string
  updatedAtStart?: string
  updatedAtEnd?: string
}

export interface PlanStrategyListResult {
  list: PlanStrategy[]
  total: number
}

export interface PlanStrategySavePayload {
  id?: string
  planCode: string
  planName: string
  planRule?: string
  enabled: PlanEnabled
  disposalMode: PlanDisposalMode
  manualResponseSeconds: number
  threatLevel: string
  areaLevel: string
  priority: number
  triggerRules: PlanTriggerRule[]
}

export interface PlanExecutionPayload {
  planId: string
  planCode: string
  planName: string
  triggerRuleId: string
  triggerRuleName: string
  weatherFactor: string
  deviceGroupName: string
  deviceFunction: string
  deviceAction: string
  execNote: string
  disposalMode: PlanDisposalMode
  manualResponseSeconds: number
  requiresManualConfirm: boolean
}
