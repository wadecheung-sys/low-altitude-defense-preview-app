import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import { queryDeviceMonitorList, queryDeviceRuntimeSnapshot } from './monitorStore'
import type { DeviceMonitorListResult, DeviceMonitorQuery, DeviceRuntimeSnapshot } from './types'

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

export async function getDeviceRuntimeSnapshotApi(
  id: string
): Promise<IResponse<DeviceRuntimeSnapshot>> {
  if (useLocalStore) {
    return ok(queryDeviceRuntimeSnapshot(id))
  }
  return request.get({ url: `/mock/lad/device-monitor/runtime/${id}` })
}

export type {
  DeviceMonitorItem,
  DeviceMonitorQuery,
  DeviceOnlineStatus,
  DeviceRuntimeMetric,
  DeviceRuntimeMetricLevel,
  DeviceRuntimeSnapshot
} from './types'
