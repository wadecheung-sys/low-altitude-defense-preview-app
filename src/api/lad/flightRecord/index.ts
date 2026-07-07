import { SUCCESS_CODE } from '@/constants'
import type { HistoryEventDetail } from '../incident/types'
import {
  getFlightRecordDayDetail,
  getFlightRecordEventDetail,
  queryFlightRecordDaySummaries
} from './localFlightRecordStore'
import type { FlightRecordDayDetail, FlightRecordDaySummary } from './types'

function wrapLocalResponse<T>(data: T): IResponse<T> {
  return {
    code: SUCCESS_CODE,
    data
  } as IResponse<T>
}

export const getFlightRecordDaySummariesApi = (): Promise<IResponse<FlightRecordDaySummary[]>> => {
  return Promise.resolve(wrapLocalResponse(queryFlightRecordDaySummaries()))
}

export const getFlightRecordDayDetailApi = (
  date: string
): Promise<IResponse<FlightRecordDayDetail>> => {
  return Promise.resolve(wrapLocalResponse(getFlightRecordDayDetail(date)))
}

export const getFlightRecordEventDetailApi = (
  eventId: string
): Promise<IResponse<HistoryEventDetail>> => {
  const detail = getFlightRecordEventDetail(eventId)
  if (!detail) return Promise.reject(new Error('飞行记录不存在'))
  return Promise.resolve(wrapLocalResponse(detail))
}
