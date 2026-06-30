import request from '@/axios'
import { SUCCESS_CODE } from '@/constants'
import {
  isNewFormatMessageList,
  queryMessageCenterList
} from './messageStore'
import type { MessageCenterListResult, MessageCenterQuery } from './types'

function wrapLocalResponse<T>(data: T): IResponse<T> {
  return {
    code: SUCCESS_CODE,
    data
  } as IResponse<T>
}

export function getMessageCenterListApi(
  params: MessageCenterQuery
): Promise<IResponse<MessageCenterListResult>> {
  return request
    .get<MessageCenterListResult>({ url: '/mock/lad/message/list', params })
    .then((res) =>
      isNewFormatMessageList(res?.data?.list)
        ? res
        : wrapLocalResponse(queryMessageCenterList(params))
    )
    .catch(() => wrapLocalResponse(queryMessageCenterList(params)))
}

export function deleteMessageCenterApi(data: { ids: string[] }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/message/delete', data })
}

export type {
  MessageCenterItem,
  MessageCenterListResult,
  MessageCenterQuery,
  MessageDescriptionSegment
} from './types'

export { listAlarmEnabledEventAttributes } from './messageStore'
export { renderMessageDescriptionSegments } from './messageTemplateRender'
