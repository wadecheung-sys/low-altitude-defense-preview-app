/** 威胁等级 */
export type ThreatLevel = '高' | '中' | '低' | '未知'

/** 处置状态 */
export type HandlingStatus = '待处置' | '处置中' | '已处置' | '已关闭' | '仅记录'

/** 人工确认结论 */
export type ManualConfirmResult = '真实入侵' | '飞鸟/误报' | '启动反制'

export type ManualConfirmStatus = '待人工确认' | ManualConfirmResult

/**
 * 历史事件（单次探测/飞行记录）
 *
 * 字段语义：
 * - 无人机 SN：被探测目标（无人机）的唯一识别码，基本信息，关联黑白名单
 * - 飞手位置：遥控端地理位置（无线电解析/TDOA），不是 SN
 */
export interface HistoryEventItem {
  id: string
  /** 融合目标 ID，多条事件可共用 */
  targetId: string
  relatedEventCount: number
  threatLevel: ThreatLevel
  handledAt: string
  discoveredAt: string
  endedAt: string
  abnormalDuration: string
  duration: string
  /** 飞手（遥控端）位置，TDOA/无线电解析等 */
  pilotLocation: string
  /** 无人机当时位置 */
  targetLocation: string
  /** 事件发生时所在区域 */
  zoneName: string
  /** 多源融合后的数据来源描述 */
  dataSource: string
  trajectoryFeature: string
  targetModel: string
  /** 无人机设备 SN（侦测解析），非飞手 SN */
  uavSn: string
  detectionDevice: string
  countermeasureDevice: string
  handlingResult: string
  handlingStatus: HandlingStatus
  manualConfirmStatus: ManualConfirmStatus
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
  /** 已定位 | 未定位 */
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
  remark?: string
}

/** 轨迹采样点（地图归一化坐标 0–1） */
export interface TrajectoryPoint {
  /** 相对事件时间轴进度 0–100 */
  progress: number
  x: number
  y: number
  altitude: number
}

/** 时间轴关键节点 */
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
  /** 设备发现 → 威胁识别 → 评估 → 处置 → 结果 */
  disposalTimeline: DisposalTimelineNode[]
  /** 飞手在地图上的归一化坐标 */
  pilotPos: { x: number; y: number }
  /** 探测设备点位 */
  devicePos: { x: number; y: number }
  trajectory: TrajectoryPoint[]
  markers: TrajectoryMarker[]
  /** 多源轨迹合并说明（演示） */
  trajectoryMergeNote?: string
}
