import { SUCCESS_CODE } from '@/constants'
import {
  deletePlans,
  getPlan,
  listPlanOptions,
  queryPlanList,
  savePlan,
  simulatePlan,
  syncPlansFromSeed,
  togglePlanEnabled
} from '@/api/lad/plan/planStore'
import type { PlanSimulateInput, PlanStrategyQuery } from '@/api/lad/plan/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/plan/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: PlanStrategyQuery }) => {
      syncPlansFromSeed()
      return {
        code: SUCCESS_CODE,
        data: queryPlanList(query)
      }
    }
  },
  {
    url: '/mock/lad/plan/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id: string } }) => {
      const data = getPlan(query.id)
      if (!data) return { code: 404, message: '\u9884\u6848\u4e0d\u5b58\u5728' }
      return { code: SUCCESS_CODE, data }
    }
  },
  {
    url: '/mock/lad/plan/options',
    method: 'get',
    timeout,
    response: () => ({ code: SUCCESS_CODE, data: listPlanOptions() })
  },
  {
    url: '/mock/lad/plan/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof savePlan>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: savePlan(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '\u4fdd\u5b58\u5931\u8d25' }
      }
    }
  },
  {
    url: '/mock/lad/plan/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => {
      deletePlans(body.ids)
      return { code: SUCCESS_CODE, data: null }
    }
  },
  {
    url: '/mock/lad/plan/toggle',
    method: 'post',
    timeout,
    response: ({ body }: { body: { id: string; enabled: boolean } }) => {
      try {
        togglePlanEnabled(body.id, body.enabled)
        return { code: SUCCESS_CODE, data: null }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '\u64cd\u4f5c\u5931\u8d25' }
      }
    }
  },
  {
    url: '/mock/lad/plan/simulate',
    method: 'post',
    timeout,
    response: ({ body }: { body: PlanSimulateInput }) => {
      syncPlansFromSeed()
      return {
        code: SUCCESS_CODE,
        data: simulatePlan(body)
      }
    }
  }
]
