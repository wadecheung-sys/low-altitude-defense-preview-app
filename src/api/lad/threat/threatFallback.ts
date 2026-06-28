import type { ThreatRule } from './types'

/** 列表中的兜底监测规则（优先级最低、条件最宽） */
export const THREAT_MONITOR_RULE_ID = 'rule-015'

export const THREAT_MONITOR_RULE_CODE = 'MONITOR-001'

export const THREAT_MONITOR_PLAN_ID = 'plan-015'

/** @deprecated 使用 THREAT_MONITOR_RULE_ID */
export const THREAT_FALLBACK_RULE_ID = THREAT_MONITOR_RULE_ID

export function isMonitorCatchAllRule(rule: Pick<ThreatRule, 'id' | 'ruleCode'>): boolean {
  return rule.id === THREAT_MONITOR_RULE_ID || rule.ruleCode === THREAT_MONITOR_RULE_CODE
}

/** @deprecated 使用 isMonitorCatchAllRule */
export function isFallbackThreatRule(rule: Pick<ThreatRule, 'id' | 'ruleCode'>): boolean {
  return isMonitorCatchAllRule(rule)
}

export function monitorCatchAllNote(): string {
  return '未命中更高优先级规则时，将启动无人机设备监测（多源融合跟踪并上报，不自动升级打击）。'
}
