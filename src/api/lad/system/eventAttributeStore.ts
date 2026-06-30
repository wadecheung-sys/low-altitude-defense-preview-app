import {
  buildEventAttributeSeedList,
  resolveEventAttributePrompt
} from './eventAttributeMessageAlign'
import type {
  EventAttributeItem,
  EventAttributeListResult,
  EventAttributeQuery,
  EventAttributeSavePayload
} from './types'
import type { EventAttributeEventType, EventOwnership } from './types'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}

const seed = buildEventAttributeSeedList()

export const EVENT_ATTRIBUTE_STORE_VERSION = 7

let allRows: EventAttributeItem[] = seed.map((item) => ({ ...item }))

function ensureStoreVersion() {
  const g = globalThis as { __ladEventAttributeStoreVer?: number }
  if (g.__ladEventAttributeStoreVer === EVENT_ATTRIBUTE_STORE_VERSION) return
  g.__ladEventAttributeStoreVer = EVENT_ATTRIBUTE_STORE_VERSION
  allRows = seed.map((item) => ({ ...item }))
}

ensureStoreVersion()

function nextId() {
  const nums = allRows
    .map((item) => Number(item.id.replace('ea-', '')))
    .filter((n) => !Number.isNaN(n))
  return `ea-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`
}

function filterRows(params: EventAttributeQuery) {
  let rows = [...allRows]
  if (params.eventId?.trim()) {
    const kw = params.eventId.trim().toLowerCase()
    rows = rows.filter((item) => item.eventId.toLowerCase().includes(kw))
  }
  if (params.eventName?.trim()) {
    const kw = params.eventName.trim().toLowerCase()
    rows = rows.filter((item) => item.eventName.toLowerCase().includes(kw))
  }
  if (params.eventOwnership) {
    rows = rows.filter((item) => item.eventOwnership === params.eventOwnership)
  }
  if (params.eventType) {
    rows = rows.filter((item) => item.eventType === params.eventType)
  }
  if (typeof params.alarmEnabled === 'boolean') {
    rows = rows.filter((item) => item.alarmEnabled === params.alarmEnabled)
  }
  return rows
}

export function queryEventAttributeList(params: EventAttributeQuery): EventAttributeListResult {
  ensureStoreVersion()
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const rows = filterRows(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: rows.slice(start, start + pageSize),
    total: rows.length
  }
}

export function getEventAttributeByEventName(eventName: string): EventAttributeItem | undefined {
  ensureStoreVersion()
  return allRows.find((item) => item.eventName === eventName)
}

export function getEventAttributeByOwnershipAndType(
  eventOwnership: EventOwnership,
  eventType: EventAttributeEventType
): EventAttributeItem | undefined {
  ensureStoreVersion()
  return allRows.find(
    (item) => item.eventOwnership === eventOwnership && item.eventType === eventType
  )
}

export function saveEventAttribute(payload: EventAttributeSavePayload): EventAttributeItem {
  ensureStoreVersion()
  const updatedAt = formatNow()
  const eventType = payload.eventType
  const messagePrompt =
    payload.messagePrompt.trim() ||
    resolveEventAttributePrompt(payload.eventOwnership, eventType) ||
    ''

  if (payload.id) {
    const index = allRows.findIndex((item) => item.id === payload.id)
    if (index < 0) throw new Error('事件属性不存在')
    const next: EventAttributeItem = {
      ...allRows[index],
      ...payload,
      eventId: payload.eventId.trim(),
      eventName: payload.eventName.trim(),
      eventType,
      messagePrompt,
      remark: payload.remark?.trim(),
      updatedAt
    }
    allRows[index] = next
    return { ...next }
  }

  const created: EventAttributeItem = {
    id: nextId(),
    eventId: payload.eventId.trim(),
    eventName: payload.eventName.trim(),
    eventOwnership: payload.eventOwnership,
    eventType,
    alarmEnabled: payload.alarmEnabled,
    alarmLevel: payload.alarmLevel,
    priority: payload.priority,
    messagePrompt,
    remark: payload.remark?.trim(),
    updatedAt
  }
  allRows = [created, ...allRows]
  return { ...created }
}

export function deleteEventAttribute(id: string) {
  ensureStoreVersion()
  allRows = allRows.filter((item) => item.id !== id)
}
