import request from '@/axios'
import type {
  IntegrationDetailResult,
  IntegrationListResult,
  IntegrationProbeRecord,
  IntegrationQuery,
  IntegrationReconnectResult,
  IntegrationSummary
} from './types'

export function getIntegrationSummaryApi(): Promise<IResponse<IntegrationSummary>> {
  return request.get({ url: '/mock/lad/integration/summary' })
}

export function getIntegrationListApi(
  params: IntegrationQuery
): Promise<IResponse<IntegrationListResult>> {
  return request.get({ url: '/mock/lad/integration/list', params })
}

export function getIntegrationDetailApi(params: {
  id: string
}): Promise<IResponse<IntegrationDetailResult>> {
  return request.get({ url: '/mock/lad/integration/detail', params })
}

export function probeIntegrationApi(data: {
  ids?: string[]
}): Promise<IResponse<IntegrationProbeRecord[]>> {
  return request.post({ url: '/mock/lad/integration/probe', data })
}

export function reconnectIntegrationApi(data: {
  id: string
}): Promise<IResponse<IntegrationReconnectResult>> {
  return request.post({ url: '/mock/lad/integration/reconnect', data })
}
