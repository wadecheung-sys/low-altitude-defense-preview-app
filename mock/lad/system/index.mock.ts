import { SUCCESS_CODE } from '@/constants'
import {
  deleteDictEntries,
  deleteDictType,
  queryDictEntriesByCode,
  queryDictEntryList,
  queryDictTypeList,
  saveDictEntry,
  saveDictType
} from '@/api/lad/system/dictStore'
import { querySystemParamList, saveSystemParam } from '@/api/lad/system/paramStore'
import type { DictEntryQuery, DictTypeQuery, SystemParamQuery } from '@/api/lad/system/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/system/params/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: SystemParamQuery }) => ({
      code: SUCCESS_CODE,
      data: querySystemParamList(query)
    })
  },
  {
    url: '/mock/lad/system/params/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof saveSystemParam>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: saveSystemParam(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/system/dict/type/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: DictTypeQuery }) => ({
      code: SUCCESS_CODE,
      data: queryDictTypeList(query)
    })
  },
  {
    url: '/mock/lad/system/dict/type/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof saveDictType>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: saveDictType(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/system/dict/type/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { id: string } }) => {
      deleteDictType(body.id)
      return { code: SUCCESS_CODE, data: null }
    }
  },
  {
    url: '/mock/lad/system/dict/entry/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: DictEntryQuery }) => ({
      code: SUCCESS_CODE,
      data: queryDictEntryList(query)
    })
  },
  {
    url: '/mock/lad/system/dict/entry/by-code',
    method: 'get',
    timeout,
    response: ({ query }: { query: { dictCode?: string } }) => ({
      code: SUCCESS_CODE,
      data: queryDictEntriesByCode(String(query?.dictCode || ''))
    })
  },
  {
    url: '/mock/lad/system/dict/entry/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof saveDictEntry>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: saveDictEntry(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '保存失败' }
      }
    }
  },
  {
    url: '/mock/lad/system/dict/entry/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => {
      deleteDictEntries(body.ids)
      return { code: SUCCESS_CODE, data: null }
    }
  }
]
