import { listAreaRegions } from '@/api/lad/area/areaStore'
import { matchThreatRuleForInput } from '@/api/lad/threat/threatStore'
import type { RuleCondition, ThreatSimulateInput } from '@/api/lad/threat/types'
import type { DisposalTimelineDetailItem } from './disposalTimeline'
import type { HistoryEventItem } from './types'

const PROPERTY_LABEL: Record<string, string> = {
  speed: '飞行速度',
  stayDuration: '逗留时间',
  intrusionCount: '入侵次数',
  swarmCount: '蜂群机数',
  altitude: '飞行高度',
  signalStrength: '信号强度',
  locatedArea: '所处区域'
}

function mapZoneToAreaRegionType(zoneName: string): string | undefined {
  if (zoneName.includes('核心')) return 'nuclear'
  if (zoneName.includes('缓冲')) return 'alert'
  if (zoneName.includes('管制')) return 'warning'
  if (zoneName.includes('试飞')) return 'testflight'
  return 'warning'
}

function buildSimulateInput(row: HistoryEventItem): ThreatSimulateInput {
  const metrics = row.assessmentMetrics
  return {
    speed: metrics.speed,
    stayMinutes: metrics.stayDurationSec / 60,
    intrusionCount: metrics.intrusionCount,
    swarmCount: metrics.swarmCount,
    altitude: metrics.altitude,
    areaRegionType: mapZoneToAreaRegionType(row.zoneName),
    targetType: row.listType,
    targetModel: row.targetModel
  }
}

function formatStayDuration(seconds: number): string {
  if (seconds <= 0) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatAreaNames(value: string): string {
  const ids = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (!ids.length) return value
  const areaMap = new Map(listAreaRegions().map((item) => [item.id, item.name]))
  return ids.map((id) => areaMap.get(id) || id).join('、')
}

function conditionUnit(property: RuleCondition['property']): string {
  switch (property) {
    case 'speed':
      return 'm/s'
    case 'stayDuration':
      return 'min'
    case 'swarmCount':
      return '架'
    case 'altitude':
      return 'm'
    case 'intrusionCount':
      return '次'
    default:
      return ''
  }
}

function formatThreshold(condition: RuleCondition): string {
  if (condition.property === 'locatedArea') {
    return `${PROPERTY_LABEL.locatedArea} = ${formatAreaNames(condition.value)}`
  }
  const unit = conditionUnit(condition.property)
  return `${condition.operator} ${condition.value}${unit}`
}

function formatActualValue(
  property: RuleCondition['property'],
  row: HistoryEventItem,
  input: ThreatSimulateInput
): string {
  const metrics = row.assessmentMetrics
  switch (property) {
    case 'speed':
      return `${metrics.speed.toFixed(1)}m/s`
    case 'stayDuration':
      return formatStayDuration(metrics.stayDurationSec)
    case 'intrusionCount':
      return `${metrics.intrusionCount}次`
    case 'swarmCount':
      return `${metrics.swarmCount ?? input.swarmCount ?? 0}架`
    case 'altitude':
      return `${metrics.altitude}m`
    case 'signalStrength':
      return `${metrics.signalStrength ?? '--'}dBm`
    case 'locatedArea':
      return row.zoneName || '--'
    default:
      return '--'
  }
}

function buildConditionHitDetails(
  row: HistoryEventItem,
  input: ThreatSimulateInput,
  conditions: RuleCondition[]
): DisposalTimelineDetailItem[] {
  return conditions.map((condition) => ({
    label: PROPERTY_LABEL[condition.property] || condition.property,
    value: `${formatActualValue(condition.property, row, input)}（规则：${formatThreshold(condition)}）`
  }))
}

function buildFallbackMetricDetails(row: HistoryEventItem): DisposalTimelineDetailItem[] {
  const metrics = row.assessmentMetrics
  const items: DisposalTimelineDetailItem[] = [
    { label: '飞行速度', value: `${metrics.speed.toFixed(1)}m/s` },
    { label: '逗留时间', value: formatStayDuration(metrics.stayDurationSec) },
    { label: '飞行高度', value: `${metrics.altitude}m` }
  ]
  if (metrics.intrusionCount > 0) {
    items.push({ label: '入侵次数', value: `${metrics.intrusionCount}次` })
  }
  if (metrics.swarmCount && metrics.swarmCount > 0) {
    items.push({ label: '蜂群机数', value: `${metrics.swarmCount}架` })
  }
  return items
}

export function resolveMatchedThreatRule(row: HistoryEventItem) {
  return matchThreatRuleForInput(buildSimulateInput(row))
}

export function buildThreatAssessmentStageDetails(
  row: HistoryEventItem,
  fallbackRuleName: string
): DisposalTimelineDetailItem[] {
  const input = buildSimulateInput(row)
  const matched = matchThreatRuleForInput(input)
  const ruleName = matched?.ruleName || fallbackRuleName
  const base: DisposalTimelineDetailItem[] = [
    { label: '威胁等级', value: row.threatLevel },
    { label: '命中规则', value: ruleName }
  ]

  if (matched?.conditions.length) {
    return [...base, ...buildConditionHitDetails(row, input, matched.conditions)]
  }

  return [...base, ...buildFallbackMetricDetails(row)]
}

export function countThreatAssessmentHits(row: HistoryEventItem): number {
  const matched = resolveMatchedThreatRule(row)
  if (matched?.conditions.length) return matched.conditions.length
  return row.assessmentMetrics.stayDurationSec > 0 ? 2 : 1
}
