import request from '@/axios'
import type {
  BlackWhiteFormPayload,
  BlackWhiteListQuery,
  BlackWhiteListResult,
  BlackWhiteListItem,
  BlackWhiteTargetDetail,
  BlackWhiteTargetListTypePayload
} from './types'

export const getBlackWhiteListApi = (
  params: BlackWhiteListQuery
): Promise<IResponse<BlackWhiteListResult>> => {
  return request.get({ url: '/mock/lad/list/black-white', params })
}

export const deleteBlackWhiteApi = (ids: string[]): Promise<IResponse> => {
  return request.post({ url: '/mock/lad/list/black-white/delete', data: { ids } })
}

export const saveBlackWhiteApi = (data: BlackWhiteFormPayload): Promise<IResponse<BlackWhiteListItem>> => {
  return request.post({ url: '/mock/lad/list/black-white/save', data })
}

export const getBlackWhiteDetailApi = (id: string): Promise<IResponse<BlackWhiteTargetDetail>> => {
  return request.get({ url: '/mock/lad/list/black-white/detail', params: { id } })
}

export const updateBlackWhiteListTypeApi = (
  data: BlackWhiteTargetListTypePayload
): Promise<IResponse<BlackWhiteTargetDetail>> => {
  return request.post({ url: '/mock/lad/list/black-white/list-type', data })
}
