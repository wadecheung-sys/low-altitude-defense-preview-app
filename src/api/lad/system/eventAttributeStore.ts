import type {
  EventAttributeItem,
  EventAttributeListResult,
  EventAttributeQuery,
  EventAttributeSavePayload
} from './types'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}

const seed: EventAttributeItem[] = [
  {
    id: 'ea-001',
    eventId: 'UAV-INV-001',
    eventName: '黑飞无人机入侵',
    eventOwnership: '无人机入侵',
    eventType: '黑飞无人机入侵',
    alarmEnabled: true,
    alarmLevel: '紧急',
    priority: 300,
    remark: '适用于非合作式、非品牌无人机闯入核心防护区的强告警场景。',
    updatedAt: '2026-06-22 08:30:00'
  },
  {
    id: 'ea-002',
    eventId: 'UAV-INV-002',
    eventName: '黑名单无人机入侵',
    eventOwnership: '无人机入侵',
    eventType: '黑名单无人机入侵',
    alarmEnabled: true,
    alarmLevel: '紧急',
    priority: 280,
    remark: '适用于已登记品牌无人机被纳入黑名单后的再入侵场景。',
    updatedAt: '2026-06-22 09:10:00'
  },
  {
    id: 'ea-003',
    eventId: 'UAV-INV-003',
    eventName: '合作式无人机入侵',
    eventOwnership: '无人机入侵',
    eventType: '无人机入侵',
    alarmEnabled: true,
    alarmLevel: '重要',
    priority: 220,
    remark: '适用于可识别品牌、合作式无人机未经授权进入限制空域的场景。',
    updatedAt: '2026-06-22 09:40:00'
  },
  {
    id: 'ea-004',
    eventId: 'DEV-ERR-001',
    eventName: '雷达设备离线',
    eventOwnership: '设备故障',
    eventType: '离线',
    alarmEnabled: true,
    alarmLevel: '重要',
    priority: 210,
    remark: '探测链路关键设备离线，影响区域感知完整性。',
    updatedAt: '2026-06-22 10:05:00'
  },
  {
    id: 'ea-005',
    eventId: 'DEV-ERR-002',
    eventName: '无线电设备离线',
    eventOwnership: '设备故障',
    eventType: '离线',
    alarmEnabled: true,
    alarmLevel: '重要',
    priority: 200,
    remark: '无线电侦测设备脱网或通信中断，需运维快速核查。',
    updatedAt: '2026-06-22 10:30:00'
  },
  {
    id: 'ea-006',
    eventId: 'DEV-ERR-003',
    eventName: '反制设备故障',
    eventOwnership: '设备故障',
    eventType: '故障',
    alarmEnabled: true,
    alarmLevel: '重要',
    priority: 190,
    remark: '反制设备自检失败或执行链路异常，可能影响联动处置。',
    updatedAt: '2026-06-22 10:45:00'
  },
  {
    id: 'ea-007',
    eventId: 'DEV-ERR-004',
    eventName: '融合节点数据中断',
    eventOwnership: '设备故障',
    eventType: '数据中断',
    alarmEnabled: true,
    alarmLevel: '提示',
    priority: 150,
    remark: '多源数据汇聚异常，需排查消息总线或节点状态。',
    updatedAt: '2026-06-22 11:00:00'
  },
  {
    id: 'ea-008',
    eventId: 'DEV-ERR-005',
    eventName: '光电设备供电异常',
    eventOwnership: '设备故障',
    eventType: '供电异常',
    alarmEnabled: true,
    alarmLevel: '重要',
    priority: 180,
    remark: '光电设备电源告警，可能导致复核画面缺失。',
    updatedAt: '2026-06-22 11:20:00'
  }
]

let allRows: EventAttributeItem[] = seed.map((item) => ({ ...item }))

function nextId() {
  const nums = allRows
    .map((item) => Number(item.id.replace('ea-', '')))
    .filter((n) => !Number.isNaN(n))
  return `ea-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`
}

function filterRows(params: EventAttributeQuery) {
  let rows = [...allRows]
  if (params.keyword?.trim()) {
    const keyword = params.keyword.trim().toLowerCase()
    rows = rows.filter(
      (item) =>
        item.eventId.toLowerCase().includes(keyword) ||
        item.eventName.toLowerCase().includes(keyword) ||
        item.eventType.toLowerCase().includes(keyword)
    )
  }
  if (params.eventOwnership) {
    rows = rows.filter((item) => item.eventOwnership === params.eventOwnership)
  }
  if (typeof params.alarmEnabled === 'boolean') {
    rows = rows.filter((item) => item.alarmEnabled === params.alarmEnabled)
  }
  return rows
}

export function queryEventAttributeList(params: EventAttributeQuery): EventAttributeListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const rows = filterRows(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: rows.slice(start, start + pageSize),
    total: rows.length
  }
}

export function saveEventAttribute(payload: EventAttributeSavePayload): EventAttributeItem {
  const updatedAt = formatNow()

  if (payload.id) {
    const index = allRows.findIndex((item) => item.id === payload.id)
    if (index < 0) throw new Error('事件属性不存在')
    const next: EventAttributeItem = {
      ...allRows[index],
      ...payload,
      eventId: payload.eventId.trim(),
      eventName: payload.eventName.trim(),
      eventType: payload.eventType.trim(),
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
    eventType: payload.eventType.trim(),
    alarmEnabled: payload.alarmEnabled,
    alarmLevel: payload.alarmLevel,
    priority: payload.priority,
    remark: payload.remark?.trim(),
    updatedAt
  }
  allRows = [created, ...allRows]
  return { ...created }
}

export function deleteEventAttribute(id: string) {
  allRows = allRows.filter((item) => item.id !== id)
}
