import { buildDisposalTimeline } from './disposalTimeline'
import { isHandlingEnded, normalizeHandlingStatus } from './handlingStatusUtils'
import { BIRD_NUISANCE_DEMO_EVENT_ID, resolveHistoryTargetType } from './historyTargetType'
import { syncLocalBlackWhiteListType } from '@/api/lad/list/localBlackWhiteStore'
import { resolveCountermeasureActionValue } from '@/constants/deviceCatalog'
import { normalizeThreatLevel } from '@/api/lad/threat/threatLevelUtils'
import { LAD_TARGET_PROFILES } from '@/api/lad/shared/targetProfiles'
import type { LadTargetProfile } from '@/api/lad/shared/targetProfiles'
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

const trajectories = ['直线逼近', '盘旋', '悬停', '快速穿越', '不规则']
const threatLevels: ThreatLevel[] = ['高危', '中危', '低危', '无危']
const handlingResults = ['驱离成功', '迫降成功', '激光打击成功', '无线电压制成功']
const detectionDevices = ['雷达-01 (2.4G)', '无线电-02', '雷达-03 (5.8G)', '光电-01', '融合节点-A']
const zones = ['核心防护区A区', '缓冲区B区', '管制空域C区', '公共区域']
const zoneAreaIds = ['ar-10001', 'ar-10002', 'ar-10003', 'ar-10003']
const dataSources = ['雷达+无线电融合', '雷达单源', '无线电侦测', '光电跟踪', '多源融合节点']
const countermeasures = ['干扰-01', '--', '诱骗-02', '干扰-01', '激光-01']

const LIST_TYPE_STORAGE_KEY = 'lad-history-event-list-types'

const targetProfiles: LadTargetProfile[] = LAD_TARGET_PROFILES

function hashSeed(id: string): number {
  let h = 0
  for (const c of id) {
    h = (h * 31 + c.charCodeAt(0)) % 10000
  }
  return h
}

function formatSeedDatetime(ms: number) {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

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
      const discoveredMs = Date.parse(discovered.replace(/-/g, '/'))
      const endedMs = discoveredMs + durationSec * 1000
      const ended = formatSeedDatetime(endedMs)
      const handled = formatSeedDatetime(endedMs + 5_000)
      const lng = (113.39 + (i % 20) * 0.01).toFixed(2)
      const lat = (23.09 + (i % 15) * 0.01).toFixed(2)
      const abnormalSec = i % 3 === 0 ? 8 + (i % 40) : 0
      const keepOpen = i < 4
      const forceDisposed = i === 8 || i === 9
      const forceEnded = i === 6 || i === 7 || i === 13

      const isCoreZone = zones[i % zones.length].includes('核心')
      const approachMeters = isCoreZone ? 35 + (i % 150) : 180 + (i % 1200)
      const eventId = `he-${10001 + i}`
      const seedNum = hashSeed(eventId)
      const stayDurationSec = abnormalSec > 0 ? abnormalSec : 45 + (seedNum % 300)
      const isBirdNuisanceDemo = eventId === BIRD_NUISANCE_DEMO_EVENT_ID

      const forceManualExecution = i === 11
      const countermeasureDevice =
        keepOpen || forceEnded || isBirdNuisanceDemo
          ? '--'
          : forceManualExecution
            ? '干扰-01'
            : countermeasures[i % countermeasures.length]

      const manualConfirmStatus = isBirdNuisanceDemo ? '躁扰告警' : '真实入侵'
      const handlingResult = isBirdNuisanceDemo
        ? '飞鸟虚警过滤'
        : keepOpen
          ? '待执行'
          : forceEnded
            ? i === 6
              ? '无人机自离'
              : '目标自然脱离'
            : forceManualExecution
              ? '驱离成功'
              : handlingResults[i % handlingResults.length]
      const remark = isBirdNuisanceDemo
        ? '融合算法虚警过滤，目标判定为飞鸟，未执行反制'
        : forceManualExecution
          ? '选中干扰设备后人工下发驱离指令'
          : keepOpen
            ? '等待值守人员人工核查'
            : forceEnded
              ? '事件未执行反制，目标已自然结束'
              : i % 7 === 0
                ? '多源轨迹已合并'
                : ''
      const manualDisposalAction = forceManualExecution ? '无线电干扰' : undefined
      const disposalAction =
        resolveCountermeasureActionValue(manualDisposalAction) ??
        resolveCountermeasureActionValue(countermeasureDevice) ??
        resolveCountermeasureActionValue(handlingResult)

      const rowTargetModel = isBirdNuisanceDemo ? '未知型号' : profile.targetModel
      const rowUavSn = isBirdNuisanceDemo ? '未解析' : profile.uavSn
      const rowTargetId = isBirdNuisanceDemo
        ? 'TG-2024-BIRD-001'
        : `TG-2024-${String(i + 1).padStart(4, '0')}`
      const historyTargetType = isBirdNuisanceDemo
        ? '躁扰信号-飞鸟'
        : resolveHistoryTargetType({
            uavSn: rowUavSn,
            manualConfirmStatus
          })

      list.push({
        id: eventId,
        targetId: rowTargetId,
        relatedEventCount: 1,
        historyTargetType,
        threatLevel: isBirdNuisanceDemo ? '无危' : threatLevels[i % threatLevels.length],
        handledAt: keepOpen || forceEnded ? '--' : handled,
        discoveredAt: discovered,
        endedAt: ended,
        abnormalDuration:
          stayDurationSec > 0
            ? `00:${String(Math.floor(stayDurationSec / 60)).padStart(2, '0')}:${String(stayDurationSec % 60).padStart(2, '0')}`
            : '--',
        duration: `00:${String(Math.floor(durationSec / 60)).padStart(2, '0')}:${String(durationSec % 60).padStart(2, '0')}`,
        pilotLocation: '未定位',
        targetLocation: `E:${lng} N:${lat}`,
        approachingDistance:
          approachMeters >= 1000 ? `${(approachMeters / 1000).toFixed(2)}km` : `${approachMeters}m`,
        assessmentMetrics: {
          speed: Number(
            (isBirdNuisanceDemo ? 1.2 + (seedNum % 8) / 10 : 6 + (seedNum % 140) / 10).toFixed(1)
          ),
          stayDurationSec: isBirdNuisanceDemo ? 12 + (seedNum % 20) : stayDurationSec,
          intrusionCount: isBirdNuisanceDemo ? 0 : 1 + (seedNum % 3),
          altitude: isBirdNuisanceDemo ? 25 + (seedNum % 40) : 60 + (seedNum % 180),
          signalStrength: -58 - (seedNum % 25),
          ...(profile.eventCount >= 3 && !isBirdNuisanceDemo
            ? { swarmCount: 3 + (seedNum % 6) }
            : {})
        },
        planTriggerContext: {
          temperature: 18 + (seedNum % 16),
          humidity: 45 + (seedNum % 40),
          windPower: 2 + (seedNum % 5),
          rainfall: seedNum % 4 === 0 ? 6 + (seedNum % 18) : seedNum % 7,
          areaId: zoneAreaIds[i % zoneAreaIds.length]
        },
        zoneName: zones[i % zones.length],
        dataSource: dataSources[i % dataSources.length],
        trajectoryFeature: isBirdNuisanceDemo ? '不规则' : trajectories[i % trajectories.length],
        targetModel: rowTargetModel,
        uavSn: rowUavSn,
        detectionDevice: detectionDevices[i % detectionDevices.length],
        countermeasureDevice,
        disposalAction,
        disposalExecutionSource: forceManualExecution
          ? 'manual'
          : keepOpen || forceEnded || countermeasureDevice === '--'
            ? 'none'
            : 'plan',
        ...(forceManualExecution
          ? {
              manualDisposalAction,
              disposalOperator: '值班员张三'
            }
          : {}),
        handlingResult,
        handlingStatus: forceManualExecution
          ? '已结束'
          : forceDisposed
            ? '已结束'
            : forceEnded
              ? '已结束'
              : keepOpen
                ? '进行中'
                : '已结束',
        manualConfirmStatus,
        listType: '未知',
        remark
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
const allList: HistoryEventItem[] = buildSeedList().map((row) => ({
  ...row,
  listType: storedListTypes[row.id] || row.listType || '未知'
}))

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function applyConfirm(
  row: HistoryEventItem,
  result: ManualConfirmResult,
  threatLevel: ThreatLevel = '无危',
  nuisanceType?: string,
  remark?: string
) {
  const now = formatTimestamp(new Date())
  row.manualConfirmStatus = `人工-${result}`
  row.handledAt = now
  row.endedAt = row.endedAt === '--' ? now : row.endedAt

  if (result === '真实入侵') {
    row.threatLevel = threatLevel
    if (threatLevel === '低危') {
      row.handlingStatus = '进行中'
      row.handlingResult = '自动监控中'
      row.countermeasureDevice = '光电-01'
      row.disposalAction = undefined
    } else if (threatLevel === '中危') {
      row.handlingStatus = '已结束'
      row.handlingResult = '驱离成功'
      row.countermeasureDevice = '干扰-01'
      row.disposalAction = resolveCountermeasureActionValue(row.countermeasureDevice)
    } else if (threatLevel === '高危') {
      row.handlingStatus = '已结束'
      row.handlingResult = '激光打击成功'
      row.countermeasureDevice = '激光-01'
      row.disposalAction = resolveCountermeasureActionValue(row.countermeasureDevice)
    } else {
      row.handlingStatus = '进行中'
      row.handlingResult = '待执行'
      row.countermeasureDevice = '--'
      row.disposalAction = undefined
    }
    row.remark = remark || `人工核查真实入侵，威胁等级${threatLevel}`
    row.historyTargetType = resolveHistoryTargetType(row)
    return
  }

  if (result === '躁扰告警') {
    row.threatLevel = '无危'
    row.handlingStatus = '已结束'
    row.handlingResult = '飞鸟虚警过滤'
    row.countermeasureDevice = '--'
    row.disposalAction = undefined
    row.historyTargetType = '躁扰信号-飞鸟'
    row.targetModel = '未知型号'
    row.uavSn = '未解析'
    row.remark = remark || `人工核查为躁扰告警（${nuisanceType || '飞鸟'}），已关闭告警`
  }
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

  const handleProgress = isHandlingEnded(row.handlingStatus) ? 52 : 32
  const clearProgress = isHandlingEnded(row.handlingStatus) ? 92 : 68

  return {
    ...row,
    pilotConfidence: '--',
    zoneName: ['核心防护区A区', '缓冲区B区', '管制空域C区'][seed % 3],
    frequencyInfo:
      row.historyTargetType === '躁扰信号-飞鸟'
        ? '--'
        : seed % 2 === 0
          ? '2.4GHz + 5.8GHz'
          : '5.8GHz',
    targetType:
      row.historyTargetType === '躁扰信号-飞鸟' || row.targetModel === '未知型号'
        ? '未知'
        : '多旋翼',
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
  if (params.listType) {
    rows = rows.filter((row) => row.listType === params.listType)
  }
  if (params.historyTargetType) {
    rows = rows.filter((row) => row.historyTargetType === params.historyTargetType)
  }
  if (params.threatLevel) {
    rows = rows.filter((row) => normalizeThreatLevel(row.threatLevel) === params.threatLevel)
  }
  if (params.handlingStatus) {
    rows = rows.filter(
      (row) => normalizeHandlingStatus(row.handlingStatus) === params.handlingStatus
    )
  }
  if (params.manualConfirmStatus) {
    rows = rows.filter((row) => row.manualConfirmStatus === params.manualConfirmStatus)
  }
  if (params.verificationMethod === '人工核查') {
    rows = rows.filter((row) => row.manualConfirmStatus.startsWith('人工-'))
  } else if (params.verificationMethod === '自动识别') {
    rows = rows.filter((row) => !row.manualConfirmStatus.startsWith('人工-'))
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
  const row =
    allList.find((item) => item.id === id) ||
    allList.find((item) => item.targetId === id) ||
    allList[0]
  return row ? buildHistoryEventDetail(row) : null
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
