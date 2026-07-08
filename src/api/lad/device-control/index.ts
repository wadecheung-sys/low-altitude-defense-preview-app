import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import { dispatchDeviceCommand } from './controlStore'
import type { DeviceCommandRequest, DeviceCommandResult } from './types'

const useLocalStore = import.meta.env.VITE_USE_MOCK === 'true'

function ok<T>(data: T): IResponse<T> {
  return { code: SUCCESS_CODE, data } as IResponse<T>
}

export const postDeviceCommandApi = async (
  data: DeviceCommandRequest
): Promise<IResponse<DeviceCommandResult>> => {
  if (useLocalStore) {
    return ok(dispatchDeviceCommand(data))
  }
  return request.post({ url: '/mock/lad/device-control/command', data })
}

export type { DeviceCommandRequest, DeviceCommandResult } from './types'
