import request from '@/axios'
import type { MessageCenterListResult, MessageCenterQuery } from './types'

export function getMessageCenterListApi(
  params: MessageCenterQuery
): Promise<IResponse<MessageCenterListResult>> {
  return request.get({ url: '/mock/lad/message/list', params })
}

export function deleteMessageCenterApi(data: { ids: string[] }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/message/delete', data })
}

export type {
  MessageCenterItem,
  MessageCenterListResult,
  MessageCenterQuery,
  MessageDescriptionSegment,
  MessageEventName
} from './types'
