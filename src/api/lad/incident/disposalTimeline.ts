import type { HistoryEventItem, HandlingStatus } from './types'

export type DisposalTimelineNodeStatus = 'done' | 'current' | 'pending' | 'skipped'

export type DisposalTimelineStageKey = 'discover' | 'threat' | 'assess' | 'dispose' | 'result'

export interface DisposalTimelineDetailItem {
  label: string
  value: string
}

export interface DisposalTimelineNode {
  key: DisposalTimelineStageKey
  title: string
  time: string
  status: DisposalTimelineNodeStatus
  summary: string
  detail?: string
  details?: DisposalTimelineDetailItem[]
  tags?: string[]
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

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

function isNuisanceEvent(row: HistoryEventItem) {
  const text = `${row.manualConfirmStatus}${row.handlingResult}${row.remark}`
  return includesAny(text, ['躁扰', '飞鸟', '误报', '非无人机'])
}

function hasCountermeasure(row: HistoryEventItem) {
  return Boolean(row.countermeasureDevice && row.countermeasureDevice !== '--')
}

function identifyTargetType(row: HistoryEventItem) {
  if (isNuisanceEvent(row)) return row.handlingResult.includes('飞鸟') ? '飞鸟扰动' : '躁扰告警'
  if (row.targetModel === '未知型号' && row.uavSn === '未解析') return '疑似无人机'
  return '无人机'
}

function identifyIdentityLabel(row: HistoryEventItem) {
  if (isNuisanceEvent(row)) return '非无人机目标'
  if (row.listType === '黑名单') return '黑名单目标'
  if (row.listType === '白名单') return '白名单目标'
  if (row.uavSn === '未解析') return '非合作式黑飞目标'
  return '合作式无人机'
}

function assessmentRule(row: HistoryEventItem) {
  const isCore = row.zoneName.includes('核心') || row.zoneName.includes('管制')
  if (isNuisanceEvent(row)) return '目标类型排除规则'
  if (row.listType === '黑名单') return isCore ? '黑名单目标进入重点区域' : '黑名单目标活动'
  if (row.listType === '白名单') return '白名单目标授权通行'
  if (row.uavSn === '未解析') return isCore ? '非合作式目标进入重点区域' : '非合作式目标活动'
  if (row.threatLevel === '高') return '高威胁目标处置规则'
  return '常规无人机目标评估规则'
}

function assessmentReason(row: HistoryEventItem) {
  const items = [`目标类型=${identifyTargetType(row)}`, `身份属性=${identifyIdentityLabel(row)}`]
  if (row.zoneName) items.push(`所在区域=${row.zoneName}`)
  if (row.abnormalDuration !== '--') items.push(`异常持续=${row.abnormalDuration}`)
  return items.join('；')
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
  if (row.threatLevel === '低') return '威胁等级较低，未命中反制预案'
  return '未命中反制预案'
}

function planName(row: HistoryEventItem) {
  if (row.listType === '黑名单') return '黑名单无人机入侵反制'
  if (row.uavSn === '未解析') return '非合作式无人机入侵反制'
  if (row.threatLevel === '高') return '高威胁目标联动反制'
  return '常规无人机处置预案'
}

function actionName(row: HistoryEventItem) {
  if (row.handlingResult.includes('迫降')) return '迫降处置'
  if (row.handlingResult.includes('压制')) return '无线电压制'
  if (row.handlingResult.includes('激光')) return '激光打击'
  return '定向驱离'
}

function resultLabel(row: HistoryEventItem) {
  if (row.handlingStatus === '已结束' && isNuisanceEvent(row)) return '飞鸟或躁扰信号排除'
  if (row.handlingStatus === '已结束') return row.handlingResult || '事件自然结束'
  return row.handlingResult
}

function tagList(values: Array<string | false | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

export function buildDisposalTimeline(row: HistoryEventItem): DisposalTimelineNode[] {
  const seed = hashSeed(row.id)
  const discovered = row.discoveredAt
  const identifyAt = addSeconds(discovered, 8 + (seed % 12))
  const assessAt = addSeconds(identifyAt, 5 + (seed % 8))
  const disposeAt =
    row.handledAt && row.handledAt !== '--' ? row.handledAt : addSeconds(assessAt, 12)
  const resultAt = row.endedAt && row.endedAt !== '--' ? row.endedAt : addSeconds(disposeAt, 20)
  const isManualRecognition = row.manualConfirmStatus.startsWith('人工-')
  const recognitionResult = row.manualConfirmStatus.replace(/^人工-/, '')
  const targetType = identifyTargetType(row)
  const identityLabel = identifyIdentityLabel(row)
  const ruleName = assessmentRule(row)
  const countermeasureCount = hasCountermeasure(row) ? 1 : 0
  const disposeNodeStatus = disposeStatus(row)
  const resultNodeStatus = resultStatus(row.handlingStatus)
  const hasAbnormal = row.abnormalDuration !== '--'

  const nodes: DisposalTimelineNode[] = [
    {
      key: 'discover',
      title: '设备发现',
      time: discovered,
      status: 'done',
      summary: `[${discovered}] ${row.detectionDevice}发现疑似低空目标，已形成原始探测记录。`,
      detail: `数据来源：${row.dataSource}`,
      details: [
        { label: '发现设备', value: row.detectionDevice },
        { label: '原始目标', value: `${row.targetId}（${row.targetModel}）` },
        { label: '目标位置', value: row.targetLocation },
        { label: '原始特征', value: row.trajectoryFeature }
      ],
      tags: tagList([
        '探测',
        row.dataSource,
        row.uavSn !== '未解析' ? `识别码 ${row.uavSn}` : '识别码未解析'
      ])
    },
    {
      key: 'threat',
      title: '威胁识别',
      time: identifyAt,
      status: 'done',
      summary: `[${identifyAt}] 完成目标识别，判定为${targetType}，身份属性为${identityLabel}。`,
      detail: isManualRecognition
        ? `人工核查结论：${recognitionResult}`
        : `系统识别结论：${recognitionResult}`,
      details: [
        { label: '目标类型', value: targetType },
        { label: '身份属性', value: identityLabel },
        { label: '名单属性', value: row.listType },
        { label: '品牌型号', value: row.targetModel },
        { label: '识别码', value: row.uavSn }
      ],
      tags: tagList([
        targetType,
        identityLabel,
        row.listType !== '未知' && row.listType,
        isManualRecognition ? '人工核查' : '系统识别'
      ])
    },
    {
      key: 'assess',
      title: '威胁评估',
      time: assessAt,
      status: 'done',
      summary: `[${assessAt}] 根据威胁评估规则，目标命中${hasAbnormal ? 2 : 1}项条件，评估结果为${row.threatLevel}。`,
      detail: `评估依据：${assessmentReason(row)}`,
      details: [
        { label: '威胁等级', value: row.threatLevel },
        { label: '命中规则', value: ruleName },
        { label: '所在区域', value: row.zoneName },
        {
          label: '异常行为',
          value: hasAbnormal ? `持续 ${row.abnormalDuration}` : '未发现明显异常行为'
        }
      ],
      tags: tagList([`威胁${row.threatLevel}`, row.zoneName, '命中规则'])
    },
    {
      key: 'dispose',
      title: '处置执行',
      time: disposeAt,
      status: disposeNodeStatus,
      summary:
        disposeNodeStatus === 'skipped'
          ? `[${disposeAt}] 未命中反制预案，未下发处置指令；原因：${skipReason(row)}。`
          : row.handlingStatus === '待处置'
            ? `[${disposeAt}] 已形成处置建议，等待预案触发或值守人员确认。`
            : row.handlingStatus === '处置中'
              ? `[${disposeAt}] 命中预案策略“${planName(row)}”，处置指令正在执行中。`
              : `[${disposeAt}] 命中预案策略“${planName(row)}”，已联动${countermeasureCount}台反制设备执行${actionName(row)}。`,
      detail:
        disposeNodeStatus === 'skipped'
          ? '该阶段作为未触发节点展示，用于解释事件未联动反制设备的原因。'
          : `联动设备：${row.countermeasureDevice}`,
      details: [
        { label: '策略名称', value: disposeNodeStatus === 'skipped' ? '--' : planName(row) },
        { label: '触发条件', value: disposeNodeStatus === 'skipped' ? skipReason(row) : ruleName },
        { label: '联动设备', value: row.countermeasureDevice },
        { label: '执行动作', value: disposeNodeStatus === 'skipped' ? '未执行' : actionName(row) }
      ],
      tags: tagList([
        row.handlingStatus,
        disposeNodeStatus === 'skipped' ? '未触发预案' : '已联动反制',
        hasCountermeasure(row) && row.countermeasureDevice
      ])
    },
    {
      key: 'result',
      title: '处置结果',
      time: resultAt,
      status: resultNodeStatus,
      summary: `[${resultAt}] 事件已闭环，最终结果为${resultLabel(row)}。`,
      detail: row.remark || `最终处置状态：${row.handlingStatus}`,
      details: [
        { label: '处置状态', value: row.handlingStatus },
        { label: '最终结果', value: resultLabel(row) },
        {
          label: '结束原因',
          value: row.handlingStatus === '已结束' ? skipReason(row) : row.handlingResult
        },
        { label: '核查方式', value: isManualRecognition ? '人工核查' : '系统识别' }
      ],
      tags: tagList([
        row.handlingStatus,
        resultLabel(row),
        isManualRecognition ? '人工核查' : '自动识别'
      ])
    }
  ]

  // 详情页只展示已发生、正在发生或具有解释价值的未触发节点；未开始节点保持隐藏。
  return nodes.filter((node) => node.status !== 'pending')
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}
