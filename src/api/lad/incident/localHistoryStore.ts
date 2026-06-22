import { buildDisposalTimeline } from './disposalTimeline'
import { syncLocalBlackWhiteListType } from '@/api/lad/list/localBlackWhiteStore'
import type {
  HistoryEventDetail,
  HistoryEventItem,
  HistoryEventListResult,
  HistoryEventQuery,
  ManualConfirmPayload,
  ManualConfirmResult,
  ThreatLevel,
  TrajectoryPoint
} from './types'

const models = ['DJI Mavic 3', 'DJI Mini 3 Pro', 'Autel EVO II', 'Parrot Anafi', '未知型号']
const trajectories = ['直线逼近', '盘旋', '悬停', '快速穿越', '不规则']
const threatLevels: ThreatLevel[] = ['高', '中', '低', '未知']
const handlingResults = ['驱离成功', '迫降成功', '激光打击成功', '无线电压制成功']
const detectionDevices = ['雷达-01 (2.4G)', '无线电-02', '雷达-03 (5.8G)', '光电-01', '融合节点-A']
const zones = ['核心防护区A区', '缓冲区B区', '管制空域C区', '公共区域']
const dataSources = ['雷达+无线电融合', '雷达单源', '无线电侦测', '光电跟踪', '多源融合节点']
const countermeasures = ['干扰-01 (自动)', '--', '诱骗-02', '干扰-01 (人工)', '激光-01 (待命)']

const TARGET_COUNT = 24
const LIST_TYPE_STORAGE_KEY = 'lad-history-event-list-types'

const targetProfiles = Array.from({ length: TARGET_COUNT }, (_, index) => {
  const hasUavSn = index % 4 !== 0
  return {
    targetId: `TG-2024-${String(index + 1).padStart(4, '0')}`,
    uavSn: hasUavSn ? `1581F4${String(100000 + index * 137).slice(0, 6)}` : '未解析',
    targetModel: models[index % models.length],
    eventCount: 2 + (index % 4)
  }
})

function buildSeedList() {
  const list: HistoryEventItem[] = []
  let seq = 0

  targetProfiles.forEach((profile) => {
    for (let eventIndex = 0; eventIndex < profile.eventCount; eventIndex++) {
      const i = seq++
      const day = String(4 + (i % 5)).padStart(2, '0')
      const hour = String(8 + (i % 12)).padStart(2, '0')
      const min = String((i * 3) % 60).padStart(2, '0')
      const sec = String((i * 7) % 60).padStart(2, '0')
      const discovered = `2024-03-${day} ${hour}:${min}:${sec}`
      const durationSec = 20 + (i % 90)
      const endMin = Number(min) + Math.floor(durationSec / 60)
      const endSec = (Number(sec) + durationSec) % 60
      const ended = `2024-03-${day} ${hour}:${String(endMin).padStart(2, '0')}:${String(endSec).padStart(2, '0')}`
      const handled = `2024-03-${day} ${hour}:${String(endMin).padStart(2, '0')}:${String((endSec + 5) % 60).padStart(2, '0')}`
      const lng = (113.39 + (i % 20) * 0.01).toFixed(2)
      const lat = (23.09 + (i % 15) * 0.01).toFixed(2)
      const abnormalSec = i % 3 === 0 ? 8 + (i % 40) : 0
      const keepOpen = i < 4
      const forceDisposed = i === 8 || i === 9

      list.push({
        id: `he-${10001 + i}`,
        targetId: profile.targetId,
        relatedEventCount: profile.eventCount,
        threatLevel: threatLevels[i % threatLevels.length],
        handledAt: keepOpen ? '--' : handled,
        discoveredAt: discovered,
        endedAt: ended,
        abnormalDuration:
          abnormalSec > 0
            ? `00:${String(Math.floor(abnormalSec / 60)).padStart(2, '0')}:${String(abnormalSec % 60).padStart(2, '0')}`
            : '--',
        duration: `00:${String(Math.floor(durationSec / 60)).padStart(2, '0')}:${String(durationSec % 60).padStart(2, '0')}`,
        pilotLocation: '未定位',
        targetLocation: `E:${lng} N:${lat}`,
        zoneName: zones[i % zones.length],
        dataSource: dataSources[i % dataSources.length],
        trajectoryFeature: trajectories[i % trajectories.length],
        targetModel: profile.targetModel,
        uavSn: profile.uavSn,
        detectionDevice: detectionDevices[i % detectionDevices.length],
        countermeasureDevice: keepOpen ? '--' : countermeasures[i % countermeasures.length],
        handlingResult: keepOpen ? '待执行' : handlingResults[i % handlingResults.length],
        handlingStatus: forceDisposed
          ? '已处置'
          : keepOpen
            ? i < 2
              ? '待处置'
              : '处置中'
            : '已处置',
        manualConfirmStatus: i % 5 === 0 ? '躁扰告警' : '真实入侵',
        listType: '未知',
        remark: keepOpen ? '等待值守人员人工确认' : i % 7 === 0 ? '多源轨迹已合并' : ''
      })
    }
  })

  return list
}

function readStoredListTypes(): Record<string, HistoryEventItem['listType']> {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LIST_TYPE_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistListTypes() {
  if (typeof localStorage === 'undefined') return
  const values = Object.fromEntries(allList.map((row) => [row.id, row.listType]))
  localStorage.setItem(LIST_TYPE_STORAGE_KEY, JSON.stringify(values))
}

const storedListTypes = readStoredListTypes()
let allList: HistoryEventItem[] = buildSeedList().map((row) => ({
  ...row,
  listType: storedListTypes[row.id] || row.listType || '未知'
}))

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function updateRelatedEventCount() {
  allList.forEach((row) => {
    row.relatedEventCount = allList.filter((item) => item.targetId === row.targetId).length
  })
}

function applyConfirm(
  row: HistoryEventItem,
  result: ManualConfirmResult,
  threatLevel: ThreatLevel = '未知',
  nuisanceType?: string,
  remark?: string
) {
  const now = formatTimestamp(new Date())
  row.manualConfirmStatus = `人工-${result}`
  row.handledAt = now
  row.endedAt = row.endedAt === '--' ? now : row.endedAt

  if (result === '真实入侵') {
    row.threatLevel = threatLevel
    if (threatLevel === '低') {
      row.handlingStatus = '处置中'
      row.handlingResult = '自动监控中'
      row.countermeasureDevice = '光电-01 (自动)'
    } else if (threatLevel === '中') {
      row.handlingStatus = '已处置'
      row.handlingResult = '驱离成功'
      row.countermeasureDevice = '干扰-01 (自动)'
    } else if (threatLevel === '高') {
      row.handlingStatus = '已处置'
      row.handlingResult = '激光打击成功'
      row.countermeasureDevice = '激光-01 (自动)'
    } else {
      row.handlingStatus = '待处置'
      row.handlingResult = '待执行'
      row.countermeasureDevice = '--'
    }
    row.remark = remark || `人工确认真实入侵，威胁等级${threatLevel}`
    return
  }

  if (result === '躁扰告警') {
    row.threatLevel = '低'
    row.handlingStatus = '已关闭'
    row.handlingResult = '未执行反制'
    row.countermeasureDevice = '--'
    row.remark = remark || `人工确认为躁扰告警（${nuisanceType || '其他'}），已关闭告警`
    return
  }
}

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}

function buildHistoryEventDetail(row: HistoryEventItem): HistoryEventDetail {
  const seed = hashSeed(row.id)
  const pointCount = 48
  const trajectory: TrajectoryPoint[] = []
  const pilotPos = { x: 0.14 + (seed % 8) * 0.015, y: 0.68 }
  const devicePos = { x: 0.74, y: 0.32 }
  const startX = pilotPos.x + 0.06
  const startY = pilotPos.y - 0.12

  for (let i = 0; i <= pointCount; i++) {
    const t = i / pointCount
    const progress = Math.round(t * 100)
    const angle = t * Math.PI * 1.25 + seed * 0.001
    const x = startX + (devicePos.x - startX) * t + Math.sin(angle) * 0.09
    const y = startY + (devicePos.y - startY) * t + Math.cos(angle) * 0.07
    trajectory.push({
      progress,
      x: Math.min(0.92, Math.max(0.06, x)),
      y: Math.min(0.88, Math.max(0.1, y)),
      altitude: 80 + Math.round(t * 55)
    })
  }

  const handleProgress = row.handlingStatus === '待处置' ? 32 : 52
  const clearProgress = row.handlingStatus === '待处置' ? 68 : 92

  return {
    ...row,
    pilotConfidence: '--',
    zoneName: ['核心防护区A区', '缓冲区B区', '管制空域C区'][seed % 3],
    frequencyInfo: seed % 2 === 0 ? '2.4GHz + 5.8GHz' : '5.8GHz',
    targetType: row.targetModel === '未知型号' ? '未知' : '多旋翼',
    disposalDetail: `${row.handlingResult}；反制设备：${row.countermeasureDevice}`,
    disposalTimeline: buildDisposalTimeline(row),
    pilotPos,
    devicePos,
    trajectory,
    markers: [
      { key: 'discover', label: '发现', progress: 0, time: row.discoveredAt },
      {
        key: 'handle',
        label: '处置',
        progress: handleProgress,
        time: row.handledAt === '--' ? row.discoveredAt : row.handledAt
      },
      { key: 'clear', label: '解除', progress: clearProgress, time: row.endedAt }
    ],
    ...(row.relatedEventCount > 1
      ? {
          trajectoryMergeNote: `已合并 ${row.relatedEventCount} 条同架次记录（雷达 + 无线电 + 融合节点）轨迹`
        }
      : {})
  }
}

function filterList(params: HistoryEventQuery): HistoryEventItem[] {
  let rows = [...allList]
  if (params.targetModel?.trim()) {
    const kw = params.targetModel.trim().toLowerCase()
    rows = rows.filter((row) => row.targetModel.toLowerCase().includes(kw))
  }
  if (params.uavSn?.trim()) {
    const kw = params.uavSn.trim().toLowerCase()
    rows = rows.filter((row) => row.uavSn.toLowerCase().includes(kw))
  }
  if (params.targetId?.trim()) {
    rows = rows.filter((row) => row.targetId === params.targetId!.trim())
  }
  if (params.threatLevel) {
    rows = rows.filter((row) => row.threatLevel === params.threatLevel)
  }
  if (params.handlingStatus) {
    rows = rows.filter((row) => row.handlingStatus === params.handlingStatus)
  }
  if (params.manualConfirmStatus) {
    rows = rows.filter((row) => row.manualConfirmStatus === params.manualConfirmStatus)
  }
  if (params.trajectoryFeature) {
    rows = rows.filter((row) => row.trajectoryFeature === params.trajectoryFeature)
  }
  if (params.detectionDevice) {
    rows = rows.filter((row) => row.detectionDevice === params.detectionDevice)
  }
  if (params.countermeasureDevice) {
    rows = rows.filter((row) => row.countermeasureDevice === params.countermeasureDevice)
  }
  if (params.handlingResult) {
    rows = rows.filter((row) => row.handlingResult === params.handlingResult)
  }
  if (params.pilotLocated === '已定位') {
    rows = rows.filter((row) => row.pilotLocation !== '未定位')
  } else if (params.pilotLocated === '未定位') {
    rows = rows.filter((row) => row.pilotLocation === '未定位')
  }
  if (params.discoveredAtStart) {
    rows = rows.filter((row) => row.discoveredAt >= params.discoveredAtStart!)
  }
  if (params.discoveredAtEnd) {
    rows = rows.filter((row) => row.discoveredAt <= `${params.discoveredAtEnd} 23:59:59`)
  }
  if (params.zoneName) {
    rows = rows.filter((row) => row.zoneName === params.zoneName)
  }
  if (params.dataSource) {
    rows = rows.filter((row) => row.dataSource === params.dataSource)
  }
  return rows
}

export function queryLocalHistoryEventList(params: HistoryEventQuery): HistoryEventListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const filtered = filterList(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length
  }
}

export function getLocalHistoryEventDetail(id: string): HistoryEventDetail | null {
  const row = allList.find((item) => item.id === id)
  return row ? buildHistoryEventDetail(row) : null
}

export function deleteLocalHistoryEvent(ids: string[]) {
  allList = allList.filter((row) => !ids.includes(row.id))
  updateRelatedEventCount()
  return true
}

export function confirmLocalHistoryEvent(payload: ManualConfirmPayload) {
  const row = allList.find((item) => item.id === payload.id)
  if (row) {
    applyConfirm(row, payload.result, payload.threatLevel, payload.nuisanceType, payload.remark)
  }
  return true
}

export function updateLocalHistoryEventListType(ids: string[], listType: '黑名单' | '白名单') {
  const selected = allList.filter((row) => ids.includes(row.id))
  selected.forEach((row) => {
    row.listType = listType
  })
  persistListTypes()
  syncLocalBlackWhiteListType(selected, listType)
  return selected.length
}
