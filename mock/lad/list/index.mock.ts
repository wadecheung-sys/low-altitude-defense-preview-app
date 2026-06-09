import { SUCCESS_CODE } from '@/constants'
import {
  deleteLocalBlackWhite,
  getLocalBlackWhiteDetail,
  queryLocalBlackWhiteList,
  saveLocalBlackWhite,
  updateLocalBlackWhiteListType
} from '@/api/lad/list/localBlackWhiteStore'
import type {
  BlackWhiteFormPayload,
  BlackWhiteListQuery,
  BlackWhiteTargetListTypePayload
} from '@/api/lad/list/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/list/black-white',
    method: 'get',
    timeout,
    response: ({ query }: { query: BlackWhiteListQuery }) => {
      return {
        code: SUCCESS_CODE,
        data: queryLocalBlackWhiteList(query)
      }
    }
  },
  {
    url: '/mock/lad/list/black-white/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => ({
      code: SUCCESS_CODE,
      data: deleteLocalBlackWhite(body?.ids || [])
    })
  },
  {
    url: '/mock/lad/list/black-white/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id?: string } }) => {
      const detail = query.id ? getLocalBlackWhiteDetail(query.id) : null
      if (!detail) {
        return { code: 500, message: '记录不存在' }
      }
      return { code: SUCCESS_CODE, data: detail }
    }
  },
  {
    url: '/mock/lad/list/black-white/list-type',
    method: 'post',
    timeout,
    response: ({ body }: { body: BlackWhiteTargetListTypePayload }) => {
      const detail = updateLocalBlackWhiteListType(body)
      if (!detail) {
        return { code: 500, message: '记录不存在' }
      }
      return { code: SUCCESS_CODE, data: detail }
    }
  },
  {
    url: '/mock/lad/list/black-white/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: BlackWhiteFormPayload }) => ({
      code: SUCCESS_CODE,
      data: saveLocalBlackWhite(body)
    })
  }
]
