import { formatThreatConditionSummary } from '@/api/lad/threat/threatStore'
import type { RuleCondition } from '@/api/lad/threat/types'
import {
  DISPOSAL_STAGE_FALLBACK_TEMPLATES,
  EVENT_ATTRIBUTE_PROMPT_TEMPLATES,
  suggestEventAttributeName
} from '@/api/lad/system/eventAttributeMessageAlign'
import type { EventAttributeEventType, EventOwnership } from '@/api/lad/system/types'
import {
  resolvePlanDisplayName,
  resolvePlanTriggerAction
} from './planTriggerHitDetails'
import { isHandlingInProgress } from './handlingStatusUtils'
import type { DisposalExecutionSource, HistoryEventItem, ThreatLevel } from './types'

export type DisposalTimelineStageKey = 'discover' | 'threat' | 'assess' | 'dispose' | 'result'

function countermeasureDeviceDisplay(value?: string): string {
  const text = String(value ?? '').trim()
  if (!text || text === '--') return text || '--'
  return text.replace(/\s*\([^)]*\)\s*$/u, '').trim() || text
}

function parseDetectionDevice(row: HistoryEventItem) {
  const text = row.detectionDevice || '探测设备'
  const first = text.split(/[、,]/)[0]?.trim() || text
  const typeMatch = first.match(/^(雷达|无线电侦测|光电)/)
  const digits = row.targetId.replace(/\D/g, '').slice(-4).padStart(4, '0')
  return {
    设备类型: typeMatch?.[1] || '探测设备',
    设备名称: first,
    设备ID: `DEV-${digits}`
  }
}

/** 将模板占位符替换为实际值，返回纯文本消息描述 */
export function fillMessageTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => values[key] ?? `{${key}}`)
}

function eventNameOf(ownership: EventOwnership, eventType: EventAttributeEventType): string {
  return suggestEventAttributeName(ownership, eventType)
}

function threatLevelToAssessType(level: ThreatLevel): EventAttributeEventType {
  if (level === '无危') return '无危'
  if (level === '低危') return '低危'
  if (level === '中危') return '中危'
  return '高危'
}

const FALLBACK_ASSESS_RULE_NAME = '无人机设备监测'
const INTERMEDIATE_ASSESS_RULE_NAME = '缓冲区-跟踪联动'

const INTRUSION_ASSESS_CONDITION: RuleCondition = {
  id: 'assess-intrusion',
  property: 'intrusionCount',
  operator: '>=',
  value: '2'
}

const MID_ASSESS_CONDITIONS: RuleCondition[] = [
  { id: 'assess-mid-speed', property: 'speed', operator: '>', value: '8', nextLogic: 'and' },
  INTRUSION_ASSESS_CONDITION
]

const HIGH_ASSESS_FALLBACK_CONDITIONS: RuleCondition[] = [
  { id: 'assess-high-speed', property: 'speed', operator: '>', value: '12', nextLogic: 'and' },
  { id: 'assess-high-stay', property: 'stayDuration', operator: '>', value: '0.25', nextLogic: 'and' },
  { id: 'assess-high-altitude', property: 'altitude', operator: '<=', value: '100', nextLogic: 'and' },
  INTRUSION_ASSESS_CONDITION
]

const FLIGHT_STATUS_LABEL: Record<string, string> = {
  speed: '飞行速度',
  stayDuration: '逗留时间',
  intrusionCount: '入侵次数',
  altitude: '飞行高度',
  swarmCount: '蜂群机数',
  signalStrength: '信号强度',
  locatedArea: '所处区域'
}

function formatStayDuration(seconds: number): string {
  if (seconds <= 0) return '00:00:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function assessmentConditionsForLevel(
  row: HistoryEventItem,
  level: ThreatLevel
): RuleCondition[] {
  if (level === '无危' || level === '低危') return []
  if (level === '中危') return MID_ASSESS_CONDITIONS
  return HIGH_ASSESS_FALLBACK_CONDITIONS
}

export function buildAssessFlightStatus(
  row: HistoryEventItem,
  level: ThreatLevel,
  stepIndex = 0
): string {
  const conditions = assessmentConditionsForLevel(row, level)
  if (!conditions.length) return '--'

  const metrics = row.assessmentMetrics
  const speedBoost = 1 + stepIndex * 0.15
  const stayBoost = stepIndex * 4

  const parts = conditions
    .filter((c) => c.property in FLIGHT_STATUS_LABEL)
    .map((c) => {
      const label = FLIGHT_STATUS_LABEL[c.property]
      let value: string
      switch (c.property) {
        case 'speed':
          value = `${(metrics.speed * speedBoost).toFixed(1)}m/s`
          break
        case 'stayDuration':
          value = formatStayDuration(metrics.stayDurationSec + stayBoost)
          break
        case 'intrusionCount':
          value = `${Math.max(metrics.intrusionCount, Number(c.value) || 2)}次`
          break
        case 'altitude':
          value = `${metrics.altitude + stepIndex * 5}m`
          break
        case 'swarmCount':
          value = `${metrics.swarmCount ?? 0}架`
          break
        case 'locatedArea':
          value = row.zoneName || '--'
          break
        case 'signalStrength':
          value = `${metrics.signalStrength ?? '--'}dBm`
          break
        default:
          value = '--'
      }
      return `${label}：${value}`
    })

  return parts.length ? parts.join('； ') : '--'
}

function escalationHighAssessRuleName(row: HistoryEventItem): string {
  const isCore = row.zoneName.includes('核心') || row.zoneName.includes('管制')
  if (row.listType === '黑名单') return isCore ? '黑名单目标进入重点区域' : '黑名单目标活动'
  if (row.uavSn === '未解析') return isCore ? '非合作式目标进入重点区域' : '非合作式目标活动'
  return '高威胁目标处置规则'
}

export function assessmentRuleNameForLevel(row: HistoryEventItem, level: ThreatLevel): string {
  if (level === '无危') return '白名单通行规则'
  if (level === '低危') return FALLBACK_ASSESS_RULE_NAME
  if (level === '中危') return INTERMEDIATE_ASSESS_RULE_NAME
  return escalationHighAssessRuleName(row)
}

export function assessmentReasonForLevel(row: HistoryEventItem, level: ThreatLevel): string {
  if (level === '无危') {
    return '无（任意场景）'
  }
  if (level === '低危') {
    return '无（任意场景）'
  }
  if (level === '中危') {
    return formatThreatConditionSummary(MID_ASSESS_CONDITIONS)
  }

  return formatThreatConditionSummary(HIGH_ASSESS_FALLBACK_CONDITIONS)
}

function fallbackPlanName(row: HistoryEventItem) {
  if (row.listType === '黑名单') return '黑名单无人机入侵反制'
  if (row.uavSn === '未解析') return '非合作式无人机入侵反制'
  if (row.threatLevel === '高危') return '高威胁目标联动反制'
  return '常规无人机处置预案'
}

function fallbackActionName(row: HistoryEventItem) {
  if (row.handlingResult.includes('迫降')) return '迫降处置'
  if (row.handlingResult.includes('压制')) return '无线电压制'
  if (row.handlingResult.includes('激光')) return '激光打击'
  return '定向驱离'
}

function resolveResultEventType(row: HistoryEventItem): EventAttributeEventType {
  const text = `${row.handlingResult}${row.remark}`
  if (text.includes('迫降')) return '迫降'
  if (text.includes('打击') || text.includes('激光')) return '打击'
  return '驱离/自离'
}

function hasCountermeasure(row: HistoryEventItem) {
  return Boolean(row.countermeasureDevice && row.countermeasureDevice !== '--')
}

function resolveDisposalExecutionSource(row: HistoryEventItem): DisposalExecutionSource {
  if (row.disposalExecutionSource) return row.disposalExecutionSource
  if (!hasCountermeasure(row)) return 'none'
  return 'plan'
}

function targetKindLabel(row: HistoryEventItem): string {
  if (row.historyTargetType) return row.historyTargetType
  if (row.uavSn === '未解析') return '黑飞无人机'
  return '合作式无人机'
}

export interface StageMessageInfo {
  eventName: string
  messageDescription: string
}

export function formatTimelineSummary(messageDescription: string): string {
  return messageDescription
}

export function buildAssessMessageInfo(
  row: HistoryEventItem,
  time: string,
  level: ThreatLevel
): StageMessageInfo {
  const eventType = threatLevelToAssessType(level)
  return {
    eventName: eventNameOf('威胁评估', eventType),
    messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
      时间: time,
      目标型号: row.targetModel,
      目标ID: row.targetId,
      规则名称: assessmentRuleNameForLevel(row, level)
    })
  }
}

/** 入侵过程中威胁等级递进路径（最终等级为 row.threatLevel） */
export function resolveThreatEscalationPath(finalLevel: ThreatLevel): ThreatLevel[] {
  if (finalLevel === '高危') return ['低危', '中危', '高危']
  if (finalLevel === '中危') return ['低危', '中危']
  if (finalLevel === '低危') return ['低危']
  return ['无危']
}

export function buildStageMessageInfo(
  stage: DisposalTimelineStageKey,
  row: HistoryEventItem,
  time: string,
  options: {
    disposeStatus: 'done' | 'current' | 'pending' | 'skipped'
    resolvedPlanName: string
    resolvedActionName: string
  }
): StageMessageInfo {
  const base = {
    时间: time,
    目标型号: row.targetModel,
    目标ID: row.targetId
  }

  switch (stage) {
    case 'discover': {
      const eventType = '独立发现' as const
      const device = parseDetectionDevice(row)
      return {
        eventName: eventNameOf('目标发现', eventType),
        messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
          时间: time,
          ...device
        })
      }
    }
    case 'threat': {
      const eventType = '多源融合' as const
      return {
        eventName: eventNameOf('威胁识别', eventType),
        messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
          时间: time,
          目标类型: targetKindLabel(row)
        })
      }
    }
    case 'assess':
      return buildAssessMessageInfo(row, time, row.threatLevel)
    case 'dispose': {
      if (options.disposeStatus === 'skipped') {
        return {
          eventName: '处置执行',
          messageDescription: fillMessageTemplate(
            DISPOSAL_STAGE_FALLBACK_TEMPLATES.disposeSkipped,
            { 时间: time }
          )
        }
      }
      if (isHandlingInProgress(row.handlingStatus) && !hasCountermeasure(row)) {
        return {
          eventName: eventNameOf('处置执行', '人工处置'),
          messageDescription: fillMessageTemplate(
            DISPOSAL_STAGE_FALLBACK_TEMPLATES.disposePending,
            { 时间: time }
          )
        }
      }
      const deviceName = countermeasureDeviceDisplay(row.countermeasureDevice)
      if (resolveDisposalExecutionSource(row) === 'manual') {
        const eventType = '人工处置' as const
        return {
          eventName: eventNameOf('处置执行', eventType),
          messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
            ...base,
            反制动作: row.manualDisposalAction || options.resolvedActionName,
            设备名称: deviceName
          })
        }
      }
      const eventType = '自动处置' as const
      return {
        eventName: eventNameOf('处置执行', eventType),
        messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
          ...base,
          规则名称: options.resolvedPlanName,
          反制动作: options.resolvedActionName,
          设备名称: deviceName
        })
      }
    }
    case 'result': {
      if (row.historyTargetType === '躁扰信号-飞鸟') {
        return {
          eventName: '目标结果',
          messageDescription: fillMessageTemplate(
            DISPOSAL_STAGE_FALLBACK_TEMPLATES.resultNuisance,
            { 时间: time }
          )
        }
      }
      const eventType = resolveResultEventType(row)
      const ownership = '目标结果' as const
      return {
        eventName: eventNameOf(ownership, eventType),
        messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
          时间: time,
          编码: row.targetId,
          逗留时间: row.duration || row.abnormalDuration || '00:00:00'
        })
      }
    }
    default:
      return { eventName: '', messageDescription: '' }
  }
}

export function resolveStagePlanContext(row: HistoryEventItem) {
  return {
    resolvedPlanName: resolvePlanDisplayName(row, fallbackPlanName(row)),
    resolvedActionName: resolvePlanTriggerAction(row, fallbackActionName(row))
  }
}
