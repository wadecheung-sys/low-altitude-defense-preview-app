import type { HistoryEventItem, ThreatLevel } from './types'

export type DisposalTimelineNodeStatus = 'done' | 'current' | 'pending' | 'skipped'

export type DisposalTimelineStageKey = 'discover' | 'threat' | 'assess' | 'dispose' | 'result'

export interface DisposalTimelineNode {
  key: DisposalTimelineStageKey
  title: string
  time: string
  status: DisposalTimelineNodeStatus
  summary: string
  detail?: string
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

function zoneThreatHint(zoneName: string, level: ThreatLevel): string {
  const isCore = zoneName.includes('核心') || zoneName.includes('管制')
  if (level === '高' && isCore) {
    return `目标进入“${zoneName}”高威胁区域，告警升级为高`
  }
  if (level === '高') return `威胁等级判定为高，所在区域：${zoneName}`
  if (level === '中') return `目标进入“${zoneName}”，威胁等级为中`
  return `目标在“${zoneName}”活动，威胁等级为${level}`
}

function nodeStatus(
  stageIndex: number,
  lastDoneIndex: number,
  pendingFrom: number
): DisposalTimelineNodeStatus {
  if (stageIndex <= lastDoneIndex) return 'done'
  if (stageIndex === pendingFrom) return 'current'
  if (stageIndex > pendingFrom) return 'pending'
  return 'done'
}

export function buildDisposalTimeline(row: HistoryEventItem): DisposalTimelineNode[] {
  const discovered = row.discoveredAt
  const threatAt = addSeconds(discovered, 8 + (hashSeed(row.id) % 12))
  const assessAt = addSeconds(threatAt, 5 + (hashSeed(row.id) % 8))
  const handled = row.handledAt && row.handledAt !== '--' ? row.handledAt : addSeconds(assessAt, 15)
  const ended = row.endedAt

  const pending =
    row.handlingStatus === '待处置'
      ? 2
      : row.handlingStatus === '已结束'
        ? 4
        : row.handlingStatus === '处置中'
          ? 3
          : 5

  const lastDone = pending - 1
  const isManualRecognition = row.manualConfirmStatus.startsWith('人工-')
  const recognitionResult = row.manualConfirmStatus.replace(/^人工-/, '')
  const confirmDetail =
    isManualRecognition && row.remark?.trim() ? `；人工确认备注：${row.remark}` : ''
  const confirmTag = isManualRecognition
    ? `人工确认：${recognitionResult}`
    : `自动识别：${recognitionResult}`

  const nodes: Omit<DisposalTimelineNode, 'status'>[] = [
    {
      key: 'discover',
      title: '设备发现',
      time: discovered,
      summary: `${row.detectionDevice} 捕获目标信号`,
      detail: `目标 ${row.targetId}（${row.targetModel}）首次入轨；数据源：${row.dataSource}`,
      tags: ['探测', row.uavSn !== '未解析' ? `SN ${row.uavSn}` : 'SN 未解析']
    },
    {
      key: 'threat',
      title: '威胁识别',
      time: threatAt,
      summary: zoneThreatHint(row.zoneName, row.threatLevel),
      detail:
        row.abnormalDuration !== '--'
          ? `异常行为持续 ${row.abnormalDuration}`
          : '未发现明显异常行为',
      tags: [row.zoneName, `威胁${row.threatLevel}`]
    },
    {
      key: 'assess',
      title: '威胁评估',
      time: assessAt,
      summary: isManualRecognition
        ? `人工确认完成，结论为“${recognitionResult}”`
        : `系统识别为“${recognitionResult}”，待值守人员复核`,
      detail: `建议处置：${row.handlingResult}${confirmDetail}`,
      tags: ['规则引擎', confirmTag]
    },
    {
      key: 'dispose',
      title: '处置执行',
      time: handled,
      summary:
        row.countermeasureDevice === '--'
          ? row.handlingStatus === '已结束'
            ? '未执行反制，事件已自然结束'
            : '持续监视，未下发反制'
          : `已下发处置：${row.countermeasureDevice}`,
      detail:
        recognitionResult === '真实入侵' && row.countermeasureDevice !== '--'
          ? `人工确认真实入侵后联动反制设备；执行结果：${row.handlingResult}${confirmDetail}`
          : row.handlingStatus === '已结束'
            ? `未执行反制动作；结束原因：${row.handlingResult}${confirmDetail}`
            : row.handlingStatus === '处置中'
              ? '处置指令已下发，正在执行中'
              : `设备执行结果：${row.handlingResult}${confirmDetail}`,
      tags: [row.handlingStatus, row.countermeasureDevice !== '--' ? '反制' : '监视']
    },
    {
      key: 'result',
      title: '处置结果',
      time: ended,
      summary: `${row.handlingResult}；状态：${row.handlingStatus}`,
      detail: isManualRecognition
        ? row.remark || `人工确认结果：${recognitionResult}`
        : row.remark || `自动识别结果：${recognitionResult}`,
      tags: [row.handlingResult, confirmTag]
    }
  ]

  const timeline = nodes.map((node, index) => ({
    ...node,
    status: nodeStatus(index, lastDone, pending)
  }))

  // 未完成的事件只展示已经发生或正在进行的阶段，避免详情页误呈现完整处置链。
  return pending < nodes.length ? timeline.filter((node) => node.status !== 'pending') : timeline
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}
