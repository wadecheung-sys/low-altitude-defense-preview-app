import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import type {
  BlackWhiteFormPayload,
  BlackWhiteListQuery,
  BlackWhiteListResult,
  BlackWhiteListItem,
  BlackWhiteTargetDetail,
  BlackWhiteTargetListTypePayload
} from './types'
import {
  deleteLocalBlackWhite,
  getLocalBlackWhiteDetail,
  queryLocalBlackWhiteList,
  saveLocalBlackWhite,
  updateLocalBlackWhiteListType
} from './localBlackWhiteStore'

function wrapLocalResponse<T>(data: T): IResponse<T> {
  return {
    code: SUCCESS_CODE,
    data
  } as IResponse<T>
}

export const getBlackWhiteListApi = (
  params: BlackWhiteListQuery
): Promise<IResponse<BlackWhiteListResult>> => {
  return request
    .get<BlackWhiteListResult>({ url: '/mock/lad/list/black-white', params })
    .then((res) => (res?.data?.list ? res : wrapLocalResponse(queryLocalBlackWhiteList(params))))
    .catch(() => wrapLocalResponse(queryLocalBlackWhiteList(params)))
}

export const deleteBlackWhiteApi = (ids: string[]): Promise<IResponse> => {
  return request
    .post({ url: '/mock/lad/list/black-white/delete', data: { ids } })
    .then((res) => res || wrapLocalResponse(deleteLocalBlackWhite(ids)))
    .catch(() => wrapLocalResponse(deleteLocalBlackWhite(ids)))
}

export const saveBlackWhiteApi = (
  data: BlackWhiteFormPayload
): Promise<IResponse<BlackWhiteListItem>> => {
  return request
    .post<BlackWhiteListItem>({ url: '/mock/lad/list/black-white/save', data })
    .then((res) => (res?.data?.id ? res : wrapLocalResponse(saveLocalBlackWhite(data))))
    .catch(() => wrapLocalResponse(saveLocalBlackWhite(data)))
}

export const getBlackWhiteDetailApi = (id: string): Promise<IResponse<BlackWhiteTargetDetail>> => {
  return request
    .get<BlackWhiteTargetDetail>({ url: '/mock/lad/list/black-white/detail', params: { id } })
    .then((res) => {
      if (res?.data?.id) return res
      const detail = getLocalBlackWhiteDetail(id)
      if (!detail) {
        throw new Error('记录不存在')
      }
      return wrapLocalResponse(detail)
    })
    .catch(() => {
      const detail = getLocalBlackWhiteDetail(id)
      if (!detail) {
        throw new Error('记录不存在')
      }
      return wrapLocalResponse(detail)
    })
}

export const updateBlackWhiteListTypeApi = (
  data: BlackWhiteTargetListTypePayload
): Promise<IResponse<BlackWhiteTargetDetail>> => {
  return request
    .post<BlackWhiteTargetDetail>({ url: '/mock/lad/list/black-white/list-type', data })
    .then((res) => {
      if (res?.data?.id) return res
      const detail = updateLocalBlackWhiteListType(data)
      if (!detail) {
        throw new Error('记录不存在')
      }
      return wrapLocalResponse(detail)
    })
    .catch(() => {
      const detail = updateLocalBlackWhiteListType(data)
      if (!detail) {
        throw new Error('记录不存在')
      }
      return wrapLocalResponse(detail)
    })
}
