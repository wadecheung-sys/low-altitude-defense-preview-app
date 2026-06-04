import { SUCCESS_CODE } from '@/constants'
import {
  deleteAreaRegion,
  getAreaRegion,
  queryAreaRegionList,
  saveAreaRegion
} from '@/api/lad/area/areaStore'
import type { AreaRegionQuery, AreaRegionSavePayload } from '@/api/lad/area/types'

export default [
  {
    url: '/mock/lad/area/list',
    method: 'get',
    timeout: 80,
    response: ({ query }: { query: AreaRegionQuery }) => ({
      code: SUCCESS_CODE,
      data: queryAreaRegionList(query)
    })
  },
  {
    url: '/mock/lad/area/detail',
    method: 'get',
    timeout: 80,
    response: ({ query }: { query: { id?: string } }) => {
      const data = getAreaRegion(query.id || '')
      if (!data) {
        return { code: 500, message: '区域不存在' }
      }
      return { code: SUCCESS_CODE, data }
    }
  },
  {
    url: '/mock/lad/area/save',
    method: 'post',
    timeout: 120,
    response: ({ body }: { body: AreaRegionSavePayload }) => {
      try {
        const data = saveAreaRegion(body)
        return { code: SUCCESS_CODE, data }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/area/delete',
    method: 'post',
    timeout: 80,
    response: ({ body }: { body: { id?: string } }) => {
      if (body?.id) {
        deleteAreaRegion(body.id)
      }
      return { code: SUCCESS_CODE, data: true }
    }
  }
]
