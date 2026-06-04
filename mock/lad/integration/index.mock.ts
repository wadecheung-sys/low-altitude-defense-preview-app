import { SUCCESS_CODE } from '@/constants'
import {
  getIntegrationDetail,
  getIntegrationSummary,
  probeIntegration,
  queryIntegrationList,
  reconnectIntegration
} from '@/api/lad/integration/integrationStore'
import type { IntegrationQuery } from '@/api/lad/integration/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/integration/summary',
    method: 'get',
    timeout,
    response: () => ({ code: SUCCESS_CODE, data: getIntegrationSummary() })
  },
  {
    url: '/mock/lad/integration/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: IntegrationQuery }) => ({
      code: SUCCESS_CODE,
      data: queryIntegrationList(query)
    })
  },
  {
    url: '/mock/lad/integration/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id: string } }) => {
      const data = getIntegrationDetail(query.id)
      if (!data) return { code: 404, message: '对接项不存在' }
      return { code: SUCCESS_CODE, data }
    }
  },
  {
    url: '/mock/lad/integration/probe',
    method: 'post',
    timeout: 800,
    response: ({ body }: { body: { ids?: string[] } }) => ({
      code: SUCCESS_CODE,
      data: probeIntegration(body?.ids)
    })
  },
  {
    url: '/mock/lad/integration/reconnect',
    method: 'post',
    timeout: 1000,
    response: ({ body }: { body: { id: string } }) => {
      try {
        return { code: SUCCESS_CODE, data: reconnectIntegration(body.id) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '\u91cd\u8fde\u5931\u8d25' }
      }
    }
  }
]
