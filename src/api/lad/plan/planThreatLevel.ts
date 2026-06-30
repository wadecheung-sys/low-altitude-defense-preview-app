import { coerceThreatLevelLabel, THREAT_LEVEL_ALL } from '@/api/lad/threat/threatLevelUtils'

/** 模拟输入为「全部」时不按威胁等级过滤预案 */
export function isSimulateThreatLevelAll(inputThreatLevel?: string): boolean {
  return inputThreatLevel?.trim() === THREAT_LEVEL_ALL
}

/** 预案威胁等级是否覆盖模拟输入（双方任一为「全部」时视为匹配） */
export function matchesPlanThreatLevel(
  planThreatLevel?: string,
  inputThreatLevel?: string
): boolean {
  if (!inputThreatLevel?.trim()) return false
  const inputLevel = inputThreatLevel.trim()
  if (inputLevel === THREAT_LEVEL_ALL) return true
  const planLevel = planThreatLevel?.trim() || THREAT_LEVEL_ALL
  if (planLevel === THREAT_LEVEL_ALL) return true
  const normalizedPlan = coerceThreatLevelLabel(planLevel) ?? planLevel
  const normalizedInput = coerceThreatLevelLabel(inputLevel) ?? inputLevel
  return normalizedPlan === normalizedInput
}
