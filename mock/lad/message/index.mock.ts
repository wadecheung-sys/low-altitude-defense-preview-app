import { SUCCESS_CODE } from '@/constants'
import { deleteMessageCenterItems, queryMessageCenterList } from '@/api/lad/message/messageStore'
import type { MessageCenterQuery } from '@/api/lad/message/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/message/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: MessageCenterQuery }) => ({
      code: SUCCESS_CODE,
      data: queryMessageCenterList(query)
    })
  },
  {
    url: '/mock/lad/message/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => {
      deleteMessageCenterItems(body.ids || [])
      return { code: SUCCESS_CODE, data: null }
    }
  }
]
