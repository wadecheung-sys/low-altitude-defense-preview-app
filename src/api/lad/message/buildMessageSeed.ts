import {
  EVENT_ATTRIBUTE_PROMPT_TEMPLATES,
  buildEventAttributeSeedList
} from '@/api/lad/system/eventAttributeMessageAlign'
import { MESSAGE_PLACEHOLDER_SAMPLES } from './messageSeedSamples'
import { renderMessageDescriptionSegments } from './messageTemplateRender'
import type { MessageCenterItem } from './types'

function shiftPushedAt(baseTime: string, dayOffset: number): string {
  const date = new Date(baseTime.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return baseTime
  date.setDate(date.getDate() + dayOffset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 基于事件属性配置（仅开启告警项）生成消息中心种子 */
export function buildMessageCenterSeed(): MessageCenterItem[] {
  const prototypes: Omit<MessageCenterItem, 'id'>[] = []

  for (const attr of buildEventAttributeSeedList()) {
    if (!attr.alarmEnabled) continue

    const template = EVENT_ATTRIBUTE_PROMPT_TEMPLATES[attr.eventType]
    const samples = MESSAGE_PLACEHOLDER_SAMPLES[attr.eventType]

    samples.forEach((values) => {
      prototypes.push({
        eventId: attr.eventId,
        eventName: attr.eventName,
        eventOwnership: attr.eventOwnership,
        eventType: attr.eventType,
        pushedAt: values['时间'],
        descriptionSegments: renderMessageDescriptionSegments(template, values)
      })
    })
  }

  const rows: MessageCenterItem[] = []
  const repeatBatches = 24

  for (let batch = 0; batch < repeatBatches; batch++) {
    prototypes.forEach((item, index) => {
      const seq = batch * prototypes.length + index + 1
      rows.push({
        id: `msg-${String(seq).padStart(4, '0')}`,
        eventId: item.eventId,
        eventName: item.eventName,
        eventOwnership: item.eventOwnership,
        eventType: item.eventType,
        pushedAt: shiftPushedAt(item.pushedAt, batch * 2 + (index % 3)),
        descriptionSegments: item.descriptionSegments.map((part) => ({ ...part }))
      })
    })
  }

  return rows.sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1))
}
