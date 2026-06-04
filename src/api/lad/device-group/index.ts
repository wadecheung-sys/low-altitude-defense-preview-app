import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import { deleteDeviceGroupRecord, queryDeviceGroupList, saveDeviceGroupRecord } from './groupStore'
import type {
  DeviceGroupItem,
  DeviceGroupListResult,
  DeviceGroupQuery,
  DeviceGroupSavePayload
} from './types'

const useLocalStore = import.meta.env.VITE_USE_MOCK === 'true'

function ok<T>(data: T): IResponse<T> {
  return { code: SUCCESS_CODE, data } as IResponse<T>
}

export const getDeviceGroupListApi = async (
  params: DeviceGroupQuery
): Promise<IResponse<DeviceGroupListResult>> => {
  if (useLocalStore) {
    return ok(queryDeviceGroupList(params))
  }
  return request.get({ url: '/mock/lad/device/group/list', params })
}

export const saveDeviceGroupApi = async (
  data: DeviceGroupSavePayload
): Promise<IResponse<DeviceGroupItem>> => {
  if (useLocalStore) {
    return ok(saveDeviceGroupRecord(data))
  }
  return request.post({ url: '/mock/lad/device/group/save', data })
}

export const deleteDeviceGroupApi = async (id: string): Promise<IResponse<true>> => {
  if (useLocalStore) {
    deleteDeviceGroupRecord(id)
    return ok(true)
  }
  return request.post({ url: '/mock/lad/device/group/delete', data: { id } })
}
