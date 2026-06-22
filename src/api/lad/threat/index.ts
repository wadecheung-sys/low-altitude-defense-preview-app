import request from '@/axios'
import type {
  ThreatAssessResult,
  ThreatRule,
  ThreatRuleListResult,
  ThreatRuleQuery,
  ThreatRuleSavePayload,
  ThreatSimulateInput,
  ThreatSimulateResult
} from './types'

export function getThreatRuleListApi(
  params: ThreatRuleQuery
): Promise<IResponse<ThreatRuleListResult>> {
  return request.get({ url: '/mock/lad/threat/rule/list', params })
}

export function getThreatRuleDetailApi(params: { id: string }): Promise<IResponse<ThreatRule>> {
  return request.get({ url: '/mock/lad/threat/rule/detail', params })
}

export function saveThreatRuleApi(data: ThreatRuleSavePayload): Promise<IResponse<ThreatRule>> {
  return request.post({ url: '/mock/lad/threat/rule/save', data })
}

export function deleteThreatRuleApi(data: { ids: string[] }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/threat/rule/delete', data })
}

export function toggleThreatRuleEnabledApi(data: {
  id: string
  enabled: boolean
}): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/threat/rule/toggle', data })
}

export function simulateThreatApi(
  data: ThreatSimulateInput
): Promise<IResponse<ThreatSimulateResult>> {
  return request.post({ url: '/mock/lad/threat/simulate', data })
}

export function assessThreatRuleApi(params: {
  id: string
}): Promise<IResponse<ThreatAssessResult>> {
  return request.get({ url: '/mock/lad/threat/assess', params })
}
