import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

/** Mock 短信验证码（演示环境固定） */
const MOCK_SMS_CODE = '123456'

const smsCodeStore = new Map<string, { code: string; expireAt: number }>()

const List: {
  username: string
  password: string
  role: string
  roleId: string
  phone: string
  permissions: string | string[]
}[] = [
  {
    username: 'admin',
    password: 'admin',
    role: 'admin',
    roleId: '1',
    phone: '13800138000',
    permissions: ['*.*.*']
  },
  {
    username: 'test',
    password: 'test',
    role: 'test',
    roleId: '2',
    phone: '13900139000',
    permissions: ['example:dialog:create', 'example:dialog:delete']
  }
]

const findUserByPhone = (phone: string) => List.find((item) => item.phone === phone)

export default [
  {
    url: '/mock/user/list',
    method: 'get',
    response: ({ query }) => {
      const { username, pageIndex, pageSize } = query

      const mockList = List.filter((item) => {
        if (username && item.username.indexOf(username) < 0) return false
        return true
      })
      const pageList = mockList.filter(
        (_, index) => index < pageSize * pageIndex && index >= pageSize * (pageIndex - 1)
      )

      return {
        code: SUCCESS_CODE,
        data: {
          total: mockList.length,
          list: pageList
        }
      }
    }
  },
  {
    url: '/mock/user/login',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const data = body
      for (const user of List) {
        if (user.username === data.username && user.password === data.password) {
          return {
            code: SUCCESS_CODE,
            data: user
          }
        }
      }
      return {
        code: 500,
        message: '账号或密码错误'
      }
    }
  },
  {
    url: '/mock/user/loginOut',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        data: null
      }
    }
  },
  {
    url: '/mock/user/sendResetCode',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const { phone } = body || {}
      if (!phone) {
        return { code: 500, message: '请输入手机号' }
      }
      if (!/^1[3456789]\d{9}$/.test(phone)) {
        return { code: 500, message: '手机号格式不正确' }
      }
      const user = findUserByPhone(phone)
      if (!user) {
        return { code: 500, message: '该手机号未绑定系统账号' }
      }
      smsCodeStore.set(phone, {
        code: MOCK_SMS_CODE,
        expireAt: Date.now() + 5 * 60 * 1000
      })
      return {
        code: SUCCESS_CODE,
        data: {
          message: `验证码已发送（演示码：${MOCK_SMS_CODE}）`
        }
      }
    }
  },
  {
    url: '/mock/user/resetPasswordByPhone',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const { phone, code, password } = body || {}
      if (!phone || !code || !password) {
        return { code: 500, message: '请完整填写找回信息' }
      }
      if (password.length < 6) {
        return { code: 500, message: '新密码至少 6 位' }
      }
      const user = findUserByPhone(phone)
      if (!user) {
        return { code: 500, message: '该手机号未绑定系统账号' }
      }
      const record = smsCodeStore.get(phone)
      if (!record || record.expireAt < Date.now()) {
        return { code: 500, message: '验证码已过期，请重新获取' }
      }
      if (code !== record.code) {
        return { code: 500, message: '验证码错误' }
      }
      user.password = password
      smsCodeStore.delete(phone)
      return {
        code: SUCCESS_CODE,
        data: {
          username: user.username,
          message: '密码已重置，请使用新密码登录'
        }
      }
    }
  }
]
