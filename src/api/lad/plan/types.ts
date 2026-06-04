export type PlanEnabled = boolean

/** 处置模式：自动处置 / 人员值守 */
export type PlanDisposalMode = 'auto' | 'manual'

/** 预案内单条场景触发规则：条件组合 → 响应方式 */
export interface PlanTriggerRule {
  id: string
  /** 规则名称，如「默认-晴天」「大雾天备用」 */
  ruleName: string
  /** 匹配优先级，数值越大越优先 */
  priority: number
  /** 天气场景：全部 / 晴天 / 大雾 等 */
  weatherFactor: string
  /** 兼容字段，默认全部；区域等级在威胁评估规则中维护 */
  areaLevel: string
  deviceType: string
  deviceFunction: string
  deviceAction: string
  enabled: boolean
  remark?: string
}

export interface PlanStrategy {
  id: string
  planCode: string
  planName: string
  /** 执行说明 / SOP（不参与触发匹配） */
  planRule: string
  /** 处置模式 */
  disposalMode: PlanDisposalMode
  /** 自动处置时的人工响应窗口（秒），0 表示立即执行；人员值守固定为 0 */
  manualResponseSeconds: number
  /** 列表展示：处置模式摘要 */
  disposalModeLabel?: string
  /** 场景触发规则列表（同一预案多场景多响应） */
  triggerRules: PlanTriggerRule[]
  /** 列表展示：主规则摘要（由 triggerRules 推导） */
  areaLevel: string
  weatherFactor: string
  deviceType: string
  deviceFunction: string
  deviceAction: string
  enabled: PlanEnabled
  updatedAt: string
  updatedBy: string
  /** 列表展示：触发规则条数 */
  triggerRuleCount?: number
  /** 列表展示：场景摘要（如 2条·全部、大雾） */
  triggerRulesSummary?: string
}

export interface PlanStrategyQuery {
  pageIndex?: number
  pageSize?: number
  planCode?: string
  planName?: string
  planRule?: string
  deviceType?: string
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
  triggerRules: PlanTriggerRule[]
}

/** 预案触发后下发至对接层的执行摘要 */
export interface PlanExecutionPayload {
  planId: string
  planCode: string
  planName: string
  triggerRuleId: string
  triggerRuleName: string
  weatherFactor: string
  deviceType: string
  deviceFunction: string
  deviceAction: string
  execNote: string
  disposalMode: PlanDisposalMode
  manualResponseSeconds: number
  requiresManualConfirm: boolean
}
