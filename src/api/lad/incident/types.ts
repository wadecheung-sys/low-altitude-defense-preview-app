export type ThreatLevel = '高' | '中' | '低' | '未知'

export type HandlingStatus = '待处置' | '处置中' | '已处置' | '已关闭' | '仅记录'

export type ManualConfirmResult = '真实入侵' | '躁扰告警'

export type ManualConfirmStatus = ManualConfirmResult | `人工-${ManualConfirmResult}`

export interface HistoryEventItem {
  id: string
  targetId: string
  relatedEventCount: number
  threatLevel: ThreatLevel
  handledAt: string
  discoveredAt: string
  endedAt: string
  abnormalDuration: string
  duration: string
  pilotLocation: string
  targetLocation: string
  zoneName: string
  dataSource: string
  trajectoryFeature: string
  targetModel: string
  uavSn: string
  detectionDevice: string
  countermeasureDevice: string
  handlingResult: string
  handlingStatus: HandlingStatus
  manualConfirmStatus: ManualConfirmStatus
  listType: '黑名单' | '白名单' | '未知'
  remark: string
}

export interface HistoryEventQuery {
  pageIndex?: number
  pageSize?: number
  targetModel?: string
  uavSn?: string
  targetId?: string
  threatLevel?: ThreatLevel
  handlingStatus?: HandlingStatus
  manualConfirmStatus?: ManualConfirmStatus
  trajectoryFeature?: string
  detectionDevice?: string
  countermeasureDevice?: string
  handlingResult?: string
  pilotLocated?: '已定位' | '未定位'
  discoveredAtStart?: string
  discoveredAtEnd?: string
  zoneName?: string
  dataSource?: string
}

export interface HistoryEventListResult {
  list: HistoryEventItem[]
  total: number
}

export interface ManualConfirmPayload {
  id: string
  result: ManualConfirmResult
  threatLevel?: ThreatLevel
  nuisanceType?: string
  remark?: string
}

export interface HistoryEventListTypePayload {
  ids: string[]
  listType: '黑名单' | '白名单'
}

export interface TrajectoryPoint {
  progress: number
  x: number
  y: number
  altitude: number
}

export interface TrajectoryMarker {
  key: 'discover' | 'handle' | 'clear'
  label: string
  progress: number
  time: string
}

import type { DisposalTimelineNode } from './disposalTimeline'

export type {
  DisposalTimelineNode,
  DisposalTimelineNodeStatus,
  DisposalTimelineStageKey
} from './disposalTimeline'

export interface HistoryEventDetail extends HistoryEventItem {
  pilotConfidence: string
  zoneName: string
  frequencyInfo: string
  targetType: string
  disposalDetail: string
  disposalTimeline: DisposalTimelineNode[]
  pilotPos: { x: number; y: number }
  devicePos: { x: number; y: number }
  trajectory: TrajectoryPoint[]
  markers: TrajectoryMarker[]
  trajectoryMergeNote?: string
}
