export interface UserLoginType {
  username: string
  password: string
}

export interface UserType {
  username: string
  password: string
  role: string
  roleId: string
  phone?: string
}

export interface ResetPasswordByPhoneParams {
  phone: string
  code: string
  password: string
}
