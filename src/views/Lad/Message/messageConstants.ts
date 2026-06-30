import {
  buildEventAttributeSeedList,
  EVENT_OWNERSHIP_OPTIONS,
  getEventTypeSearchOptions
} from '@/api/lad/system/eventAttributeMessageAlign'

export const MESSAGE_SEARCH_COL = { span: 6 } as const
export const MESSAGE_SEARCH_DATE_COL = { span: 6 } as const

export const messageOwnershipOptions = EVENT_OWNERSHIP_OPTIONS.map((value) => ({
  label: value,
  value
}))

export const messageEventNameOptions = buildEventAttributeSeedList()
  .filter((item) => item.alarmEnabled)
  .map((item) => ({
    label: item.eventName,
    value: item.eventName
  }))

export { getEventTypeSearchOptions }

export function formatMessagePushedAt(value?: string) {
  if (!value) return '-'
  const [date, time] = value.split(' ')
  if (!date || !time) return value
  return `${date.replace(/-/g, '.')} ${time}`
}

/** @deprecated 使用 formatMessagePushedAt */
export const formatMessageOccurredAt = formatMessagePushedAt
