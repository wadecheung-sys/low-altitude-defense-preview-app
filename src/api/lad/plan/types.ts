export type PlanEnabled = boolean

export type PlanDisposalMode = 'auto' | 'manual'

export type PlanConditionOperator = '>' | '<' | '=' | '!='

export interface PlanTriggerRule {
  id: string
  ruleName: string
  sortOrder?: number
  weatherFactor?: string
  areaLevel?: string[]
  temperatureOperator?: PlanConditionOperator | ''
  temperatureValue?: number | null
  humidityOperator?: PlanConditionOperator | ''
  humidityValue?: number | null
  windPowerOperator?: PlanConditionOperator | ''
  windPowerValue?: number | null
  rainfallOperator?: PlanConditionOperator | ''
  rainfallValue?: number | null
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
  weatherFactor?: string
  triggerConditionSummary?: string
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
  areaLevel?: string
  temperature?: number
  humidity?: number
  windPower?: number
  rainfall?: number
  disposalMode?: PlanDisposalMode | ''
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
  weatherFactor?: string
  areaLevel?: string[]
  temperatureOperator?: PlanConditionOperator | ''
  temperatureValue?: number | null
  humidityOperator?: PlanConditionOperator | ''
  humidityValue?: number | null
  windPowerOperator?: PlanConditionOperator | ''
  windPowerValue?: number | null
  rainfallOperator?: PlanConditionOperator | ''
  rainfallValue?: number | null
  deviceGroupName: string
  deviceFunction: string
  deviceAction: string
  execNote: string
  disposalMode: PlanDisposalMode
  manualResponseSeconds: number
  requiresManualConfirm: boolean
}
