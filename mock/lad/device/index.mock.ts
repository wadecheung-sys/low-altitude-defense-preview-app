import { SUCCESS_CODE } from '@/constants'
import {
  queryDeviceArchiveDetail,
  queryDeviceArchiveList,
  deleteDeviceArchiveRecords,
  setDeviceArchiveRecordsEnabled,
  saveDeviceArchiveRecord
} from '@/api/lad/device/archiveStore'
import type {
  DeviceArchiveEnabledPayload,
  DeviceArchiveQuery,
  DeviceArchiveSavePayload
} from '@/api/lad/device/types'

export default [
  {
    url: '/mock/lad/device/archive/list',
    method: 'get',
    timeout: 80,
    response: ({ query }: { query: DeviceArchiveQuery }) => ({
      code: SUCCESS_CODE,
      data: queryDeviceArchiveList(query)
    })
  },
  {
    url: '/mock/lad/device/archive/detail',
    method: 'get',
    timeout: 80,
    response: ({ query }: { query: { id?: string } }) => {
      const data = queryDeviceArchiveDetail(query.id || '')
      if (!data) {
        return { code: 500, message: '档案不存在' }
      }
      return { code: SUCCESS_CODE, data }
    }
  },
  {
    url: '/mock/lad/device/archive/delete',
    method: 'post',
    timeout: 80,
    response: ({ body }: { body: { ids?: string[] } }) => {
      deleteDeviceArchiveRecords(body?.ids || [])
      return { code: SUCCESS_CODE, data: true }
    }
  },
  {
    url: '/mock/lad/device/archive/enabled',
    method: 'post',
    timeout: 80,
    response: ({ body }: { body: DeviceArchiveEnabledPayload }) => {
      setDeviceArchiveRecordsEnabled(body?.ids || [], !!body.enabled)
      return { code: SUCCESS_CODE, data: true }
    }
  },
  {
    url: '/mock/lad/device/archive/save',
    method: 'post',
    timeout: 120,
    response: ({ body }: { body: DeviceArchiveSavePayload }) => {
      try {
        const data = saveDeviceArchiveRecord(body)
        return { code: SUCCESS_CODE, data }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  }
]
