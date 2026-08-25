import type { BlackWhiteTargetKind, BlackWhiteTargetKindFilter } from './listTargetKind'

/** 名单类型 */
export type ListType = '黑名单' | '白名单' | '未知'

/** 录入方式 */
export type EntryMethod = '自动录入' | '人工录入' | '自动+人工校验'

/**
 * 黑白名单条目（合作式无人机主数据，须具备有效识别码）
 */
export interface BlackWhiteListItem {
  id: string
  /** 融合/业务目标 ID */
  targetId: string
  listType: ListType
  /** 目标类型：黑飞 / 合作式（不含飞鸟躁扰） */
  historyTargetType: BlackWhiteTargetKind
  /** 目标机型：多旋翼、固定翼等 */
  targetType: string
  /** 永久 或 YYYY-MM-DD HH:mm:ss */
  validUntil: string
  discoveredAt: string
  updatedAt: string
  duration: string
  model: string
  frequency: string
  sn: string
  /** 所属单位（白名单扩展信息，非必填） */
  affiliatedUnit: string
  /** 使用人（白名单扩展信息，非必填） */
  userName: string
  /** 归属人（白名单扩展信息，非必填） */
  ownerName: string
  /** 联系方式（白名单扩展信息，非必填） */
  contactInfo: string
  entryMethod: EntryMethod
  remark: string
}

export interface BlackWhiteListQuery {
  pageIndex?: number
  pageSize?: number
  listType?: ListType
  sn?: string
  model?: string
  affiliatedUnit?: string
  userName?: string
  ownerName?: string
  contactInfo?: string
  historyTargetType?: BlackWhiteTargetKindFilter
  targetType?: string
  entryMethod?: EntryMethod
  discoveredAtStart?: string
  discoveredAtEnd?: string
  validUntilStart?: string
  validUntilEnd?: string
}

export interface BlackWhiteListResult {
  list: BlackWhiteListItem[]
  total: number
}

export type BlackWhiteFormPayload = Pick<
  BlackWhiteListItem,
  | 'listType'
  | 'historyTargetType'
  | 'targetType'
  | 'validUntil'
  | 'model'
  | 'frequency'
  | 'sn'
  | 'affiliatedUnit'
  | 'userName'
  | 'ownerName'
  | 'contactInfo'
  | 'entryMethod'
  | 'remark'
> & { id?: string; targetId?: string }

/**
 * 黑白名单「无人机详情」仅保留设备名单属性；飞行态势从关联历史事件实时查询。
 */
export interface BlackWhiteTargetDetail extends BlackWhiteListItem {
  /** 关联历史事件条数 */
  eventCount: number
}

export interface BlackWhiteTargetListTypePayload {
  id: string
  listType: '黑名单' | '白名单'
}
