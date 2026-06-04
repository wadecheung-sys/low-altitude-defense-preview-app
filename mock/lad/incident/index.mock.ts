import { SUCCESS_CODE } from '@/constants'
import { buildDisposalTimeline } from '@/api/lad/incident/disposalTimeline'
import type {
  HandlingStatus,
  HistoryEventDetail,
  HistoryEventItem,
  HistoryEventQuery,
  ManualConfirmPayload,
  ManualConfirmResult,
  ThreatLevel,
  TrajectoryPoint
} from '@/api/lad/incident/types'

const timeout = 300

const models = ['DJI Mavic 3', 'DJI Mini 3 Pro', 'Autel EVO II', 'Parrot Anafi', '未知型号']
const trajectories = ['直线逼近', '盘旋', '悬停', '快速穿越', '不规则']
const threatLevels: ThreatLevel[] = ['高', '中', '低', '未知']
const handlingStatuses: HandlingStatus[] = ['待处置', '处置中', '已处置', '已关闭', '仅记录']
const handlingResults = ['监控跟踪', '无线电干扰', '迫降处置', '告警记录', '移交执勤']
const detectionDevices = ['雷达-01 (2.4G)', '无线电-02', '雷达-03 (5.8G)', '光电-01', '融合节点-A']
const zones = ['核心保护区-A区', '缓冲区-B区', '管制空域-C区', '公共区域']
const dataSources = ['雷达+无线电融合', '雷达单源', '无线电侦测', '光电跟踪', '多源融合节点']
const countermeasures = ['干扰-01 (自动)', '—', '诱骗-02', '干扰-01 (人工)', '激光-01 (待命)']
const pilotLocations = [
  'E:113.42 N:23.08（TDOA）',
  'E:113.38 N:23.11（无线电解析）',
  '未定位',
  'E:113.45 N:23.06（TDOA+融合）',
  'E:113.40 N:23.12（无线电解析）'
]

const TARGET_COUNT = 24

const targetProfiles = Array.from({ length: TARGET_COUNT }, (_, t) => {
  const hasUavSn = t % 4 !== 0
  return {
    targetId: `TG-2024-${String(t + 1).padStart(4, '0')}`,
    uavSn: hasUavSn ? `1581F4${String(100000 + t * 137).slice(0, 6)}` : '未解析',
    targetModel: models[t % models.length],
    eventCount: 2 + (t % 4)
  }
})

let allList: HistoryEventItem[] = []
let seq = 0
targetProfiles.forEach((profile) => {
  for (let e = 0; e < profile.eventCount; e++) {
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
    const handled =
      i % 5 === 4
        ? '—'
        : `2024-03-${day} ${hour}:${String(endMin).padStart(2, '0')}:${String((endSec + 5) % 60).padStart(2, '0')}`
    const lng = (113.39 + (i % 20) * 0.01).toFixed(2)
    const lat = (23.09 + (i % 15) * 0.01).toFixed(2)
    const abnormalSec = i % 3 === 0 ? 8 + (i % 40) : 0

    allList.push({
      id: `he-${10001 + i}`,
      targetId: profile.targetId,
      relatedEventCount: profile.eventCount,
      threatLevel: threatLevels[i % threatLevels.length],
      handledAt: handled,
      discoveredAt: discovered,
      endedAt: ended,
      abnormalDuration:
        abnormalSec > 0
          ? `00:${String(Math.floor(abnormalSec / 60)).padStart(2, '0')}:${String(abnormalSec % 60).padStart(2, '0')}`
          : '—',
      duration: `00:${String(Math.floor(durationSec / 60)).padStart(2, '0')}:${String(durationSec % 60).padStart(2, '0')}`,
      pilotLocation: pilotLocations[i % pilotLocations.length],
      targetLocation: `E:${lng} N:${lat}`,
      zoneName: zones[i % zones.length],
      dataSource: dataSources[i % dataSources.length],
      trajectoryFeature: trajectories[i % trajectories.length],
      targetModel: profile.targetModel,
      uavSn: profile.uavSn,
      detectionDevice: detectionDevices[i % detectionDevices.length],
      countermeasureDevice: countermeasures[i % countermeasures.length],
      handlingResult: handlingResults[i % handlingResults.length],
      handlingStatus: i % 4 === 0 ? '待处置' : handlingStatuses[i % handlingStatuses.length],
      manualConfirmStatus: i % 4 === 0 ? '待人工确认' : '真实入侵',
      remark: i % 7 === 0 ? '多源轨迹已合并' : ''
    })
  }
})

function applyConfirm(row: HistoryEventItem, result: ManualConfirmResult, remark?: string) {
  row.manualConfirmStatus = result
  if (remark) {
    row.remark = remark
  }
  if (result === '真实入侵') {
    row.threatLevel = row.threatLevel === '未知' ? '高' : row.threatLevel
    row.handlingStatus = '处置中'
    row.handlingResult = '已确认入侵，持续监控'
  } else if (result === '飞鸟/误报') {
    row.threatLevel = '低'
    row.handlingStatus = '已关闭'
    row.handlingResult = '飞鸟/误报归档'
  } else if (result === '启动反制') {
    row.handlingStatus = '处置中'
    row.handlingResult = '已下发反制指令'
    if (row.countermeasureDevice === '—') {
      row.countermeasureDevice = '干扰-01 (人工启动)'
    }
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
    pilotConfidence: row.pilotLocation.includes('未定位') ? '—' : `${72 + (seed % 23)}%`,
    zoneName: ['核心保护区-A区', '缓冲区-B区', '管制空域-C区'][seed % 3],
    frequencyInfo: seed % 2 === 0 ? '2.4GHz + 5.8GHz' : '5.8GHz',
    targetType: row.targetModel === '未知型号' ? '未知' : '多旋翼',
    disposalDetail: `${row.handlingResult}；反制：${row.countermeasureDevice}`,
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
        time: row.handledAt === '—' ? row.discoveredAt : row.handledAt
      },
      { key: 'clear', label: '危险解除', progress: clearProgress, time: row.endedAt }
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
    rows = rows.filter((r) => r.targetModel.toLowerCase().includes(kw))
  }
  if (params.uavSn?.trim()) {
    const kw = params.uavSn.trim().toLowerCase()
    rows = rows.filter((r) => r.uavSn.toLowerCase().includes(kw))
  }
  if (params.targetId?.trim()) {
    rows = rows.filter((r) => r.targetId === params.targetId!.trim())
  }
  if (params.threatLevel) {
    rows = rows.filter((r) => r.threatLevel === params.threatLevel)
  }
  if (params.handlingStatus) {
    rows = rows.filter((r) => r.handlingStatus === params.handlingStatus)
  }
  if (params.manualConfirmStatus) {
    rows = rows.filter((r) => r.manualConfirmStatus === params.manualConfirmStatus)
  }
  if (params.trajectoryFeature) {
    rows = rows.filter((r) => r.trajectoryFeature === params.trajectoryFeature)
  }
  if (params.detectionDevice) {
    rows = rows.filter((r) => r.detectionDevice === params.detectionDevice)
  }
  if (params.countermeasureDevice) {
    rows = rows.filter((r) => r.countermeasureDevice === params.countermeasureDevice)
  }
  if (params.handlingResult) {
    rows = rows.filter((r) => r.handlingResult === params.handlingResult)
  }
  if (params.pilotLocated === '已定位') {
    rows = rows.filter((r) => r.pilotLocation !== '未定位')
  } else if (params.pilotLocated === '未定位') {
    rows = rows.filter((r) => r.pilotLocation === '未定位')
  }
  if (params.discoveredAtStart) {
    rows = rows.filter((r) => r.discoveredAt >= params.discoveredAtStart!)
  }
  if (params.discoveredAtEnd) {
    rows = rows.filter((r) => r.discoveredAt <= `${params.discoveredAtEnd} 23:59:59`)
  }
  if (params.zoneName) {
    rows = rows.filter((r) => r.zoneName === params.zoneName)
  }
  if (params.dataSource) {
    rows = rows.filter((r) => r.dataSource === params.dataSource)
  }
  return rows
}

export default [
  {
    url: '/mock/lad/incident/history',
    method: 'get',
    timeout,
    response: ({ query }: { query: HistoryEventQuery }) => {
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
    url: '/mock/lad/incident/history/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => {
      const ids = body?.ids || []
      allList = allList.filter((row) => !ids.includes(row.id))
      allList.forEach((r) => {
        const count = allList.filter((x) => x.targetId === r.targetId).length
        r.relatedEventCount = count
      })
      return { code: SUCCESS_CODE, data: true }
    }
  },
  {
    url: '/mock/lad/incident/history/confirm',
    method: 'post',
    timeout,
    response: ({ body }: { body: ManualConfirmPayload }) => {
      const row = allList.find((r) => r.id === body.id)
      if (row) {
        applyConfirm(row, body.result, body.remark)
      }
      return { code: SUCCESS_CODE, data: true }
    }
  },
  {
    url: '/mock/lad/incident/history/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id?: string } }) => {
      const row = allList.find((r) => r.id === query.id)
      if (!row) {
        return { code: 500, message: '事件不存在' }
      }
      return { code: SUCCESS_CODE, data: buildHistoryEventDetail(row) }
    }
  }
]
