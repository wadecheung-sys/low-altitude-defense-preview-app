import type { ThreatLevel } from '../incident/types'

export type FlightRecordSegmentKind = '告警' | '主动录制'

export interface FlightRecordSegment {
  id: string
  kind: FlightRecordSegmentKind
  eventId: string
  targetId: string
  targetModel: string
  threatLevel: ThreatLevel
  zoneName: string
  startAt: string
  endAt: string
  detectionDevice: string
  summary: string
}

export interface FlightRecordDaySummary {
  date: string
  segmentCount: number
  alarmCount: number
  recordingCount: number
}

export interface FlightRecordDayDetail {
  date: string
  dayStartAt: string
  dayEndAt: string
  segments: FlightRecordSegment[]
}
