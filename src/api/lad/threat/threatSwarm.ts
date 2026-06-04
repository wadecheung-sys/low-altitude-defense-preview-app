import type { ThreatLevelLabel, ThreatRule, ThreatSimulateInput } from './types'

/** 蜂群目标类型维度 */
export const SWARM_TARGET_TYPE = '无人机蜂群'

/** 匹配排序时蜂群规则优先级加成（数值越小越先匹配） */
export const SWARM_PRIORITY_BOOST = 8

export function isSwarmRule(rule: Pick<ThreatRule, 'targetType'>): boolean {
  return rule.targetType === SWARM_TARGET_TYPE
}

export function isSwarmSimulateInput(input: ThreatSimulateInput): boolean {
  if (input.targetType === SWARM_TARGET_TYPE) return true
  return (input.swarmCount ?? 0) >= 3
}

/** 规则用于排序的有效优先级：蜂群规则更靠前 */
export function effectiveRulePriority(
  rule: ThreatRule,
  input?: ThreatSimulateInput
): number {
  let p = rule.priority
  if (isSwarmRule(rule)) p -= SWARM_PRIORITY_BOOST
  if (input && isSwarmSimulateInput(input) && isSwarmRule(rule)) p -= 3
  return p
}

export function resolveThreatLevelKey(rule: ThreatRule): 'high' | 'mid' | 'low' {
  if (!rule.enabled) return 'low'
  if (isSwarmRule(rule)) return 'high'
  if (rule.priority <= 5) return 'high'
  if (rule.priority <= 15) return 'mid'
  return 'low'
}

const LEVEL_KEY_TO_LABEL: Record<'high' | 'mid' | 'low', ThreatLevelLabel> = {
  high: '高',
  mid: '中',
  low: '低'
}

/** 按规则属性推导威胁等级（未手工指定时的默认值） */
export function deriveThreatLevel(rule: Pick<ThreatRule, 'enabled' | 'priority' | 'targetType'>): ThreatLevelLabel {
  if (!rule.enabled) return '无'
  return LEVEL_KEY_TO_LABEL[resolveThreatLevelKey(rule as ThreatRule)]
}

export function swarmEscalationNote(planDeviceAction?: string): string {
  if (!planDeviceAction) return ''
  if (planDeviceAction === '驱离') {
    return '蜂群场景下可升级为激光或高功率微波打击（由关联预案定义）。'
  }
  if (planDeviceAction === '激光打击' || planDeviceAction === '高功率微波') {
    return '蜂群入侵默认采用强制打击级预案。'
  }
  return ''
}
