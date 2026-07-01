import type { MessageEventCategory } from '@/views/Lad/Message/messageConstants'

export interface MessageDescriptionSegment {
  text: string
  highlight?: boolean
}

export interface MessageCenterItem {
  id: string
  eventName: MessageEventCategory
  pushedAt: string
  contentSegments: MessageDescriptionSegment[]
}

export interface MessageCenterQuery {
  pageIndex?: number
  pageSize?: number
  eventName?: MessageEventCategory | string
  content?: string
  pushedAtStart?: string
  pushedAtEnd?: string
}

export interface MessageCenterListResult {
  list: MessageCenterItem[]
  total: number
}
