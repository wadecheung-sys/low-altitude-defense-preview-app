import request from '@/axios'
import type { DeviceMonitorListResult, DeviceMonitorQuery } from './types'

export function getDeviceMonitorListApi(
  params: DeviceMonitorQuery
): Promise<IResponse<DeviceMonitorListResult>> {
  return request.get({ url: '/mock/lad/device-monitor/list', params })
}

export type { DeviceMonitorItem, DeviceMonitorQuery, DeviceOnlineStatus } from './types'
