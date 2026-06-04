import { SUCCESS_CODE } from '@/constants'
import type { ThreatLevel } from '@/api/lad/incident/types'
import type {
  BlackWhiteFormPayload,
  BlackWhiteListItem,
  BlackWhiteListQuery,
  BlackWhiteTargetDetail,
  BlackWhiteTargetListTypePayload,
  EntryMethod,
  ListType
} from '@/api/lad/list/types'

const timeout = 300

const listTypes: ListType[] = ['黑名单', '白名单', '未知']
const targetTypes = ['多旋翼', '固定翼', '未知', '行业级']
const models = ['DJI Mavic 3', 'DJI Mini 3 Pro', 'Autel EVO II', 'Parrot Anafi', '未知型号']
const frequencies = ['2.4GHz', '5.8GHz', '2.4GHz + 5.8GHz', '915MHz']
const zones = ['核心保护区-A区', '缓冲区-B区', '管制空域-C区', '公共区域']
const entryMethods: EntryMethod[] = ['自动录入', '人工录入', '自动+人工校验']
const validOptions = ['永久', '2026-12-31', '2025-06-30', '2024-12-31']

let allList: BlackWhiteListItem[] = Array.from({ length: 56 }, (_, i) => {
  const day = String(4 + (i % 20)).padStart(2, '0')
  const hour = String(8 + (i % 10)).padStart(2, '0')
  const min = String((i * 5) % 60).padStart(2, '0')
  const sec = String((i * 11) % 60).padStart(2, '0')
  const discovered = `2024-03-${day} ${hour}:${min}:${sec}`
  const updatedMin = (Number(min) + 3) % 60
  const updated = `2024-03-${day} ${hour}:${String(updatedMin).padStart(2, '0')}:${String((Number(sec) + 8) % 60).padStart(2, '0')}`
  const durationSec = 15 + (i % 120)
  const hasSn = i % 5 !== 0

  return {
    id: `bw-${10001 + i}`,
    targetId: `TG-2024-${String((i % 24) + 1).padStart(4, '0')}`,
    listType: listTypes[i % listTypes.length],
    targetType: targetTypes[i % targetTypes.length],
    validUntil: validOptions[i % validOptions.length],
    discoveredAt: discovered,
    updatedAt: updated,
    duration: `00:${String(Math.floor(durationSec / 60)).padStart(2, '0')}:${String(durationSec % 60).padStart(2, '0')}`,
    model: models[i % models.length],
    frequency: frequencies[i % frequencies.length],
    sn: hasSn ? `1581F4${String(100000 + i * 131).slice(0, 6)}` : '未解析',
    zoneName: zones[i % zones.length],
    longitude: Number((113.38 + (i % 30) * 0.008).toFixed(4)),
    latitude: Number((23.08 + (i % 25) * 0.006).toFixed(4)),
    entryMethod: entryMethods[i % entryMethods.length],
    remark: i % 8 === 0 ? '历史事件自动同步' : ''
  }
})

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}

function buildTargetDetail(row: BlackWhiteListItem): BlackWhiteTargetDetail {
  const seed = hashSeed(row.id)
  const threatByList: Record<ListType, ThreatLevel> = {
    黑名单: '高',
    白名单: '低',
    未知: seed % 2 === 0 ? '中' : '未知'
  }
  const alt = 80 + (seed % 80)
  const pilotLocated = seed % 5 !== 0
  const lng = row.longitude.toFixed(4)
  const lat = row.latitude.toFixed(4)
  const handlingStatus =
    row.listType === '白名单' ? '已关闭' : seed % 3 === 0 ? '待处置' : '处置中'

  let disposalDetail = ''
  if (handlingStatus !== '待处置') {
    disposalDetail =
      row.remark ||
      (row.listType === '白名单'
        ? '白名单目标，探测后自动过滤告警'
        : row.listType === '黑名单'
          ? '黑名单重点监控，待联动处置'
          : '—')
  }

  return {
    ...row,
    threatLevel: threatByList[row.listType],
    handlingStatus,
    lastPosition: `E:${lng}，N:${lat}（海拔${alt}m）`,
    pilotLocation: pilotLocated
      ? `E:${(row.longitude - 0.0014).toFixed(4)}，N:${(row.latitude - 0.0012).toFixed(4)}`
      : '未定位',
    pilotConfidence: pilotLocated ? `${72 + (seed % 23)}%` : '—',
    disposalDetail,
    lastObservedAt: row.updatedAt,
    pilotLocatedAt: pilotLocated ? row.updatedAt : '—',
    eventCount: 2 + (seed % 5)
  }
}

function filterList(params: BlackWhiteListQuery): BlackWhiteListItem[] {
  let rows = [...allList]
  if (params.listType) {
    rows = rows.filter((r) => r.listType === params.listType)
  }
  if (params.targetId?.trim()) {
    rows = rows.filter((r) => r.targetId.includes(params.targetId!.trim()))
  }
  if (params.sn?.trim()) {
    const kw = params.sn.trim().toLowerCase()
    rows = rows.filter((r) => r.sn.toLowerCase().includes(kw))
  }
  if (params.model?.trim()) {
    const kw = params.model.trim().toLowerCase()
    rows = rows.filter((r) => r.model.toLowerCase().includes(kw))
  }
  if (params.targetType) {
    rows = rows.filter((r) => r.targetType === params.targetType)
  }
  if (params.zoneName) {
    rows = rows.filter((r) => r.zoneName === params.zoneName)
  }
  if (params.entryMethod) {
    rows = rows.filter((r) => r.entryMethod === params.entryMethod)
  }
  if (params.discoveredAtStart) {
    rows = rows.filter((r) => r.discoveredAt >= params.discoveredAtStart!)
  }
  if (params.discoveredAtEnd) {
    rows = rows.filter((r) => r.discoveredAt <= `${params.discoveredAtEnd} 23:59:59`)
  }
  return rows
}

export default [
  {
    url: '/mock/lad/list/black-white',
    method: 'get',
    timeout,
    response: ({ query }: { query: BlackWhiteListQuery }) => {
      const pageIndex = Number(query.pageIndex) || 1
      const pageSize = Number(query.pageSize) || 10
      const filtered = filterList(query)
      const start = (pageIndex - 1) * pageSize
      return {
        code: SUCCESS_CODE,
        data: {
          list: filtered.slice(start, start + pageSize),
          total: filtered.length
        }
      }
    }
  },
  {
    url: '/mock/lad/list/black-white/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => {
      const ids = body?.ids || []
      allList = allList.filter((r) => !ids.includes(r.id))
      return { code: SUCCESS_CODE, data: true }
    }
  },
  {
    url: '/mock/lad/list/black-white/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id?: string } }) => {
      const row = allList.find((r) => r.id === query.id)
      if (!row) return { code: 500, message: '记录不存在' }
      return { code: SUCCESS_CODE, data: buildTargetDetail(row) }
    }
  },
  {
    url: '/mock/lad/list/black-white/list-type',
    method: 'post',
    timeout,
    response: ({ body }: { body: BlackWhiteTargetListTypePayload }) => {
      const idx = allList.findIndex((r) => r.id === body?.id)
      if (idx < 0) return { code: 500, message: '记录不存在' }
      allList[idx] = { ...allList[idx], listType: body.listType }
      return { code: SUCCESS_CODE, data: buildTargetDetail(allList[idx]) }
    }
  },
  {
    url: '/mock/lad/list/black-white/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: BlackWhiteFormPayload }) => {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

      if (body.id) {
        const idx = allList.findIndex((r) => r.id === body.id)
        if (idx < 0) return { code: 500, message: '记录不存在' }
        allList[idx] = {
          ...allList[idx],
          ...body,
          updatedAt: ts
        }
        return { code: SUCCESS_CODE, data: allList[idx] }
      }

      const row: BlackWhiteListItem = {
        id: `bw-${Date.now()}`,
        discoveredAt: ts,
        updatedAt: ts,
        duration: '00:00:00',
        ...body
      } as BlackWhiteListItem
      allList.unshift(row)
      return { code: SUCCESS_CODE, data: row }
    }
  }
]
