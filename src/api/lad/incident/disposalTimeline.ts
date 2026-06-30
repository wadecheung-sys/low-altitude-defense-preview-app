import {
  buildDisposalExecutionStageDetails,
  resolvePlanDisplayName,
  resolvePlanTriggerAction
} from './planTriggerHitDetails'
import {
  assessmentReasonForLevel,
  assessmentRuleNameForLevel,
  buildAssessMessageInfo,
  buildStageMessageInfo,
  formatTimelineSummary,
  resolveStagePlanContext,
  resolveThreatEscalationPath
} from './disposalTimelineMessage'
import type { HistoryEventItem, HandlingStatus, ThreatLevel } from './types'

export type DisposalTimelineNodeStatus = 'done' | 'current' | 'pending' | 'skipped'

export type DisposalTimelineStageKey = 'discover' | 'threat' | 'assess' | 'dispose' | 'result'

export interface DisposalTimelineDetailItem {
  label: string
  value: string
}

export interface DisposalTimelineDetailGroup {
  title: string
  details: DisposalTimelineDetailItem[]
}

export interface DisposalTimelineNode {
  nodeId: string
  key: DisposalTimelineStageKey
  title: string
  time: string
  status: DisposalTimelineNodeStatus
  /** 单条【事件名称】消息描述 */
  summary?: string
  /** 多条【事件名称】消息描述（如威胁评估递进） */
  summaries?: string[]
  /** 单卡片阶段详情 */
  details?: DisposalTimelineDetailItem[]
  /** 多卡片阶段详情（如威胁评估低/中/高危） */
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

function isManualDisposalExecution(row: HistoryEventItem) {
  if (row.disposalExecutionSource === 'manual') return true
  if (row.disposalExecutionSource === 'plan' || row.disposalExecutionSource === 'none') return false
  return false
}

function identifyTargetType(row: HistoryEventItem) {
  if (row.historyTargetType === '躁扰信号-飞鸟') return '飞鸟虚警'
  if (row.targetModel === '未知型号' && row.uavSn === '未解析') return '疑似无人机'
  return '无人机'
}

function identifyRecognitionTargetTag(row: HistoryEventItem, targetType: string) {
  if (row.historyTargetType === '躁扰信号-飞鸟') return '飞鸟虚警'
  const text = `${row.manualConfirmStatus}${row.handlingResult}${row.remark}`
  if (text.includes('地面杂波')) return '地面杂波'
  if (text.includes('误报')) return '误报排除'
  return targetType
}

function identifyIdentityLabel(row: HistoryEventItem) {
  if (isNuisanceEvent(row)) return '非无人机目标'
  if (row.listType === '黑名单') return '黑名单目标'
  if (row.listType === '白名单') return '白名单目标'
  if (row.uavSn === '未解析') return '非合作式黑飞目标'
  return '合作式无人机'
}

function disposeStatus(row: HistoryEventItem): DisposalTimelineNodeStatus {
  if (row.handlingStatus === '待处置' || row.handlingStatus === '处置中') return 'current'
  if (hasCountermeasure(row)) return 'done'
  return 'skipped'
}

function resultStatus(status: HandlingStatus): DisposalTimelineNodeStatus {
  if (status === '已处置' || status === '已结束') return 'done'
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

function detectionSourceTags(row: HistoryEventItem) {
  const text = `${row.detectionDevice}${row.dataSource}`
  return tagList([
    text.includes('雷达') && '雷达',
    text.includes('无线电') && '无线电',
    text.includes('光电') && '光电',
    text.includes('融合') && '多源融合'
  ])
}

function identificationTags(row: HistoryEventItem, targetType: string, identityLabel: string) {
  const isManualRecognition = row.manualConfirmStatus.startsWith('人工-')
  return tagList([
    isManualRecognition ? '人工识别' : '系统识别',
    identifyRecognitionTargetTag(row, targetType),
    identityLabel.includes('黑名单') && '黑名单',
    identityLabel.includes('白名单') && '白名单',
    identityLabel.includes('非合作式') && '非合作式'
  ])
}

function assessmentTags(row: HistoryEventItem) {
  const isManualRecognition = row.manualConfirmStatus.startsWith('人工-')
  return tagList([isManualRecognition ? '人工核查' : '系统评估'])
}

function disposalTags(row: HistoryEventItem, status: DisposalTimelineNodeStatus) {
  if (status === 'skipped') return []
  if (row.handlingStatus === '待处置') return ['人工处置']
  if (isManualDisposalExecution(row) && hasCountermeasure(row)) return ['人工执行']
  return [hasCountermeasure(row) ? '预案联动' : '人工处置']
}

function resultTags(row: HistoryEventItem) {
  const result = resultLabel(row)
  if (result.includes('迫降')) return ['迫降']
  if (result.includes('驱离')) return ['驱离']
  if (result.includes('自离')) return ['自离']
  if (result.includes('自然') || row.handlingResult.includes('自然')) return ['自离']
  if (result.includes('飞鸟') || result.includes('躁扰')) return ['扰动排除']
  if (result.includes('误报')) return ['误报排除']
  if (result.includes('压制')) return ['压制']
  if (result.includes('打击')) return ['打击']
  return tagList([result])
}

function resultLabel(row: HistoryEventItem) {
  if (row.handlingStatus === '已结束' && isNuisanceEvent(row)) return '飞鸟或躁扰信号排除'
  if (row.handlingStatus === '已结束') return row.handlingResult || '事件自然结束'
  return row.handlingResult
}

function tagList(values: Array<string | false | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}

function formatStayDuration(seconds: number): string {
  if (seconds <= 0) return '00:00:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function buildAssessStepDetails(
  row: HistoryEventItem,
  level: ThreatLevel,
  stepIndex: number,
  stepTotal: number
): DisposalTimelineDetailItem[] {
  const metrics = row.assessmentMetrics
  const speedBoost = 1 + stepIndex * 0.15
  const stayBoost = stepIndex * 4

  const metricDetails: DisposalTimelineDetailItem[] = [
    { label: '威胁等级', value: level },
    { label: '命中规则', value: assessmentRuleNameForLevel(row, level) },
    { label: '评估依据', value: assessmentReasonForLevel(row, level) },
    { label: '飞行速度', value: `${(metrics.speed * speedBoost).toFixed(1)}m/s` },
    {
      label: '逗留时间',
      value: formatStayDuration(metrics.stayDurationSec + stayBoost)
    },
    { label: '飞行高度', value: `${metrics.altitude + stepIndex * 5}m` }
  ]

  if (level !== '无危') {
    metricDetails.push({ label: '入侵次数', value: '2次' })
  }

  if (stepTotal > 1) {
    metricDetails.unshift({
      label: '评估次序',
      value: `第 ${stepIndex + 1}/${stepTotal} 次`
    })
  }

  return metricDetails
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
    summaries.push(formatTimelineSummary(info.eventName, info.messageDescription))
    detailGroups.push({
      title: info.eventName,
      details: buildAssessStepDetails(row, level, index, levels.length)
    })
  })

  return {
    nodeId: 'assess',
    key: 'assess',
    title: '威胁评估',
    time: assessStartAt,
    status: 'done',
    summaries,
    detailGroups,
    tags: assessmentTags(row)
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
  const targetType = identifyTargetType(row)
  const identityLabel = identifyIdentityLabel(row)
  const resolvedPlanName = resolvePlanDisplayName(row, planName(row))
  const resolvedActionName = resolvePlanTriggerAction(row, actionName(row))
  const disposeNodeStatus = disposeStatus(row)
  const resultNodeStatus = resultStatus(row.handlingStatus)
  const planContext = resolveStagePlanContext(row)
  const manualExecution = isManualDisposalExecution(row)
  const counterDevice = countermeasureDeviceDisplay(row.countermeasureDevice)

  const stageMessage = (key: DisposalTimelineStageKey, time: string) => {
    const info = buildStageMessageInfo(key, row, time, {
      disposeStatus: disposeNodeStatus,
      ...planContext
    })
    return formatTimelineSummary(info.eventName, info.messageDescription)
  }

  const disposeDetails = buildDisposalExecutionStageDetails(row, {
    skipped: disposeNodeStatus === 'skipped',
    skipReason: skipReason(row),
    fallbackPlanName: resolvedPlanName,
    fallbackActionName: resolvedActionName,
    countermeasureDevice: counterDevice
  })

  if (disposeNodeStatus === 'skipped') {
    disposeDetails.unshift(
      { label: '未触发说明', value: '该阶段作为未触发节点，用于解释未联动反制设备的原因' },
      { label: '未触发原因', value: skipReason(row) }
    )
  } else if (manualExecution) {
    disposeDetails.unshift(
      { label: '执行来源', value: '数据大屏人工操作' },
      { label: '操作人', value: row.disposalOperator || '值班员' }
    )
  } else if (counterDevice && counterDevice !== '--') {
    disposeDetails.unshift({ label: '联动设备', value: counterDevice })
  }

  const resultDetails: DisposalTimelineDetailItem[] = [
    ...(row.remark ? [{ label: '备注', value: row.remark }] : []),
    { label: '处置状态', value: row.handlingStatus },
    { label: '最终结果', value: resultLabel(row) },
    {
      label: '结束原因',
      value: row.handlingStatus === '已结束' ? skipReason(row) : row.handlingResult
    },
    { label: '核查方式', value: isManualRecognition ? '人工核查' : '系统识别' }
  ]

  const nodes: DisposalTimelineNode[] = [
    {
      nodeId: 'discover',
      key: 'discover',
      title: '设备发现',
      time: discovered,
      status: 'done',
      summary: stageMessage('discover', discovered),
      details: [
        { label: '数据来源', value: row.dataSource || '--' },
        { label: '发现设备', value: row.detectionDevice },
        { label: '原始目标', value: `${row.targetId}（${row.targetModel}）` },
        { label: '逼近距离', value: row.approachingDistance || '--' }
      ],
      tags: detectionSourceTags(row)
    },
    {
      nodeId: 'threat',
      key: 'threat',
      title: '威胁识别',
      time: identifyAt,
      status: 'done',
      summary: stageMessage('threat', identifyAt),
      details: [
        {
          label: '识别结论',
          value: isManualRecognition
            ? `人工核查：${recognitionResult}`
            : `系统识别：${recognitionResult}`
        },
        { label: '目标机型', value: targetType },
        { label: '身份属性', value: identityLabel },
        { label: '名单属性', value: row.listType },
        { label: '目标型号', value: row.targetModel },
        { label: '识别码', value: row.uavSn }
      ],
      tags: identificationTags(row, targetType, identityLabel)
    },
    buildThreatAssessmentNode(row, assessAt),
    {
      nodeId: 'dispose',
      key: 'dispose',
      title: '处置执行',
      time: disposeAt,
      status: disposeNodeStatus,
      summary: stageMessage('dispose', disposeAt),
      details: disposeDetails,
      tags: disposalTags(row, disposeNodeStatus)
    },
    {
      nodeId: 'result',
      key: 'result',
      title: '处置结果',
      time: resultAt,
      status: resultNodeStatus,
      summary: stageMessage('result', resultAt),
      details: resultDetails,
      tags: resultTags(row)
    }
  ]

  return nodes.filter((node) => node.status !== 'pending')
}
