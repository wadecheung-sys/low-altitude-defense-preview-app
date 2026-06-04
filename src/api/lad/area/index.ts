import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import {
  deleteAreaRegion,
  getAreaRegion,
  queryAreaRegionList,
  saveAreaRegion
} from './areaStore'
import type { AreaRegion, AreaRegionListResult, AreaRegionQuery, AreaRegionSavePayload } from './types'

const useLocalStore = import.meta.env.VITE_USE_MOCK === 'true'

function ok<T>(data: T): IResponse<T> {
  return { code: SUCCESS_CODE, data } as IResponse<T>
}

export const getAreaRegionListApi = async (
  params?: AreaRegionQuery
): Promise<IResponse<AreaRegionListResult>> => {
  if (useLocalStore) {
    return ok(queryAreaRegionList(params))
  }
  return request.get({ url: '/mock/lad/area/list', params })
}

export const getAreaRegionDetailApi = async (id: string): Promise<IResponse<AreaRegion>> => {
  if (useLocalStore) {
    const data = getAreaRegion(id)
    if (!data) {
      return Promise.reject(new Error('区域不存在'))
    }
    return ok(data)
  }
  return request.get({ url: '/mock/lad/area/detail', params: { id } })
}

export const saveAreaRegionApi = async (
  data: AreaRegionSavePayload
): Promise<IResponse<AreaRegion>> => {
  if (useLocalStore) {
    return ok(saveAreaRegion(data))
  }
  return request.post({ url: '/mock/lad/area/save', data })
}

export const deleteAreaRegionApi = async (id: string): Promise<IResponse> => {
  if (useLocalStore) {
    deleteAreaRegion(id)
    return ok(true)
  }
  return request.post({ url: '/mock/lad/area/delete', data: { id } })
}

export type {
  AreaRegion,
  AreaRegionListResult,
  AreaRegionQuery,
  AreaRegionType,
  AreaShape,
  AreaShapeType,
  AreaRegionSavePayload
} from './types'
export { nextShapeId } from './areaStore'
