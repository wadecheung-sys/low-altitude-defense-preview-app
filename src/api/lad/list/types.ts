import type { HandlingStatus, ThreatLevel } from '@/api/lad/incident/types'

/** 名单类型 */
export type ListType = '黑名单' | '白名单' | '未知'

/** 录入方式 */
export type EntryMethod = '自动录入' | '人工录入' | '自动+人工校验'

/**
 * 黑白名单条目（无人机主数据，非单次飞行记录）
 */
export interface BlackWhiteListItem {
  id: string
  /** 融合/业务目标 ID */
  targetId: string
  listType: ListType
  targetType: string
  /** 永久 或 YYYY-MM-DD */
  validUntil: string
  discoveredAt: string
  updatedAt: string
  duration: string
  model: string
  frequency: string
  sn: string
  zoneName: string
  longitude: number
  latitude: number
  entryMethod: EntryMethod
  remark: string
}

export interface BlackWhiteListQuery {
  pageIndex?: number
  pageSize?: number
  listType?: ListType
  targetId?: string
  sn?: string
  model?: string
  targetType?: string
  zoneName?: string
  entryMethod?: EntryMethod
  discoveredAtStart?: string
  discoveredAtEnd?: string
}

export interface BlackWhiteListResult {
  list: BlackWhiteListItem[]
  total: number
}

export type BlackWhiteFormPayload = Pick<
  BlackWhiteListItem,
  | 'listType'
  | 'targetId'
  | 'targetType'
  | 'validUntil'
  | 'model'
  | 'frequency'
  | 'sn'
  | 'zoneName'
  | 'longitude'
  | 'latitude'
  | 'entryMethod'
  | 'remark'
> & { id?: string }

/**
 * 黑白名单「目标详情」— 融合无人机主数据 + 最近一次态势摘要
 *
 * - 主数据字段（型号、SN、名单类型等）相对稳定
 * - lastPosition / pilotLocation / disposalDetail 等取自最近一次关联历史事件，会随探测变化
 */
export interface BlackWhiteTargetDetail extends BlackWhiteListItem {
  threatLevel: ThreatLevel
  /** 汇总处置状态，界面「待处置」展示为「未处置」 */
  handlingStatus: HandlingStatus
  /** 无人机最后已知位置（最近一次探测） */
  lastPosition: string
  /** 飞手最后已知位置（最近一次无线电/TDOA 推算，非设备固定属性） */
  pilotLocation: string
  pilotConfidence: string
  /** 最近一次探测/更新时刻，态势摘要时间基准 */
  lastObservedAt: string
  /** 飞手位置推算时刻；未定位时为 — */
  pilotLocatedAt: string
  disposalDetail: string
  /** 关联历史事件条数 */
  eventCount: number
}

export interface BlackWhiteTargetListTypePayload {
  id: string
  listType: ListType
}
