import type { EventAttributeEventType, EventOwnership } from '@/api/lad/system/types'

export interface MessageDescriptionSegment {
  text: string
  highlight?: boolean
}

export interface MessageCenterItem {
  id: string
  /** 与事件属性配置「事件ID」一致 */
  eventId: string
  /** 与事件属性配置「事件名称」一致 */
  eventName: string
  eventOwnership: EventOwnership
  eventType: EventAttributeEventType
  /** 消息推送时间 */
  pushedAt: string
  descriptionSegments: MessageDescriptionSegment[]
}

export interface MessageCenterQuery {
  pageIndex?: number
  pageSize?: number
  eventId?: string
  eventName?: string
  eventOwnership?: EventOwnership
  eventType?: EventAttributeEventType
  description?: string
  pushedAtStart?: string
  pushedAtEnd?: string
}

export interface MessageCenterListResult {
  list: MessageCenterItem[]
  total: number
}
