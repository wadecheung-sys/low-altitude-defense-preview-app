import request from '@/axios'
import type {
  DictEntryListResult,
  DictEntryQuery,
  DictEntrySavePayload,
  DictTypeListResult,
  DictTypeQuery,
  DictTypeSavePayload,
  SystemParamListResult,
  SystemParamQuery,
  SystemParamSavePayload
} from './types'
import type { DictEntryItem, DictTypeItem, SystemParam } from './types'

export function getSystemParamListApi(
  params: SystemParamQuery
): Promise<IResponse<SystemParamListResult>> {
  return request.get({ url: '/mock/lad/system/params/list', params })
}

export function saveSystemParamApi(
  data: SystemParamSavePayload
): Promise<IResponse<SystemParam>> {
  return request.post({ url: '/mock/lad/system/params/save', data })
}

export function getDictTypeListApi(
  params: DictTypeQuery
): Promise<IResponse<DictTypeListResult>> {
  return request.get({ url: '/mock/lad/system/dict/type/list', params })
}

export function saveDictTypeApi(data: DictTypeSavePayload): Promise<IResponse<DictTypeItem>> {
  return request.post({ url: '/mock/lad/system/dict/type/save', data })
}

export function deleteDictTypeApi(data: { id: string }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/system/dict/type/delete', data })
}

export function getDictEntryListApi(
  params: DictEntryQuery
): Promise<IResponse<DictEntryListResult>> {
  return request.get({ url: '/mock/lad/system/dict/entry/list', params })
}

export function getDictEntriesByCodeApi(
  dictCode: string
): Promise<IResponse<DictEntryItem[]>> {
  return request.get({
    url: '/mock/lad/system/dict/entry/by-code',
    params: { dictCode }
  })
}

export function saveDictEntryApi(data: DictEntrySavePayload): Promise<IResponse<DictEntryItem>> {
  return request.post({ url: '/mock/lad/system/dict/entry/save', data })
}

export function deleteDictEntryApi(data: { ids: string[] }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/system/dict/entry/delete', data })
}
