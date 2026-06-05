import { SUCCESS_CODE } from '@/constants'
import {
  confirmLocalHistoryEvent,
  deleteLocalHistoryEvent,
  getLocalHistoryEventDetail,
  queryLocalHistoryEventList
} from '@/api/lad/incident/localHistoryStore'
import type { HistoryEventQuery, ManualConfirmPayload } from '@/api/lad/incident/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/incident/history',
    method: 'get',
    timeout,
    response: ({ query }: { query: HistoryEventQuery }) => ({
      code: SUCCESS_CODE,
      data: queryLocalHistoryEventList(query)
    })
  },
  {
    url: '/mock/lad/incident/history/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => ({
      code: SUCCESS_CODE,
      data: deleteLocalHistoryEvent(body?.ids || [])
    })
  },
  {
    url: '/mock/lad/incident/history/confirm',
    method: 'post',
    timeout,
    response: ({ body }: { body: ManualConfirmPayload }) => ({
      code: SUCCESS_CODE,
      data: confirmLocalHistoryEvent(body)
    })
  },
  {
    url: '/mock/lad/incident/history/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id?: string } }) => {
      const detail = query.id ? getLocalHistoryEventDetail(query.id) : null
      if (!detail) {
        return { code: 500, message: '事件不存在' }
      }
      return { code: SUCCESS_CODE, data: detail }
    }
  }
]
