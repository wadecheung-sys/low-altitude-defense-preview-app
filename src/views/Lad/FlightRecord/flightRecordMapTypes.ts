import type { HistoryEventDetail } from '@/api/lad/incident/types'

export interface FlightRecordMapPoint {
  x: number
  y: number
}

export interface FlightRecordMapItem {
  segmentId: string
  targetId: string
  detail: HistoryEventDetail
  progress: number
  showTrail: boolean
  /** 装饰用无人机固定点位（0~1），仅 showTrail=false 时使用 */
  decorativePos?: FlightRecordMapPoint
}