import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

/** LAD 使用静态 ladRoutes；动态路由 Mock 保留空壳，避免设置项误开后登录报错 */
export default [
  {
    url: '/mock/role/list',
    method: 'get',
    timeout,
    response: () => ({
      code: SUCCESS_CODE,
      data: []
    })
  },
  {
    url: '/mock/role/list2',
    method: 'get',
    timeout,
    response: () => ({
      code: SUCCESS_CODE,
      data: []
    })
  }
]
