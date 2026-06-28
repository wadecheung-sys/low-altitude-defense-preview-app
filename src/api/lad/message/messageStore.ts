import type {
  MessageCenterItem,
  MessageCenterListResult,
  MessageCenterQuery,
  MessageDescriptionSegment
} from './types'

function seg(text: string, highlight = false): MessageDescriptionSegment {
  return highlight ? { text, highlight: true } : { text }
}

const baseSeed: Omit<MessageCenterItem, 'id'>[] = [
  {
    eventName: '无人机驱离',
    occurredAt: '2026-01-01 12:00:00',
    descriptionSegments: [
      seg('无人机'),
      seg('DJI Mavic 3', true),
      seg('通过'),
      seg('无线电干扰', true),
      seg('驱离')
    ]
  },
  {
    eventName: '无人机消失',
    occurredAt: '2026-01-01 11:42:18',
    descriptionSegments: [
      seg('无人机'),
      seg('DJI Air 3', true),
      seg('于监测阵地'),
      seg('东北 45°', true),
      seg('消失')
    ]
  },
  {
    eventName: '设备故障',
    occurredAt: '2026-01-01 11:15:06',
    descriptionSegments: [
      seg('雷达', true),
      seg('北区主雷达 R-200', true),
      seg('发生'),
      seg('离线', true),
      seg('，请及时处理')
    ]
  },
  {
    eventName: '噪扰告警',
    occurredAt: '2026-01-01 10:58:33',
    descriptionSegments: [
      seg('告警信号'),
      seg('T-8921', true),
      seg('已通过融合算法虚警过滤，目标判定为'),
      seg('飞鸟', true)
    ]
  },
  {
    eventName: '无人机入侵',
    occurredAt: '2026-01-01 10:30:00',
    descriptionSegments: [
      seg('黑名单', true),
      seg('DJI Matrice 300 RTK', true),
      seg('UAV-20260101001', true),
      seg('入侵'),
      seg('核心保护区', true),
      seg('核心区 A', true),
      seg('，请确认反制')
    ]
  },
  {
    eventName: '无人机反制',
    occurredAt: '2026-01-01 10:05:22',
    descriptionSegments: [
      seg('未知', true),
      seg('DJI Mini 4 Pro', true),
      seg('UAV-20260101002', true),
      seg('已被'),
      seg('干扰设备', true),
      seg('北区干扰站 1', true),
      seg('执行反制'),
      seg('激光打击', true)
    ]
  },
  {
    eventName: '无人机入侵',
    occurredAt: '2026-01-01 09:48:11',
    descriptionSegments: [
      seg('未知', true),
      seg('Autel EVO II', true),
      seg('UAV-20260101003', true),
      seg('入侵'),
      seg('缓冲区', true),
      seg('南门缓冲带', true),
      seg('，请确认反制')
    ]
  },
  {
    eventName: '无人机驱离',
    occurredAt: '2026-01-01 09:22:45',
    descriptionSegments: [
      seg('无人机'),
      seg('DJI Mavic 3T', true),
      seg('通过'),
      seg('导航诱骗', true),
      seg('驱离')
    ]
  },
  {
    eventName: '设备故障',
    occurredAt: '2026-01-01 08:56:02',
    descriptionSegments: [
      seg('无线电侦测', true),
      seg('南门侦测站 RF-03', true),
      seg('发生'),
      seg('数据中断', true),
      seg('，请及时处理')
    ]
  },
  {
    eventName: '噪扰告警',
    occurredAt: '2026-01-01 08:30:19',
    descriptionSegments: [
      seg('告警信号'),
      seg('T-7742', true),
      seg('已通过融合算法虚警过滤，目标判定为'),
      seg('地面杂波', true)
    ]
  },
  {
    eventName: '无人机反制',
    occurredAt: '2026-01-01 08:05:50',
    descriptionSegments: [
      seg('黑名单', true),
      seg('DJI Phantom 4 RTK', true),
      seg('UAV-20260101004', true),
      seg('已被'),
      seg('激光设备', true),
      seg('核心区激光站 L-01', true),
      seg('执行反制'),
      seg('激光打击', true)
    ]
  },
  {
    eventName: '无人机消失',
    occurredAt: '2026-01-01 07:40:08',
    descriptionSegments: [
      seg('无人机'),
      seg('DJI Mini 4 Pro', true),
      seg('于监测阵地'),
      seg('西南 120°', true),
      seg('消失')
    ]
  }
]

function buildSeed(): MessageCenterItem[] {
  const rows: MessageCenterItem[] = []
  for (let batch = 0; batch < 103; batch++) {
    baseSeed.forEach((item, index) => {
      const seq = batch * baseSeed.length + index + 1
      rows.push({
        id: `msg-${String(seq).padStart(4, '0')}`,
        eventName: item.eventName,
        occurredAt: item.occurredAt.replace(
          '2026-01-01',
          `2026-${String(Math.max(1, 12 - Math.floor(seq / 100))).padStart(2, '0')}-${String(
            ((seq % 28) + 1)
          ).padStart(2, '0')}`
        ),
        descriptionSegments: item.descriptionSegments.map((part) => ({ ...part }))
      })
    })
  }
  return rows.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
}

let allMessages: MessageCenterItem[] = buildSeed()

function filterMessages(query: MessageCenterQuery): MessageCenterItem[] {
  let rows = [...allMessages]
  if (query.eventName && query.eventName !== '全部') {
    rows = rows.filter((item) => item.eventName === query.eventName)
  }
  if (query.occurredAtStart) {
    rows = rows.filter((item) => item.occurredAt >= query.occurredAtStart!)
  }
  if (query.occurredAtEnd) {
    rows = rows.filter((item) => item.occurredAt <= query.occurredAtEnd!)
  }
  return rows
}

export function queryMessageCenterList(query: MessageCenterQuery): MessageCenterListResult {
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
  const set = new Set(ids)
  allMessages = allMessages.filter((item) => !set.has(item.id))
}
