import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import {
  deleteDeviceInfoRecords,
  queryDeviceInfoDetail,
  queryDeviceInfoList,
  queryDeviceSelfCheck,
  saveDeviceInfoRecord
} from './infoStore'
import type { DeviceSelfCheckResult } from './types'
import type {
  DeviceInfoDetail,
  DeviceInfoItem,
  DeviceInfoListResult,
  DeviceInfoQuery,
  DeviceInfoSavePayload
} from './types'

const useLocalStore = import.meta.env.VITE_USE_MOCK === 'true'

function ok<T>(data: T): IResponse<T> {
  return { code: SUCCESS_CODE, data } as IResponse<T>
}

export const getDeviceInfoListApi = async (
  params: DeviceInfoQuery
): Promise<IResponse<DeviceInfoListResult>> => {
  if (useLocalStore) {
    return ok(queryDeviceInfoList(params))
  }
  return request.get({ url: '/mock/lad/device-info/list', params })
}

export const getDeviceInfoDetailApi = async (id: string): Promise<IResponse<DeviceInfoDetail>> => {
  if (useLocalStore) {
    const data = queryDeviceInfoDetail(id)
    if (!data) {
      return Promise.reject(new Error('设备不存在'))
    }
    return ok(data)
  }
  return request.get({ url: '/mock/lad/device-info/detail', params: { id } })
}

export const deleteDeviceInfoApi = async (ids: string[]): Promise<IResponse> => {
  if (useLocalStore) {
    deleteDeviceInfoRecords(ids)
    return ok(true)
  }
  return request.post({ url: '/mock/lad/device-info/delete', data: { ids } })
}

export const saveDeviceInfoApi = async (
  data: DeviceInfoSavePayload
): Promise<IResponse<DeviceInfoItem>> => {
  if (useLocalStore) {
    return ok(saveDeviceInfoRecord(data))
  }
  return request.post({ url: '/mock/lad/device-info/save', data })
}

export const runDeviceSelfCheckApi = async (
  id: string
): Promise<IResponse<DeviceSelfCheckResult>> => {
  if (useLocalStore) {
    const data = queryDeviceSelfCheck(id)
    if (!data) {
      return Promise.reject(new Error('设备不存在'))
    }
    return ok(data)
  }
  return request.post({ url: '/mock/lad/device-info/self-check', data: { id } })
}

export type {
  DeviceInfoDetail,
  DeviceInfoItem,
  DeviceInfoQuery,
  DeviceInfoSavePayload
} from './types'
