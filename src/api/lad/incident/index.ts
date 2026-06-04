import request from '@/axios'
import type {
  HistoryEventDetail,
  HistoryEventListResult,
  HistoryEventQuery,
  ManualConfirmPayload
} from './types'

export const getHistoryEventListApi = (
  params: HistoryEventQuery
): Promise<IResponse<HistoryEventListResult>> => {
  return request.get({ url: '/mock/lad/incident/history', params })
}

export const deleteHistoryEventApi = (ids: string[]): Promise<IResponse> => {
  return request.post({ url: '/mock/lad/incident/history/delete', data: { ids } })
}

export const confirmHistoryEventApi = (data: ManualConfirmPayload): Promise<IResponse> => {
  return request.post({ url: '/mock/lad/incident/history/confirm', data })
}

export const getHistoryEventDetailApi = (id: string): Promise<IResponse<HistoryEventDetail>> => {
  return request.get({ url: '/mock/lad/incident/history/detail', params: { id } })
}
