import { SUCCESS_CODE } from '@/constants'
import { dispatchDeviceCommand } from '@/api/lad/device-control/controlStore'
import type { DeviceCommandRequest } from '@/api/lad/device-control/types'

export default [
  {
    url: '/mock/lad/device-control/command',
    method: 'post',
    timeout: 320,
    response: ({ body }: { body: DeviceCommandRequest }) => {
      if (!body?.deviceRecordId?.trim()) {
        return { code: 500, message: '缺少设备记录 id' }
      }
      if (!body.actionKey?.trim() || !body.actionLabel?.trim()) {
        return { code: 500, message: '缺少操作指令' }
      }
      return {
        code: SUCCESS_CODE,
        data: dispatchDeviceCommand(body)
      }
    }
  }
]
