import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import type {
  HistoryEventDetail,
  HistoryEventListResult,
  HistoryEventQuery,
  ManualConfirmPayload
} from './types'
import {
  confirmLocalHistoryEvent,
  deleteLocalHistoryEvent,
  getLocalHistoryEventDetail,
  queryLocalHistoryEventList
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
  return request
    .get<HistoryEventListResult>({ url: '/mock/lad/incident/history', params })
    .then((res) => (res?.data?.list ? res : wrapLocalResponse(queryLocalHistoryEventList(params))))
    .catch(() => wrapLocalResponse(queryLocalHistoryEventList(params)))
}

export const deleteHistoryEventApi = (ids: string[]): Promise<IResponse> => {
  return request
    .post({ url: '/mock/lad/incident/history/delete', data: { ids } })
    .then((res) => res || wrapLocalResponse(deleteLocalHistoryEvent(ids)))
    .catch(() => wrapLocalResponse(deleteLocalHistoryEvent(ids)))
}

export const confirmHistoryEventApi = (data: ManualConfirmPayload): Promise<IResponse> => {
  return request
    .post({ url: '/mock/lad/incident/history/confirm', data })
    .then((res) => res || wrapLocalResponse(confirmLocalHistoryEvent(data)))
    .catch(() => wrapLocalResponse(confirmLocalHistoryEvent(data)))
}

export const getHistoryEventDetailApi = (id: string): Promise<IResponse<HistoryEventDetail>> => {
  return request
    .get<HistoryEventDetail>({ url: '/mock/lad/incident/history/detail', params: { id } })
    .then((res) => {
      if (res?.data?.id) return res
      const detail = getLocalHistoryEventDetail(id)
      if (!detail) {
        throw new Error('事件不存在')
      }
      return wrapLocalResponse(detail)
    })
    .catch(() => {
      const detail = getLocalHistoryEventDetail(id)
      if (!detail) {
        throw new Error('事件不存在')
      }
      return wrapLocalResponse(detail)
    })
}
