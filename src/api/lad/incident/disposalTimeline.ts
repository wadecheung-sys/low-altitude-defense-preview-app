import {
  buildDisposalExecutionStageDetails,
  resolvePlanDisplayName,
  resolvePlanTriggerAction
} from './planTriggerHitDetails'
import {
  assessmentReasonForLevel,
  assessmentRuleNameForLevel,
  buildAssessMessageInfo,
  buildAssessFlightStatus,
  buildStageMessageInfo,
  formatTimelineSummary,
  resolveStagePlanContext,
  resolveThreatEscalationPath
} from './disposalTimelineMessage'
import { resolveHistoryTargetType } from './historyTargetType'
import { isHandlingEnded, isHandlingInProgress } from './handlingStatusUtils'
import type { HistoryEventItem, HandlingStatus, ThreatLevel } from './types'

export type DisposalTimelineNodeStatus = 'done' | 'current' | 'pending' | 'skipped'

export type DisposalTimelineStageKey = 'discover' | 'threat' | 'assess' | 'dispose' | 'result'

export interface DisposalTimelineDetailItem {
  label: string
  value: string
}

export interface DisposalTimelineDetailGroup {
  title?: string
  items: DisposalTimelineDetailItem[]
}

export interface DisposalTimelineNode {
  nodeId: string
  key: DisposalTimelineStageKey
  title: string
  time: string
  status: DisposalTimelineNodeStatus
  /** 单条消息描述 */
  summary?: string
  /** 多条消息描述（如威胁评估递进） */
  summaries?: string[]
  /** 阶段详情（单组，空则不展示） */
  details?: DisposalTimelineDetailItem[]
  /** 阶段详情（多组卡片，如威胁评估递进） */
  detailGroups?: DisposalTimelineDetailGroup[]
  tags?: string[]
}

function countermeasureDeviceDisplay(value?: string): string {
  const text = String(value ?? '').trim()
  if (!text || text === '--') return text || '--'
  return text.replace(/\s*\([^)]*\)\s*$/u, '').trim() || text
}

function parseEventTime(text: string): Date | null {
  if (!text?.trim() || text === '--') return null
  const d = new Date(text.replace(/-/g, '/'))
  return Number.isNaN(d.getTime()) ? null : d
}

function formatEventTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}

function addSeconds(base: string, sec: number): string {
  const d = parseEventTime(base)
  if (!d) return base
  d.setSeconds(d.getSeconds() + sec)
  return formatEventTime(d)
}

function isNuisanceEvent(row: HistoryEventItem) {
  return row.historyTargetType === '躁扰信号-飞鸟'
}

function hasCountermeasure(row: HistoryEventItem) {
  return Boolean(row.countermeasureDevice && row.countermeasureDevice !== '--')
}

function disposeStatus(row: HistoryEventItem): DisposalTimelineNodeStatus {
  if (isHandlingInProgress(row.handlingStatus)) return 'current'
  if (hasCountermeasure(row)) return 'done'
  return 'skipped'
}

function resultStatus(status: HandlingStatus | string): DisposalTimelineNodeStatus {
  if (isHandlingEnded(status)) return 'done'
  return 'pending'
}

function skipReason(row: HistoryEventItem) {
  if (isNuisanceEvent(row)) return '目标识别为飞鸟或躁扰信号，未进入反制处置流程'
  if (row.listType === '白名单') return '白名单目标未触发异常行为条件'
  if (row.handlingResult.includes('自离') || row.handlingResult.includes('自然')) {
    return '目标已自然离开防护区域'
  }
  if (row.threatLevel === '低危') return '威胁等级较低，未命中反制预案'
  return '未命中反制预案'
}

function planName(row: HistoryEventItem) {
  if (row.listType === '黑名单') return '黑名单无人机入侵反制'
  if (row.uavSn === '未解析') return '非合作式无人机入侵反制'
  if (row.threatLevel === '高危') return '高威胁目标联动反制'
  return '常规无人机处置预案'
}

function actionName(row: HistoryEventItem) {
  if (row.handlingResult.includes('迫降')) return '迫降处置'
  if (row.handlingResult.includes('压制')) return '无线电压制'
  if (row.handlingResult.includes('激光')) return '激光打击'
  return '定向驱离'
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}

function buildAssessStepDetails(
  row: HistoryEventItem,
  level: ThreatLevel,
  stepIndex: number,
  stepTotal: number,
  options?: { showOrderInItems?: boolean }
): DisposalTimelineDetailItem[] {
  const metricDetails: DisposalTimelineDetailItem[] = [
    { label: '威胁等级', value: level },
    { label: '命中规则', value: assessmentRuleNameForLevel(row, level) },
    { label: '评估依据', value: assessmentReasonForLevel(row, level) },
    { label: '飞行状态', value: buildAssessFlightStatus(row, level, stepIndex) }
  ]

  if (stepTotal > 1 && options?.showOrderInItems !== false) {
    metricDetails.unshift({
      label: '评估次序',
      value: `第 ${stepIndex + 1}/${stepTotal} 次`
    })
  }

  return metricDetails
}

function stageDetails(items: DisposalTimelineDetailItem[]): DisposalTimelineDetailItem[] | undefined {
  return items.length ? items : undefined
}

function buildThreatAssessmentNode(
  row: HistoryEventItem,
  assessStartAt: string
): DisposalTimelineNode {
  const levels = isNuisanceEvent(row)
    ? (['无危'] as ThreatLevel[])
    : resolveThreatEscalationPath(row.threatLevel)

  const summaries: string[] = []
  const detailGroups: DisposalTimelineDetailGroup[] = []

  levels.forEach((level, index) => {
    const info = buildAssessMessageInfo(row, assessStartAt, level)
    summaries.push(formatTimelineSummary(info.messageDescription))
    detailGroups.push({
      title: levels.length > 1 ? `第 ${index + 1}/${levels.length} 次` : undefined,
      items: buildAssessStepDetails(row, level, index, levels.length, {
        showOrderInItems: levels.length <= 1
      })
    })
  })

  return {
    nodeId: 'assess',
    key: 'assess',
    title: '威胁评估',
    time: assessStartAt,
    status: 'done',
    summary: summaries.length === 1 ? summaries[0] : undefined,
    summaries: summaries.length > 1 ? summaries : undefined,
    details: detailGroups.length === 1 ? detailGroups[0].items : undefined,
    detailGroups: detailGroups.length > 1 ? detailGroups : undefined
  }
}

export function buildDisposalTimeline(row: HistoryEventItem): DisposalTimelineNode[] {
  const seed = hashSeed(row.id)
  const discovered = row.discoveredAt
  const identifyAt = addSeconds(discovered, 8 + (seed % 12))
  const assessAt = addSeconds(identifyAt, 5 + (seed % 8))
  const lastAssessAt = addSeconds(assessAt, Math.max(0, resolveThreatEscalationPath(row.threatLevel).length - 1) * 8)
  const disposeAt =
    row.handledAt && row.handledAt !== '--' ? row.handledAt : addSeconds(lastAssessAt, 12)
  const resultAt = row.endedAt && row.endedAt !== '--' ? row.endedAt : addSeconds(disposeAt, 20)
  const isManualRecognition = row.manualConfirmStatus.startsWith('人工-')
  const recognitionResult = row.manualConfirmStatus.replace(/^人工-/, '')
  const targetType = resolveHistoryTargetType(row)
  const resolvedPlanName = resolvePlanDisplayName(row, planName(row))
  const resolvedActionName = resolvePlanTriggerAction(row, actionName(row))
  const disposeNodeStatus = disposeStatus(row)
  const resultNodeStatus = resultStatus(row.handlingStatus)
  const planContext = resolveStagePlanContext(row)
  const counterDevice = countermeasureDeviceDisplay(row.countermeasureDevice)

  const stageMessage = (key: DisposalTimelineStageKey, time: string) => {
    const info = buildStageMessageInfo(key, row, time, {
      disposeStatus: disposeNodeStatus,
      ...planContext
    })
    return formatTimelineSummary(info.messageDescription)
  }

  const disposeDetails = buildDisposalExecutionStageDetails(row, {
    skipped: disposeNodeStatus === 'skipped',
    skipReason: skipReason(row),
    fallbackPlanName: resolvedPlanName,
    fallbackActionName: resolvedActionName,
    countermeasureDevice: counterDevice
  })

  const nodes: DisposalTimelineNode[] = [
    {
      nodeId: 'discover',
      key: 'discover',
      title: '目标发现',
      time: discovered,
      status: 'done',
      summary: stageMessage('discover', discovered),
      details: stageDetails([
        { label: '数据来源', value: row.dataSource || '--' },
        { label: '发现设备', value: row.detectionDevice },
        { label: '目标ID', value: row.targetId || '--' },
        { label: '逼近距离', value: row.approachingDistance || '--' }
      ])
    },
    {
      nodeId: 'threat',
      key: 'threat',
      title: '威胁识别',
      time: identifyAt,
      status: 'done',
      summary: stageMessage('threat', identifyAt),
      details: stageDetails([
        {
          label: '识别结论',
          value: isManualRecognition
            ? `人工核查：${recognitionResult}`
            : `系统识别：${recognitionResult}`
        },
        { label: '目标类型', value: targetType },
        { label: '名单类型', value: row.listType },
        { label: '目标型号', value: row.targetModel },
        { label: '识别码', value: row.uavSn }
      ])
    },
    buildThreatAssessmentNode(row, assessAt),
    {
      nodeId: 'dispose',
      key: 'dispose',
      title: '处置执行',
      time: disposeAt,
      status: disposeNodeStatus,
      summary: stageMessage('dispose', disposeAt),
      details: stageDetails(disposeDetails)
    },
    {
      nodeId: 'result',
      key: 'result',
      title: '目标结果',
      time: resultAt,
      status: resultNodeStatus,
      summary: stageMessage('result', resultAt)
    }
  ]

  return nodes.filter((node) => node.status !== 'pending')
}
