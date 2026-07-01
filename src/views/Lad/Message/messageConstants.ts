export const MESSAGE_SEARCH_COL = { span: 6 } as const
export const MESSAGE_SEARCH_DATE_COL = { span: 6 } as const

/** 消息中心事件名称（与处置五阶段 + 设备故障一致） */
export const MESSAGE_EVENT_NAME_OPTIONS = [
  { label: '目标发现', value: '目标发现' },
  { label: '威胁识别', value: '威胁识别' },
  { label: '威胁评估', value: '威胁评估' },
  { label: '处置执行', value: '处置执行' },
  { label: '目标结果', value: '目标结果' },
  { label: '设备故障', value: '设备故障' }
] as const

export type MessageEventCategory = (typeof MESSAGE_EVENT_NAME_OPTIONS)[number]['value']

export function formatMessagePushedAt(value?: string) {
  if (!value) return '-'
  const [date, time] = value.split(' ')
  if (!date || !time) return value
  return `${date.replace(/-/g, '.')} ${time}`
}

/** @deprecated 使用 formatMessagePushedAt */
export const formatMessageOccurredAt = formatMessagePushedAt
