import type {
  DeviceFaultEventType,
  EventAlarmLevel,
  EventAttributeEventType,
  EventAttributeItem,
  EventOwnership
} from './types'

/** 七类事件归属 */
export const EVENT_OWNERSHIP_OPTIONS: EventOwnership[] = [
  '设备发现',
  '威胁识别',
  '威胁评估',
  '处置执行',
  '处置结果',
  '设备故障',
  '系统消息'
]

/** 「设备故障」归属下的事件类型 */
export const DEVICE_FAULT_EVENT_TYPES: DeviceFaultEventType[] = ['离线', '故障']

export function isDeviceFaultEventType(value: string): value is DeviceFaultEventType {
  return (DEVICE_FAULT_EVENT_TYPES as string[]).includes(value)
}

/** 各归属下可选的事件类型（与归纳文档一致） */
export const eventTypeOptionsByOwnership: Record<EventOwnership, EventAttributeEventType[]> = {
  设备发现: ['独立发现'],
  威胁识别: ['多源融合'],
  威胁评估: ['无危', '低危', '中危', '高危'],
  处置执行: ['人工处置', '自动处置'],
  处置结果: ['驱离/自离', '迫降', '打击'],
  设备故障: [...DEVICE_FAULT_EVENT_TYPES],
  系统消息: ['规则缺失']
}

/** 全部事件类型（筛选用） */
export const ALL_EVENT_ATTRIBUTE_EVENT_TYPES: EventAttributeEventType[] =
  EVENT_OWNERSHIP_OPTIONS.flatMap((ownership) => eventTypeOptionsByOwnership[ownership])

export function getEventTypeSearchOptions(
  eventOwnership?: EventOwnership
): { label: string; value: EventAttributeEventType }[] {
  const types = eventOwnership
    ? eventTypeOptionsByOwnership[eventOwnership]
    : ALL_EVENT_ATTRIBUTE_EVENT_TYPES
  return types.map((value) => ({ label: value, value }))
}

/** 事件类型 → 消息提示模板（占位符与归纳文档一致） */
export const EVENT_ATTRIBUTE_PROMPT_TEMPLATES: Record<EventAttributeEventType, string> = {
  独立发现: '{时间}{设备类型}{设备名称}{设备ID}发现无人机',
  多源融合: '{时间}根据多源数据融合成果，确认目标类型为{目标类型}',
  无危: '{时间}{目标型号}{目标ID}触发威胁评估原则{规则名称}，判定为无危',
  低危: '{时间}{目标型号}{目标ID}触发威胁评估原则{规则名称}，判定为低危',
  中危: '{时间}{目标型号}{目标ID}触发威胁评估原则{规则名称}，判定为中危',
  高危: '{时间}{目标型号}{目标ID}触发威胁评估原则{规则名称}，判定为高危',
  人工处置: '{时间}{目标型号}{目标ID}经由人工处置，执行{反制动作}，执行设备{设备名称}',
  自动处置: '{时间}{目标型号}{目标ID}命中预案规则{规则名称}，执行{反制动作}，执行设备{设备名称}',
  '驱离/自离': '{时间}{目标型号}{目标ID}于管制区{方位角}方向消失，全程逗留时间{逗留时间}',
  迫降: '{时间}{目标型号}{目标ID}于{经纬度}迫降，请及时处理',
  打击: '{时间}{目标型号}{目标ID}经反制打击，当前已无飞行特征信息',
  离线: '{时间}{设备类型}{设备名称}{设备ID}发生通信故障，当前离线',
  故障: '{时间}{设备类型}{设备名称}{设备ID}发生{故障类型}，请及时处理',
  规则缺失: '{时间}{目标型号}{目标ID}未命中任何评估规则，请设置兜底方案'
}

interface EventAttributeSeedMeta {
  eventOwnership: EventOwnership
  eventType: EventAttributeEventType
  eventId: string
  eventName: string
  alarmLevel: EventAlarmLevel
  priority: number
  alarmEnabled: boolean
  remark?: string
}

/** 种子数据：事件归属 → 事件类型 → 消息提示（事件名称/ID 为演示模拟） */
const EVENT_ATTRIBUTE_SEED_META: EventAttributeSeedMeta[] = [
  {
    eventOwnership: '设备发现',
    eventType: '独立发现',
    eventId: 'EVT-DISC-001',
    eventName: '探测设备独立发现',
    alarmLevel: '提示',
    priority: 150,
    alarmEnabled: true,
    remark: '单站/单设备首次发现目标。'
  },
  {
    eventOwnership: '威胁识别',
    eventType: '多源融合',
    eventId: 'EVT-IDEN-001',
    eventName: '多源融合识别确认',
    alarmLevel: '重要',
    priority: 240,
    alarmEnabled: true,
    remark: '融合雷达、光电、协议破解等成果确认目标类型。'
  },
  {
    eventOwnership: '威胁评估',
    eventType: '无危',
    eventId: 'EVT-EVAL-NONE',
    eventName: '威胁评估无危',
    alarmLevel: '提示',
    priority: 120,
    alarmEnabled: false,
    remark: '评估规则命中且判定无危，默认不推送告警。'
  },
  {
    eventOwnership: '威胁评估',
    eventType: '低危',
    eventId: 'EVT-EVAL-LOW',
    eventName: '威胁评估低危',
    alarmLevel: '重要',
    priority: 180,
    alarmEnabled: true
  },
  {
    eventOwnership: '威胁评估',
    eventType: '中危',
    eventId: 'EVT-EVAL-MID',
    eventName: '威胁评估中危',
    alarmLevel: '重要',
    priority: 220,
    alarmEnabled: true
  },
  {
    eventOwnership: '威胁评估',
    eventType: '高危',
    eventId: 'EVT-EVAL-HIGH',
    eventName: '威胁评估高危',
    alarmLevel: '紧急',
    priority: 280,
    alarmEnabled: true
  },
  {
    eventOwnership: '处置执行',
    eventType: '人工处置',
    eventId: 'EVT-EXEC-MAN',
    eventName: '人工反制执行',
    alarmLevel: '紧急',
    priority: 300,
    alarmEnabled: true,
    remark: '值班员人工确认后下发反制。'
  },
  {
    eventOwnership: '处置执行',
    eventType: '自动处置',
    eventId: 'EVT-EXEC-AUTO',
    eventName: '预案自动处置',
    alarmLevel: '紧急',
    priority: 290,
    alarmEnabled: true,
    remark: '命中预案规则后自动联动反制设备。'
  },
  {
    eventOwnership: '处置结果',
    eventType: '驱离/自离',
    eventId: 'EVT-RSLT-EXP',
    eventName: '目标驱离或自离',
    alarmLevel: '重要',
    priority: 260,
    alarmEnabled: true
  },
  {
    eventOwnership: '处置结果',
    eventType: '迫降',
    eventId: 'EVT-RSLT-LAND',
    eventName: '目标迫降落地',
    alarmLevel: '重要',
    priority: 255,
    alarmEnabled: true,
    remark: '反制迫降后需现场核查。'
  },
  {
    eventOwnership: '处置结果',
    eventType: '打击',
    eventId: 'EVT-RSLT-STK',
    eventName: '反制打击结束',
    alarmLevel: '重要',
    priority: 250,
    alarmEnabled: true
  },
  {
    eventOwnership: '设备故障',
    eventType: '离线',
    eventId: 'EVT-FAULT-OFF',
    eventName: '设备通信离线',
    alarmLevel: '重要',
    priority: 210,
    alarmEnabled: true,
    remark: '心跳丢失或链路中断。'
  },
  {
    eventOwnership: '设备故障',
    eventType: '故障',
    eventId: 'EVT-FAULT-ERR',
    eventName: '设备运行故障',
    alarmLevel: '重要',
    priority: 200,
    alarmEnabled: true,
    remark: '设备在线但自检失败或功能异常。'
  },
  {
    eventOwnership: '系统消息',
    eventType: '规则缺失',
    eventId: 'EVT-SYS-RULE',
    eventName: '评估规则缺失提醒',
    alarmLevel: '提示',
    priority: 160,
    alarmEnabled: true,
    remark: '未命中任何评估规则，提示配置兜底方案。'
  }
]

export function resolveEventOwnershipByEventType(
  eventType: EventAttributeEventType
): EventOwnership | undefined {
  for (const ownership of EVENT_OWNERSHIP_OPTIONS) {
    if (eventTypeOptionsByOwnership[ownership].includes(eventType)) {
      return ownership
    }
  }
  return undefined
}

export function resolveEventAttributePrompt(
  eventOwnership: EventOwnership,
  eventType: EventAttributeEventType
): string {
  const allowed = eventTypeOptionsByOwnership[eventOwnership]
  if (!allowed.includes(eventType)) return ''
  return EVENT_ATTRIBUTE_PROMPT_TEMPLATES[eventType]
}

export function suggestEventAttributeName(
  eventOwnership: EventOwnership,
  eventType: EventAttributeEventType
): string {
  const hit = EVENT_ATTRIBUTE_SEED_META.find(
    (item) => item.eventOwnership === eventOwnership && item.eventType === eventType
  )
  if (hit) return hit.eventName
  return `${eventOwnership}·${eventType}`
}

export function buildEventAttributeSeedList(
  updatedAt = '2026-06-30 10:00:00'
): EventAttributeItem[] {
  return EVENT_ATTRIBUTE_SEED_META.map((meta, index) => ({
    id: `ea-${String(index + 1).padStart(3, '0')}`,
    eventId: meta.eventId,
    eventName: meta.eventName,
    eventOwnership: meta.eventOwnership,
    eventType: meta.eventType,
    alarmEnabled: meta.alarmEnabled,
    alarmLevel: meta.alarmLevel,
    priority: meta.priority,
    messagePrompt: EVENT_ATTRIBUTE_PROMPT_TEMPLATES[meta.eventType],
    remark: meta.remark,
    updatedAt
  }))
}
