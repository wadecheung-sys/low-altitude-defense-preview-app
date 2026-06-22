import { SUCCESS_CODE } from '@/constants'
import type {
  HistoryEventDetail,
  HistoryEventListResult,
  HistoryEventQuery,
  HistoryEventListTypePayload,
  ManualConfirmPayload
} from './types'
import {
  confirmLocalHistoryEvent,
  deleteLocalHistoryEvent,
  getLocalHistoryEventDetail,
  queryLocalHistoryEventList,
  updateLocalHistoryEventListType
} from './localHistoryStore'

function wrapLocalResponse<T>(data: T): IResponse<T> {
  return {
    code: SUCCESS_CODE,
    data
  } as IResponse<T>
}

export const getHistoryEventListApi = (
  params: HistoryEventQuery
): Promise<IResponse<HistoryEventListResult>> => {
  return Promise.resolve(wrapLocalResponse(queryLocalHistoryEventList(params)))
}

export const deleteHistoryEventApi = (ids: string[]): Promise<IResponse> => {
  return Promise.resolve(wrapLocalResponse(deleteLocalHistoryEvent(ids)))
}

export const confirmHistoryEventApi = (data: ManualConfirmPayload): Promise<IResponse> => {
  return Promise.resolve(wrapLocalResponse(confirmLocalHistoryEvent(data)))
}

export const updateHistoryEventListTypeApi = (
  data: HistoryEventListTypePayload
): Promise<IResponse<number>> => {
  return Promise.resolve(
    wrapLocalResponse(updateLocalHistoryEventListType(data.ids, data.listType))
  )
}

export const getHistoryEventDetailApi = (id: string): Promise<IResponse<HistoryEventDetail>> => {
  const detail = getLocalHistoryEventDetail(id)
  if (!detail) return Promise.reject(new Error('事件不存在'))
  return Promise.resolve(wrapLocalResponse(detail))
}
