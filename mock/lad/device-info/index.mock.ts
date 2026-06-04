import { SUCCESS_CODE } from '@/constants'
import {
  deleteDeviceInfoRecords,
  queryDeviceInfoDetail,
  queryDeviceInfoList,
  queryDeviceSelfCheck,
  saveDeviceInfoRecord
} from '@/api/lad/device-info/infoStore'
import type { DeviceInfoQuery, DeviceInfoSavePayload } from '@/api/lad/device-info/types'

export default [
  {
    url: '/mock/lad/device-info/list',
    method: 'get',
    timeout: 80,
    response: ({ query }: { query: DeviceInfoQuery }) => ({
      code: SUCCESS_CODE,
      data: queryDeviceInfoList(query)
    })
  },
  {
    url: '/mock/lad/device-info/detail',
    method: 'get',
    timeout: 80,
    response: ({ query }: { query: { id?: string } }) => {
      const data = queryDeviceInfoDetail(query.id || '')
      if (!data) {
        return { code: 500, message: '设备不存在' }
      }
      return { code: SUCCESS_CODE, data }
    }
  },
  {
    url: '/mock/lad/device-info/delete',
    method: 'post',
    timeout: 80,
    response: ({ body }: { body: { ids?: string[] } }) => {
      deleteDeviceInfoRecords(body?.ids || [])
      return { code: SUCCESS_CODE, data: true }
    }
  },
  {
    url: '/mock/lad/device-info/save',
    method: 'post',
    timeout: 120,
    response: ({ body }: { body: DeviceInfoSavePayload }) => {
      try {
        const data = saveDeviceInfoRecord(body)
        return { code: SUCCESS_CODE, data }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/device-info/self-check',
    method: 'post',
    timeout: 800,
    response: ({ body }: { body: { id?: string } }) => {
      const data = queryDeviceSelfCheck(body?.id || '')
      if (!data) {
        return { code: 500, message: '设备不存在' }
      }
      return { code: SUCCESS_CODE, data }
    }
  }
]
