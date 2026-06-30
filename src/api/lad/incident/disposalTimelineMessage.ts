import { formatThreatConditionSummary } from '@/api/lad/threat/threatStore'
import type { RuleCondition } from '@/api/lad/threat/types'
import { isMonitorCatchAllRule } from '@/api/lad/threat/threatFallback'
import { EVENT_ATTRIBUTE_PROMPT_TEMPLATES, suggestEventAttributeName } from '@/api/lad/system/eventAttributeMessageAlign'
import type { EventAttributeEventType, EventOwnership } from '@/api/lad/system/types'
import {
  resolvePlanDisplayName,
  resolvePlanTriggerAction
} from './planTriggerHitDetails'
import { resolveMatchedThreatRule } from './threatAssessmentHitDetails'
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

function appendIntrusionCondition(summary: string): string {
  if (summary.includes('入侵次数')) return summary
  const intrusion = formatThreatConditionSummary([INTRUSION_ASSESS_CONDITION])
  if (!summary || summary === '无（任意场景）') return intrusion
  return `${summary} 且 ${intrusion}`
}

function assessmentRuleName(row: HistoryEventItem) {
  const matched = resolveMatchedThreatRule(row)
  if (matched?.ruleName && !isMonitorCatchAllRule(matched)) return matched.ruleName
  const isCore = row.zoneName.includes('核心') || row.zoneName.includes('管制')
  if (row.historyTargetType === '躁扰信号-飞鸟') return '目标机型排除规则'
  if (row.listType === '黑名单') return isCore ? '黑名单目标进入重点区域' : '黑名单目标活动'
  if (row.listType === '白名单') return '白名单目标授权通行'
  if (row.uavSn === '未解析') return isCore ? '非合作式目标进入重点区域' : '非合作式目标活动'
  if (row.threatLevel === '高危') return '高威胁目标处置规则'
  return '常规无人机目标评估规则'
}

export function assessmentRuleNameForLevel(row: HistoryEventItem, level: ThreatLevel): string {
  if (level === '无危') return '白名单通行规则'
  if (level === '低危') return FALLBACK_ASSESS_RULE_NAME
  if (level === '中危') return INTERMEDIATE_ASSESS_RULE_NAME
  return assessmentRuleName(row)
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

  const matched = resolveMatchedThreatRule(row)
  if (matched?.conditionSummary && !isMonitorCatchAllRule(matched)) {
    return appendIntrusionCondition(matched.conditionSummary)
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

function resolveBearing(row: HistoryEventItem): string {
  const seed = row.id.charCodeAt(row.id.length - 1) % 8
  const bearings = [
    '正北 0°',
    '东北 45°',
    '正东 90°',
    '东南 135°',
    '正南 180°',
    '西南 225°',
    '正西 270°',
    '西北 315°'
  ]
  return bearings[seed]
}

function hasCountermeasure(row: HistoryEventItem) {
  return Boolean(row.countermeasureDevice && row.countermeasureDevice !== '--')
}

function resolveDisposalExecutionSource(row: HistoryEventItem): DisposalExecutionSource {
  if (row.disposalExecutionSource) return row.disposalExecutionSource
  if (!hasCountermeasure(row) || row.handlingStatus === '待处置') return 'none'
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

export function formatTimelineSummary(eventName: string, messageDescription: string): string {
  return `【${eventName}】${messageDescription}`
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
        eventName: eventNameOf('设备发现', eventType),
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
          eventName: '处置未触发',
          messageDescription: `${time}未命中反制预案，未下发处置指令。`
        }
      }
      if (row.handlingStatus === '待处置') {
        return {
          eventName: eventNameOf('处置执行', '人工处置'),
          messageDescription: `${time}已形成处置建议，等待预案触发或值守人员确认。`
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
          eventName: '躁扰虚警排除',
          messageDescription: `${time}事件已闭环，目标判定为躁扰信号排除。`
        }
      }
      const eventType = resolveResultEventType(row)
      const ownership = '处置结果' as const
      if (eventType === '迫降') {
        return {
          eventName: eventNameOf(ownership, eventType),
          messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
            ...base,
            经纬度: row.targetLocation || 'E:--，N:--'
          })
        }
      }
      if (eventType === '打击') {
        return {
          eventName: eventNameOf(ownership, eventType),
          messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], base)
        }
      }
      return {
        eventName: eventNameOf(ownership, eventType),
        messageDescription: fillMessageTemplate(EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType], {
          ...base,
          方位角: resolveBearing(row),
          逗留时间: row.duration || row.abnormalDuration || '00:00:00'
        })
      }
    }
    default:
      return { eventName: '系统消息', messageDescription: '' }
  }
}

export function resolveStagePlanContext(row: HistoryEventItem) {
  return {
    resolvedPlanName: resolvePlanDisplayName(row, fallbackPlanName(row)),
    resolvedActionName: resolvePlanTriggerAction(row, fallbackActionName(row))
  }
}
