import type { HistoryEventItem, ThreatLevel } from './types'

export type DisposalTimelineNodeStatus = 'done' | 'current' | 'pending' | 'skipped'

export type DisposalTimelineStageKey =
  | 'discover'
  | 'threat'
  | 'assess'
  | 'dispose'
  | 'result'

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
  if (!text?.trim() || text === '—') return null
  const d = new Date(text.replace(/-/g, '/'))
  return Number.isNaN(d.getTime()) ? null : d
}

function formatEventTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
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
    return `目标进入「${zoneName}」（高威胁区域），威胁等级升至「高」`
  }
  if (level === '高') {
    return `威胁等级判定为「高」，区域：${zoneName}`
  }
  if (level === '中') {
    return `进入「${zoneName}」，威胁等级「中」`
  }
  return `在「${zoneName}」内活动，威胁等级「${level}」`
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

/** 由飞行记录字段生成设备处置时间链（发现 → 威胁识别 → 评估 → 处置 → 结果） */
export function buildDisposalTimeline(row: HistoryEventItem): DisposalTimelineNode[] {
  const discovered = row.discoveredAt
  const threatAt = addSeconds(discovered, 8 + (hashSeed(row.id) % 12))
  const assessAt = addSeconds(threatAt, 5 + (hashSeed(row.id) % 8))
  const handled =
    row.handledAt && row.handledAt !== '—' ? row.handledAt : addSeconds(assessAt, 15)
  const ended = row.endedAt

  const pending =
    row.handlingStatus === '待处置'
      ? 2
      : row.handlingStatus === '仅记录'
        ? 4
        : row.handlingStatus === '处置中'
          ? 3
          : 5

  const lastDone = pending - 1

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
        row.abnormalDuration !== '—'
          ? `异常行为持续 ${row.abnormalDuration}；轨迹特征：${row.trajectoryFeature}`
          : `轨迹特征：${row.trajectoryFeature}`,
      tags: [row.zoneName, `威胁${row.threatLevel}`]
    },
    {
      key: 'assess',
      title: '威胁评估',
      time: assessAt,
      summary: '威胁规则命中，关联预案策略',
      detail: `人工确认：${row.manualConfirmStatus}；建议处置：${row.handlingResult}`,
      tags: ['规则引擎', row.manualConfirmStatus === '待人工确认' ? '待确认' : '已确认']
    },
    {
      key: 'dispose',
      title: '处置执行',
      time: handled,
      summary:
        row.countermeasureDevice === '—'
          ? '持续监视，未下发反制'
          : `下发处置：${row.countermeasureDevice}`,
      detail:
        row.handlingStatus === '处置中'
          ? '处置指令已下发，执行中'
          : `处置方式：${row.handlingResult}`,
      tags: [row.handlingStatus, row.countermeasureDevice !== '—' ? '反制' : '监视']
    },
    {
      key: 'result',
      title: '处置结果',
      time: ended,
      summary: `${row.handlingResult}；状态：${row.handlingStatus}`,
      detail: row.remark || '目标已脱离管制空域或事件归档',
      tags: [row.handlingResult]
    }
  ]

  return nodes.map((n, i) => ({
    ...n,
    status: nodeStatus(i, lastDone, pending)
  }))
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}
