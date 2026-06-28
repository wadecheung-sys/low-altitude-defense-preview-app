export const THREAT_LEVELS = ['高危', '中危', '低危', '无危'] as const

export type ThreatLevelLabel = (typeof THREAT_LEVELS)[number]

export const THREAT_LEVEL_ALL = '全部' as const

export type ThreatLevelScope = ThreatLevelLabel | typeof THREAT_LEVEL_ALL

export const THREAT_LEVEL_OPTIONS = THREAT_LEVELS.map((value) => ({ label: value, value }))

const LEGACY_TO_LABEL: Record<string, ThreatLevelLabel> = {
  高: '高危',
  中: '中危',
  低: '低危',
  无: '无危',
  未知: '无危',
  高危: '高危',
  中危: '中危',
  低危: '低危',
  无危: '无危',
  high: '高危',
  medium: '中危',
  mid: '中危',
  low: '低危',
  none: '无危',
  unknown: '无危'
}

/** 将字典 value / 旧 mock 数据统一为威胁等级展示文案 */
export function coerceThreatLevelLabel(level?: string): ThreatLevelLabel | undefined {
  if (!level) return undefined
  const hit = LEGACY_TO_LABEL[level.trim()]
  return hit
}

export function normalizeThreatLevel(level?: string): ThreatLevelLabel {
  return coerceThreatLevelLabel(level) ?? '无危'
}
