export type MessageEventName =
  | '无人机驱离'
  | '无人机消失'
  | '设备故障'
  | '噪扰告警'
  | '无人机入侵'
  | '无人机反制'

export interface MessageDescriptionSegment {
  text: string
  highlight?: boolean
}

export interface MessageCenterItem {
  id: string
  eventName: MessageEventName
  occurredAt: string
  descriptionSegments: MessageDescriptionSegment[]
}

export interface MessageCenterQuery {
  pageIndex?: number
  pageSize?: number
  eventName?: string
  description?: string
  occurredAtStart?: string
  occurredAtEnd?: string
}

export interface MessageCenterListResult {
  list: MessageCenterItem[]
  total: number
}
