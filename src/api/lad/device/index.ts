import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import {
  queryDeviceArchiveDetail,
  queryDeviceArchiveList,
  deleteDeviceArchiveRecords,
  setDeviceArchiveRecordsEnabled,
  saveDeviceArchiveRecord
} from './archiveStore'
import type {
  DeviceArchiveDetail,
  DeviceArchiveEnabledPayload,
  DeviceArchiveListResult,
  DeviceArchiveQuery,
  DeviceArchiveSavePayload,
  DeviceArchiveItem
} from './types'

const useLocalStore = import.meta.env.VITE_USE_MOCK === 'true'

function ok<T>(data: T): IResponse<T> {
  return { code: SUCCESS_CODE, data } as IResponse<T>
}

export const getDeviceArchiveListApi = async (
  params: DeviceArchiveQuery
): Promise<IResponse<DeviceArchiveListResult>> => {
  if (useLocalStore) {
    return ok(queryDeviceArchiveList(params))
  }
  return request.get({ url: '/mock/lad/device/archive/list', params })
}

export const getDeviceArchiveDetailApi = async (
  id: string
): Promise<IResponse<DeviceArchiveDetail>> => {
  if (useLocalStore) {
    const data = queryDeviceArchiveDetail(id)
    if (!data) {
      return Promise.reject(new Error('档案不存在'))
    }
    return ok(data)
  }
  return request.get({ url: '/mock/lad/device/archive/detail', params: { id } })
}

export const deleteDeviceArchiveApi = async (ids: string[]): Promise<IResponse> => {
  if (useLocalStore) {
    deleteDeviceArchiveRecords(ids)
    return ok(true)
  }
  return request.post({ url: '/mock/lad/device/archive/delete', data: { ids } })
}

export const setDeviceArchiveEnabledApi = async (
  data: DeviceArchiveEnabledPayload
): Promise<IResponse> => {
  if (useLocalStore) {
    setDeviceArchiveRecordsEnabled(data.ids, data.enabled)
    return ok(true)
  }
  return request.post({ url: '/mock/lad/device/archive/enabled', data })
}

export const saveDeviceArchiveApi = async (
  data: DeviceArchiveSavePayload
): Promise<IResponse<DeviceArchiveItem>> => {
  if (useLocalStore) {
    return ok(saveDeviceArchiveRecord(data))
  }
  return request.post({ url: '/mock/lad/device/archive/save', data })
}

export type {
  DeviceArchiveDetail,
  DeviceArchiveItem,
  DeviceArchiveQuery,
  DeviceArchiveCategory
} from './types'
