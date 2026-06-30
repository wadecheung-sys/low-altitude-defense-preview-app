import { buildEventAttributeSeedList } from '@/api/lad/system/eventAttributeMessageAlign'
import { buildMessageCenterSeed } from './buildMessageSeed'
import { messageDescriptionText } from './messageTemplateRender'
import type {
  MessageCenterItem,
  MessageCenterListResult,
  MessageCenterQuery
} from './types'

/** 递增以清空旧版消息数据并重新生成 */
export const MESSAGE_STORE_VERSION = 3

let allMessages: MessageCenterItem[] = []

function resetStore() {
  allMessages = buildMessageCenterSeed()
}

function ensureStoreVersion() {
  const g = globalThis as { __ladMessageStoreVer?: number }
  if (g.__ladMessageStoreVer === MESSAGE_STORE_VERSION && allMessages.length) return
  g.__ladMessageStoreVer = MESSAGE_STORE_VERSION
  resetStore()
}

ensureStoreVersion()

export function isNewFormatMessageList(list: unknown[] | undefined): boolean {
  if (!list?.length) return false
  const first = list[0] as Partial<MessageCenterItem>
  return Boolean(first.eventId && first.eventOwnership && first.eventType && first.pushedAt)
}

function filterMessages(query: MessageCenterQuery): MessageCenterItem[] {
  let rows = [...allMessages]

  if (query.eventId?.trim()) {
    const kw = query.eventId.trim().toLowerCase()
    rows = rows.filter((item) => item.eventId.toLowerCase().includes(kw))
  }
  if (query.eventName?.trim()) {
    const kw = query.eventName.trim().toLowerCase()
    rows = rows.filter((item) => item.eventName.toLowerCase().includes(kw))
  }
  if (query.eventOwnership) {
    rows = rows.filter((item) => item.eventOwnership === query.eventOwnership)
  }
  if (query.eventType) {
    rows = rows.filter((item) => item.eventType === query.eventType)
  }
  if (query.description?.trim()) {
    const keyword = query.description.trim().toLowerCase()
    rows = rows.filter((item) =>
      messageDescriptionText(item.descriptionSegments).toLowerCase().includes(keyword)
    )
  }
  if (query.pushedAtStart) {
    rows = rows.filter((item) => item.pushedAt >= query.pushedAtStart!)
  }
  if (query.pushedAtEnd) {
    rows = rows.filter((item) => item.pushedAt <= query.pushedAtEnd!)
  }

  return rows
}

export function queryMessageCenterList(query: MessageCenterQuery): MessageCenterListResult {
  ensureStoreVersion()
  const pageIndex = Number(query.pageIndex) || 1
  const pageSize = Number(query.pageSize) || 10
  const rows = filterMessages(query)
  const start = (pageIndex - 1) * pageSize
  return {
    list: rows.slice(start, start + pageSize),
    total: rows.length
  }
}

export function deleteMessageCenterItems(ids: string[]) {
  ensureStoreVersion()
  const set = new Set(ids)
  allMessages = allMessages.filter((item) => !set.has(item.id))
}

/** 可推送消息中心的事件属性（开启告警） */
export function listAlarmEnabledEventAttributes() {
  return buildEventAttributeSeedList().filter((item) => item.alarmEnabled)
}
