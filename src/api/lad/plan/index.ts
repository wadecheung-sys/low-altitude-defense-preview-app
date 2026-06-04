import request from '@/axios'
import type {
  PlanStrategy,
  PlanStrategyListResult,
  PlanStrategyQuery,
  PlanStrategySavePayload
} from './types'

export function getPlanListApi(params: PlanStrategyQuery): Promise<IResponse<PlanStrategyListResult>> {
  return request.get({ url: '/mock/lad/plan/list', params })
}

export function getPlanDetailApi(params: { id: string }): Promise<IResponse<PlanStrategy>> {
  return request.get({ url: '/mock/lad/plan/detail', params })
}

export function getPlanOptionsApi(): Promise<
  IResponse<{ id: string; planCode: string; planName: string; enabled: boolean }[]>
> {
  return request.get({ url: '/mock/lad/plan/options' })
}

export function savePlanApi(data: PlanStrategySavePayload): Promise<IResponse<PlanStrategy>> {
  return request.post({ url: '/mock/lad/plan/save', data })
}

export function deletePlanApi(data: { ids: string[] }): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/plan/delete', data })
}

export function togglePlanEnabledApi(data: {
  id: string
  enabled: boolean
}): Promise<IResponse<null>> {
  return request.post({ url: '/mock/lad/plan/toggle', data })
}
