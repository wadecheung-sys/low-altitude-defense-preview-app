import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import { deleteDeviceGroupRecords, queryDeviceGroupList, saveDeviceGroupRecord } from './groupStore'
import {
  deleteDeviceLinkageRecords,
  queryDeviceLinkageList,
  saveDeviceLinkageRecord
} from './linkageStore'

export { getDeviceGroupsByRefIds } from './groupStore'
export { getLinkageByMasterDeviceId } from './linkageStore'
export {
  buildLinkedChain,
  deriveGroupType,
  isCameraDevice,
  isMasterDevice,
  resolveMasterDevice
} from './deviceGroupCatalog'
import type {
  DeviceGroupItem,
  DeviceGroupListResult,
  DeviceGroupQuery,
  DeviceGroupSavePayload,
  DeviceLinkageItem,
  DeviceLinkageListResult,
  DeviceLinkageQuery,
  DeviceLinkageSavePayload
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

export const deleteDeviceGroupApi = async (ids: string[]): Promise<IResponse<true>> => {
  if (useLocalStore) {
    deleteDeviceGroupRecords(ids)
    return ok(true)
  }
  return request.post({ url: '/mock/lad/device/group/delete', data: { ids } })
}

export const getDeviceLinkageListApi = async (
  params: DeviceLinkageQuery
): Promise<IResponse<DeviceLinkageListResult>> => {
  if (useLocalStore) {
    return ok(queryDeviceLinkageList(params))
  }
  return request.get({ url: '/mock/lad/device/linkage/list', params })
}

export const saveDeviceLinkageApi = async (
  data: DeviceLinkageSavePayload
): Promise<IResponse<DeviceLinkageItem>> => {
  if (useLocalStore) {
    return ok(saveDeviceLinkageRecord(data))
  }
  return request.post({ url: '/mock/lad/device/linkage/save', data })
}

export const deleteDeviceLinkageApi = async (ids: string[]): Promise<IResponse<true>> => {
  if (useLocalStore) {
    deleteDeviceLinkageRecords(ids)
    return ok(true)
  }
  return request.post({ url: '/mock/lad/device/linkage/delete', data: { ids } })
}

export type {
  DeviceGroupItem,
  DeviceGroupListResult,
  DeviceGroupQuery,
  DeviceGroupSavePayload,
  DeviceLinkageItem,
  DeviceLinkageListResult,
  DeviceLinkageQuery,
  DeviceLinkageSavePayload
} from './types'
