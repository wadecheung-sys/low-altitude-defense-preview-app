import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import { store } from '../index'
import { UserLoginType, UserType } from '@/api/login/types'
import { ElMessageBox } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { loginOutApi } from '@/api/login'
import { useTagsViewStore } from './tagsView'
import router, { resetRouter } from '@/router'
import { usePermissionStoreWithOut } from './permission'
import { useLockStoreWithOut } from './lock'

const USER_PERSIST_KEY = 'user'
const LOCK_PERSIST_KEY = 'lock'

interface UserState {
  userInfo?: UserType
  tokenKey: string
  token: string
  roleRouters?: string[] | AppCustomRouteRecordRaw[]
  rememberMe: boolean
  loginInfo?: UserLoginType
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    return {
      userInfo: undefined,
      tokenKey: 'Authorization',
      token: '',
      roleRouters: undefined,
      // 记住我
      rememberMe: true,
      loginInfo: undefined
    }
  },
  getters: {
    getTokenKey(): string {
      return this.tokenKey
    },
    getToken(): string {
      return this.token
    },
    getUserInfo(): UserType | undefined {
      return this.userInfo
    },
    getRoleRouters(): string[] | AppCustomRouteRecordRaw[] | undefined {
      return this.roleRouters
    },
    getRememberMe(): boolean {
      return this.rememberMe
    },
    getLoginInfo(): UserLoginType | undefined {
      return this.loginInfo
    },
    /** 是否已登录（用于路由守卫，避免仅清空路由却残留 userInfo 时无法进入登录页） */
    isLoggedIn(): boolean {
      return Boolean(this.userInfo?.username)
    }
  },
  actions: {
    setTokenKey(tokenKey: string) {
      this.tokenKey = tokenKey
    },
    setToken(token: string) {
      this.token = token
    },
    setUserInfo(userInfo?: UserType) {
      this.userInfo = userInfo
    },
    setRoleRouters(roleRouters?: string[] | AppCustomRouteRecordRaw[]) {
      this.roleRouters = roleRouters
    },
    clearPersistedSession() {
      try {
        localStorage.removeItem(USER_PERSIST_KEY)
        localStorage.removeItem(LOCK_PERSIST_KEY)
      } catch {
        /* ignore */
      }
    },
    logoutConfirm() {
      const { t } = useI18n()
      ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
        confirmButtonText: t('common.ok'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
        .then(async () => {
          try {
            await loginOutApi()
          } catch {
            /* 接口失败也应完成本地退出 */
          }
          await this.reset()
        })
        .catch(() => {})
    },
    async reset() {
      const tagsViewStore = useTagsViewStore()
      const permissionStore = usePermissionStoreWithOut()
      const lockStore = useLockStoreWithOut()

      // 先清登录态，避免导航到 /login 时被守卫重定向回业务首页
      this.setToken('')
      this.setUserInfo(undefined)
      this.setRoleRouters(undefined)
      lockStore.resetLockInfo()
      this.clearPersistedSession()

      tagsViewStore.delAllViews()
      permissionStore.$reset()
      resetRouter()

      await nextTick()
      await router.replace('/login')
    },
    logout() {
      return this.reset()
    },
    setRememberMe(rememberMe: boolean) {
      this.rememberMe = rememberMe
    },
    setLoginInfo(loginInfo: UserLoginType | undefined) {
      this.loginInfo = loginInfo
    }
  },
  persist: true
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
