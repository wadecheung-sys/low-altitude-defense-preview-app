import { SUCCESS_CODE } from '@/constants'
import {
  assessThreatRule,
  deleteThreatRules,
  getThreatRule,
  queryThreatRuleList,
  saveThreatRule,
  simulateThreat,
  syncRulesFromSeed,
  toggleThreatRuleEnabled
} from '@/api/lad/threat/threatStore'
import type { ThreatRuleQuery, ThreatSimulateInput } from '@/api/lad/threat/types'

const timeout = 300

export default [
  {
    url: '/mock/lad/threat/rule/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: ThreatRuleQuery }) => {
      syncRulesFromSeed()
      return { code: SUCCESS_CODE, data: queryThreatRuleList(query) }
    }
  },
  {
    url: '/mock/lad/threat/rule/detail',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id: string } }) => {
      syncRulesFromSeed()
      const data = getThreatRule(query.id)
      if (!data) return { code: 404, message: '\u89c4\u5219\u4e0d\u5b58\u5728' }
      return { code: SUCCESS_CODE, data }
    }
  },
  {
    url: '/mock/lad/threat/rule/save',
    method: 'post',
    timeout,
    response: ({ body }: { body: Parameters<typeof saveThreatRule>[0] }) => {
      try {
        return { code: SUCCESS_CODE, data: saveThreatRule(body) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '\u4fdd\u5b58\u5931\u8d25' }
      }
    }
  },
  {
    url: '/mock/lad/threat/rule/delete',
    method: 'post',
    timeout,
    response: ({ body }: { body: { ids: string[] } }) => {
      deleteThreatRules(body.ids)
      return { code: SUCCESS_CODE, data: null }
    }
  },
  {
    url: '/mock/lad/threat/rule/toggle',
    method: 'post',
    timeout,
    response: ({ body }: { body: { id: string; enabled: boolean } }) => {
      try {
        toggleThreatRuleEnabled(body.id, body.enabled)
        return { code: SUCCESS_CODE, data: null }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '\u64cd\u4f5c\u5931\u8d25' }
      }
    }
  },
  {
    url: '/mock/lad/threat/simulate',
    method: 'post',
    timeout: 800,
    response: ({ body }: { body: ThreatSimulateInput }) => ({
      code: SUCCESS_CODE,
      data: simulateThreat(body)
    })
  },
  {
    url: '/mock/lad/threat/assess',
    method: 'get',
    timeout,
    response: ({ query }: { query: { id: string } }) => {
      try {
        return { code: SUCCESS_CODE, data: assessThreatRule(query.id) }
      } catch (e) {
        return { code: 500, message: e instanceof Error ? e.message : '\u52a0\u8f7d\u5931\u8d25' }
      }
    }
  }
]
