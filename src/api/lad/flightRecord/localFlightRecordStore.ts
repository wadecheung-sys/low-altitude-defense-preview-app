import { getLocalHistoryEventDetail, queryLocalHistoryEventList } from '../incident/localHistoryStore'
import type { HistoryEventDetail, HistoryEventItem } from '../incident/types'
import type {
  FlightRecordDayDetail,
  FlightRecordDaySummary,
  FlightRecordSegment,
  FlightRecordSegmentKind
} from './types'

function dateKeyFromDatetime(datetime: string) {
  return datetime.slice(0, 10)
}

function parseDatetimeMs(value: string) {
  const ms = Date.parse(value.replace(/-/g, '/'))
  return Number.isFinite(ms) ? ms : 0
}

function formatDayBounds(date: string) {
  return {
    dayStartAt: `${date} 00:00:00`,
    dayEndAt: `${date} 23:59:59`
  }
}

function resolveRecordingKind(row: HistoryEventItem, index: number): FlightRecordSegmentKind | null {
  if (row.detectionDevice.includes('光电') || index % 4 === 1) {
    return '主动录制'
  }
  return '告警'
}

function formatDatetimeMs(ms: number) {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function normalizeSegmentBounds(startAt: string, endAt: string, minDurationMs = 60_000) {
  const startMs = parseDatetimeMs(startAt)
  let endMs = parseDatetimeMs(endAt)
  if (endMs <= startMs) {
    endMs = startMs + minDurationMs
  }
  return {
    startAt,
    endAt: formatDatetimeMs(endMs),
    startMs,
    endMs
  }
}

function buildAlarmSegment(row: HistoryEventItem): FlightRecordSegment {
  const bounds = normalizeSegmentBounds(row.discoveredAt, row.endedAt)
  return {
    id: `fr-alarm-${row.id}`,
    kind: '告警',
    eventId: row.id,
    targetId: row.targetId,
    targetModel: row.targetModel,
    threatLevel: row.threatLevel,
    zoneName: row.zoneName,
    startAt: bounds.startAt,
    endAt: bounds.endAt,
    detectionDevice: row.detectionDevice,
    summary: `${row.threatLevel} · ${row.zoneName}`
  }
}

function buildRecordingSegment(row: HistoryEventItem): FlightRecordSegment {
  const bounds = normalizeSegmentBounds(row.discoveredAt, row.endedAt)
  const startMs = bounds.startMs
  const endMs = bounds.endMs
  const offsetMs = Math.min(12_000, Math.max(4_000, Math.floor((endMs - startMs) * 0.15)))
  const recordStartMs = startMs + offsetMs
  const recordEndMs = Math.max(recordStartMs + 8_000, endMs - 2_000)

  return {
    id: `fr-record-${row.id}`,
    kind: '主动录制',
    eventId: row.id,
    targetId: row.targetId,
    targetModel: row.targetModel,
    threatLevel: row.threatLevel,
    zoneName: row.zoneName,
    startAt: formatDatetimeMs(recordStartMs),
    endAt: formatDatetimeMs(recordEndMs),
    detectionDevice: row.detectionDevice.includes('光电') ? row.detectionDevice : '光电-01',
    summary: `主动录像 · ${row.targetModel}`
  }
}

function buildSegmentsFromEvents(rows: HistoryEventItem[]): FlightRecordSegment[] {
  const segments: FlightRecordSegment[] = []

  rows.forEach((row, index) => {
    segments.push(buildAlarmSegment(row))
    const recordingKind = resolveRecordingKind(row, index)
    if (recordingKind === '主动录制') {
      segments.push(buildRecordingSegment(row))
    }
  })

  return segments.sort((a, b) => parseDatetimeMs(a.startAt) - parseDatetimeMs(b.startAt))
}

function listAllHistoryEvents() {
  const { list } = queryLocalHistoryEventList({ pageIndex: 1, pageSize: 500 })
  return list
}

export function queryFlightRecordDaySummaries(): FlightRecordDaySummary[] {
  const byDate = new Map<string, FlightRecordSegment[]>()

  buildSegmentsFromEvents(listAllHistoryEvents()).forEach((segment) => {
    const date = dateKeyFromDatetime(segment.startAt)
    const bucket = byDate.get(date) || []
    bucket.push(segment)
    byDate.set(date, bucket)
  })

  return [...byDate.entries()]
    .map(([date, segments]) => ({
      date,
      segmentCount: segments.length,
      alarmCount: segments.filter((item) => item.kind === '告警').length,
      recordingCount: segments.filter((item) => item.kind === '主动录制').length
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getFlightRecordDayDetail(date: string): FlightRecordDayDetail {
  const segments = buildSegmentsFromEvents(listAllHistoryEvents()).filter(
    (segment) => dateKeyFromDatetime(segment.startAt) === date
  )

  return {
    date,
    ...formatDayBounds(date),
    segments
  }
}

export function getFlightRecordEventDetail(eventId: string): HistoryEventDetail | null {
  return getLocalHistoryEventDetail(eventId)
}
