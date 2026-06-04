import { SUCCESS_CODE } from '@/constants'
import { queryDeviceMonitorList } from '@/api/lad/device-monitor/monitorStore'
import type { DeviceMonitorQuery } from '@/api/lad/device-monitor/types'

export default [
  {
    url: '/mock/lad/device-monitor/list',
    method: 'get',
    timeout: 120,
    response: ({ query }: { query: DeviceMonitorQuery }) => ({
      code: SUCCESS_CODE,
      data: queryDeviceMonitorList(query)
    })
  }
]
