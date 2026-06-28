import { allOption } from '../shared/ladOptionConstants'

export const MESSAGE_SEARCH_COL = { span: 6 } as const
export const MESSAGE_SEARCH_DATE_COL = { span: 6 } as const

export const messageEventNameOptions = [
  allOption,
  { label: '无人机驱离', value: '无人机驱离' },
  { label: '无人机消失', value: '无人机消失' },
  { label: '设备故障', value: '设备故障' },
  { label: '噪扰告警', value: '噪扰告警' },
  { label: '无人机入侵', value: '无人机入侵' },
  { label: '无人机反制', value: '无人机反制' }
]

export function formatMessageOccurredAt(value?: string) {
  if (!value) return '-'
  const [date, time] = value.split(' ')
  if (!date || !time) return value
  return `${date.replace(/-/g, '.')} ${time}`
}
