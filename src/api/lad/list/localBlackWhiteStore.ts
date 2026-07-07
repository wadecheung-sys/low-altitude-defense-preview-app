import type { ThreatLevel } from '@/api/lad/incident/types'
import { isHandlingEnded } from '@/api/lad/incident/handlingStatusUtils'
import type {
  BlackWhiteFormPayload,
  BlackWhiteListItem,
  BlackWhiteListQuery,
  BlackWhiteListResult,
  BlackWhiteTargetDetail,
  BlackWhiteTargetListTypePayload,
  EntryMethod,
  ListType
} from './types'
import { LAD_TARGET_MODELS } from '@/constants/ladTargetModels'
import {
  COOPERATIVE_DRONE_KIND,
  enrichManagedBlackWhiteListItem,
  hasResolvableSn,
  normalizeCooperativeBlackWhiteFields
} from './listTargetKind'
import { matchValidUntilRange, normalizeValidUntil } from './validUntilUtils'

const listTypes: ListType[] = ['黑名单', '白名单']
const targetTypes = ['多旋翼', '固定翼', '行业级']
const models = LAD_TARGET_MODELS.filter((item) => item !== '蜂群目标' && item !== '其他')
const frequencies = ['2.4GHz', '5.8GHz', '2.4GHz + 5.8GHz', '915MHz']
const zones = ['核心保护区-A区', '缓冲区-B区', '管制空域-C区', '公共区域']
const entryMethods: EntryMethod[] = ['自动录入', '人工录入', '自动+人工校验']
const validOptions = [
  '永久',
  '2026-12-31 23:59:59',
  '2025-06-30 18:00:00',
  '2024-12-31 08:30:00'
]

function buildCooperativeSn(index: number) {
  return `1581F4${String(100000 + index * 131).padStart(6, '0')}`
}

function buildSeedList(): BlackWhiteListItem[] {
  return Array.from({ length: 56 }, (_, i) => {
    const day = String(4 + (i % 20)).padStart(2, '0')
    const hour = String(8 + (i % 10)).padStart(2, '0')
    const min = String((i * 5) % 60).padStart(2, '0')
    const sec = String((i * 11) % 60).padStart(2, '0')
    const discovered = `2024-03-${day} ${hour}:${min}:${sec}`
    const updatedMin = (Number(min) + 3) % 60
    const updated = `2024-03-${day} ${hour}:${String(updatedMin).padStart(2, '0')}:${String((Number(sec) + 8) % 60).padStart(2, '0')}`
    const durationSec = 15 + (i % 120)

    return normalizeCooperativeBlackWhiteFields({
      id: `bw-${10001 + i}`,
      targetId: `TG-2024-${String((i % 24) + 1).padStart(4, '0')}`,
      listType: listTypes[i % listTypes.length],
      historyTargetType: COOPERATIVE_DRONE_KIND,
      targetType: targetTypes[i % targetTypes.length],
      validUntil: normalizeValidUntil(validOptions[i % validOptions.length]),
      discoveredAt: discovered,
      updatedAt: updated,
      duration: `00:${String(Math.floor(durationSec / 60)).padStart(2, '0')}:${String(durationSec % 60).padStart(2, '0')}`,
      model: models[i % models.length],
      frequency: frequencies[i % frequencies.length],
      sn: buildCooperativeSn(i),
      zoneName: zones[i % zones.length],
      longitude: Number((113.38 + (i % 30) * 0.008).toFixed(4)),
      latitude: Number((23.08 + (i % 25) * 0.006).toFixed(4)),
      entryMethod: entryMethods[i % entryMethods.length],
      remark: i % 8 === 0 ? '历史事件自动同步' : ''
    })
  }).filter((row) => hasResolvableSn(row.sn))
}

export const BLACK_WHITE_STORE_VERSION = 5

function ensureStoreVersion() {
  const g = globalThis as { __ladBlackWhiteStoreVer?: number }
  if (g.__ladBlackWhiteStoreVer === BLACK_WHITE_STORE_VERSION) return
  g.__ladBlackWhiteStoreVer = BLACK_WHITE_STORE_VERSION
  allList = buildSeedList()
}

function migrateAllRows() {
  allList = allList
    .map((row) => enrichManagedBlackWhiteListItem(row))
    .filter((row): row is BlackWhiteListItem => row !== null && hasResolvableSn(row.sn))
}

let allList: BlackWhiteListItem[] = buildSeedList()
ensureStoreVersion()
migrateAllRows()

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}

function buildTargetDetail(row: BlackWhiteListItem): BlackWhiteTargetDetail {
  const seed = hashSeed(row.id)
  const threatByList: Record<'黑名单' | '白名单', ThreatLevel> = {
    黑名单: '高危',
    白名单: '低危'
  }
  const listType = row.listType === '白名单' ? '白名单' : '黑名单'
  const alt = 80 + (seed % 80)
  const pilotLocated = seed % 5 !== 0
  const lng = row.longitude.toFixed(4)
  const lat = row.latitude.toFixed(4)
  const handlingStatus = listType === '白名单' ? '已结束' : '进行中'

  let disposalDetail = ''
  if (isHandlingEnded(handlingStatus)) {
    disposalDetail =
      row.remark ||
      (listType === '白名单'
        ? '白名单目标，探测后自动过滤告警'
        : '黑名单重点监控，待联动处置')
  }

  return {
    ...row,
    listType,
    historyTargetType: COOPERATIVE_DRONE_KIND,
    threatLevel: threatByList[listType],
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
  let rows = allList
    .map((row) => enrichManagedBlackWhiteListItem(row))
    .filter((row): row is BlackWhiteListItem => row !== null && hasResolvableSn(row.sn))
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
  if (params.validUntilStart || params.validUntilEnd) {
    rows = rows.filter((r) =>
      matchValidUntilRange(r.validUntil, params.validUntilStart, params.validUntilEnd)
    )
  }
  return rows
}

export function queryLocalBlackWhiteList(params: BlackWhiteListQuery): BlackWhiteListResult {
  ensureStoreVersion()
  migrateAllRows()
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const filtered = filterList(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length
  }
}

export function getLocalBlackWhiteDetail(id: string): BlackWhiteTargetDetail | null {
  ensureStoreVersion()
  migrateAllRows()
  const row = allList.find((item) => item.id === id)
  const managed = row ? enrichManagedBlackWhiteListItem(row) : null
  return managed ? buildTargetDetail(managed) : null
}

export function deleteLocalBlackWhite(ids: string[]) {
  allList = allList.filter((row) => !ids.includes(row.id))
  return true
}

export function updateLocalBlackWhiteListType(
  payload: BlackWhiteTargetListTypePayload
): BlackWhiteTargetDetail | null {
  const idx = allList.findIndex((row) => row.id === payload.id)
  if (idx < 0) return null
  const managed = enrichManagedBlackWhiteListItem(allList[idx])
  if (!managed) return null
  if (payload.listType !== '黑名单' && payload.listType !== '白名单') {
    return null
  }
  allList[idx] = {
    ...allList[idx],
    listType: payload.listType,
    updatedAt: formatTimestamp(new Date())
  }
  return buildTargetDetail(allList[idx])
}

export function syncLocalBlackWhiteListType(
  targets: Array<{ targetId: string; targetModel: string; uavSn: string }>,
  listType: Exclude<ListType, '未知'>
) {
  const ts = formatTimestamp(new Date())
  targets.forEach((target) => {
    if (!hasResolvableSn(target.uavSn)) return

    const rows = allList.filter(
      (row) => row.targetId === target.targetId || row.sn === target.uavSn.trim()
    )
    if (rows.length) {
      rows.forEach((row) => {
        const managed = enrichManagedBlackWhiteListItem(row)
        if (!managed) return
        row.listType = listType
        row.historyTargetType = COOPERATIVE_DRONE_KIND
        row.updatedAt = ts
      })
      return
    }

    const base = normalizeCooperativeBlackWhiteFields({
      targetId: target.targetId,
      listType,
      historyTargetType: COOPERATIVE_DRONE_KIND,
      targetType: '多旋翼',
      validUntil: '永久',
      discoveredAt: ts,
      updatedAt: ts,
      duration: '00:00:00',
      model: target.targetModel,
      frequency: '2.4GHz',
      sn: target.uavSn.trim(),
      zoneName: '',
      longitude: 0,
      latitude: 0,
      entryMethod: '人工录入',
      remark: '由历史事件批量设置'
    })

    allList.unshift({
      id: `bw-${Date.now()}-${target.targetId}`,
      ...base
    } as BlackWhiteListItem)
  })
}

export function saveLocalBlackWhite(payload: BlackWhiteFormPayload): BlackWhiteListItem {
  const ts = formatTimestamp(new Date())
  const normalized = normalizeCooperativeBlackWhiteFields({
    ...payload,
    historyTargetType: COOPERATIVE_DRONE_KIND,
    validUntil: normalizeValidUntil(payload.validUntil || '永久')
  })

  if (!normalized.sn || normalized.sn === '未解析') {
    throw new Error('请填写有效识别码')
  }

  if (payload.id) {
    const idx = allList.findIndex((row) => row.id === payload.id)
    if (idx < 0) {
      throw new Error('记录不存在')
    }
    allList[idx] = {
      ...allList[idx],
      ...normalized,
      updatedAt: ts
    }
    return allList[idx]
  }

  const row: BlackWhiteListItem = {
    id: `bw-${Date.now()}`,
    discoveredAt: ts,
    updatedAt: ts,
    duration: '00:00:00',
    ...normalized
  }
  allList.unshift(row)
  return row
}
