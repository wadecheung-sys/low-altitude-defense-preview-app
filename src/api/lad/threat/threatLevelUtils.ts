import type { ThreatLevelLabel } from './types'

const CODE_TO_LABEL: Record<string, ThreatLevelLabel> = {
  high: '高',
  medium: '中',
  mid: '中',
  low: '低',
  none: '无',
  unknown: '无'
}

const LABELS = new Set<ThreatLevelLabel>(['高', '中', '低', '无'])

export function coerceThreatLevelLabel(level?: string): ThreatLevelLabel | undefined {
  if (!level) return undefined
  if (LABELS.has(level as ThreatLevelLabel)) return level as ThreatLevelLabel
  return CODE_TO_LABEL[level]
}
