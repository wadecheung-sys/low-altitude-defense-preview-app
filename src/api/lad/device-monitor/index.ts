import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import { queryDeviceMonitorList } from './monitorStore'
import type { DeviceMonitorListResult, DeviceMonitorQuery } from './types'

const useLocalStore = import.meta.env.VITE_USE_MOCK === 'true'

function ok<T>(data: T): IResponse<T> {
  return { code: SUCCESS_CODE, data } as IResponse<T>
}

export async function getDeviceMonitorListApi(
  params: DeviceMonitorQuery
): Promise<IResponse<DeviceMonitorListResult>> {
  if (useLocalStore) {
    return ok(queryDeviceMonitorList(params))
  }
  return request.get({ url: '/mock/lad/device-monitor/list', params })
}

export type { DeviceMonitorItem, DeviceMonitorQuery, DeviceOnlineStatus } from './types'
