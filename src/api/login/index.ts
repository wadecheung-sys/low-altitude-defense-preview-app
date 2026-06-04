import request from '@/axios'
import type { ResetPasswordByPhoneParams, UserType } from './types'

interface RoleParams {
  roleName: string
}

export const loginApi = (data: UserType): Promise<IResponse<UserType>> => {
  return request.post({ url: '/mock/user/login', data })
}

export const loginOutApi = (): Promise<IResponse> => {
  return request.get({ url: '/mock/user/loginOut' })
}

export const getUserListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    code: string
    data: {
      list: UserType[]
      total: number
    }
  }>({ url: '/mock/user/list', params })
}

export const getAdminRoleApi = (
  params: RoleParams
): Promise<IResponse<AppCustomRouteRecordRaw[]>> => {
  return request.get({ url: '/mock/role/list', params })
}

export const getTestRoleApi = (params: RoleParams): Promise<IResponse<string[]>> => {
  return request.get({ url: '/mock/role/list2', params })
}

export const sendResetSmsApi = (phone: string): Promise<IResponse<{ message: string }>> => {
  return request.post({ url: '/mock/user/sendResetCode', data: { phone } })
}

export const resetPasswordByPhoneApi = (
  data: ResetPasswordByPhoneParams
): Promise<IResponse<{ username: string; message: string }>> => {
  return request.post({ url: '/mock/user/resetPasswordByPhone', data })
}
