import {
  DEVICE_FAULT_EVENT_TYPES,
  EVENT_OWNERSHIP_OPTIONS,
  EVENT_ATTRIBUTE_PROMPT_TEMPLATES,
  eventTypeOptionsByOwnership,
  getEventTypeSearchOptions,
  resolveEventAttributePrompt,
  suggestEventAttributeName
} from '@/api/lad/system/eventAttributeMessageAlign'

export const UI = {
  messageDescription: '消息描述',
  messageDescriptionPlaceholder: '如：{时间}{设备类型}{设备名称}{设备ID}发现无人机',
  messageDescriptionHintPrefix: '由{}括起来的文字为可变参数，'
} as const

export {
  DEVICE_FAULT_EVENT_TYPES,
  EVENT_OWNERSHIP_OPTIONS,
  EVENT_ATTRIBUTE_PROMPT_TEMPLATES,
  eventTypeOptionsByOwnership,
  getEventTypeSearchOptions,
  resolveEventAttributePrompt,
  suggestEventAttributeName
}
