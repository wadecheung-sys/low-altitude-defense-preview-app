import type { ThreatLevelLabel } from '../threat/threatLevelUtils'

export type ThreatLevel = ThreatLevelLabel

export type HandlingStatus = '待处置' | '处置中' | '已处置' | '已结束'

export type ManualConfirmResult = '真实入侵' | '躁扰告警'

export type ManualConfirmStatus = ManualConfirmResult | `人工-${ManualConfirmResult}`

export type VerificationMethod = '自动识别' | '人工核查'

export interface ThreatAssessmentMetrics {
  speed: number
  stayDurationSec: number
  intrusionCount: number
  altitude: number
  swarmCount?: number
  signalStrength?: number
}

export interface PlanTriggerContextMetrics {
  temperature: number
  humidity: number
  windPower: number
  rainfall: number
  areaId: string
}

export type DisposalExecutionSource = 'plan' | 'manual' | 'none'

/** 历史事件列表「目标类型」 */
export type HistoryTargetType = '黑飞无人机' | '合作式无人机' | '躁扰信号-飞鸟'

export interface HistoryEventItem {
  id: string
  targetId: string
  relatedEventCount: number
  historyTargetType: HistoryTargetType
  threatLevel: ThreatLevel
  handledAt: string
  discoveredAt: string
  endedAt: string
  abnormalDuration: string
  duration: string
  pilotLocation: string
  targetLocation: string
  approachingDistance: string
  assessmentMetrics: ThreatAssessmentMetrics
  planTriggerContext: PlanTriggerContextMetrics
  zoneName: string
  dataSource: string
  trajectoryFeature: string
  targetModel: string
  uavSn: string
  detectionDevice: string
  countermeasureDevice: string
  disposalExecutionSource: DisposalExecutionSource
  manualDisposalAction?: string
  disposalOperator?: string
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
  verificationMethod?: VerificationMethod
  trajectoryFeature?: string
  detectionDevice?: string
  countermeasureDevice?: string
  listType?: HistoryEventItem['listType']
  historyTargetType?: HistoryTargetType
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
