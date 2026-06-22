<script setup lang="tsx">
import { reactive, ref, watch, onMounted, unref } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCheckbox, ElLink, ElMessage } from 'element-plus'
import { useForm } from '@/hooks/web/useForm'
import { loginApi, getTestRoleApi, getAdminRoleApi } from '@/api/login'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import { resetRouter } from '@/router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { useUserStore } from '@/store/modules/user'
import { BaseButton } from '@/components/Button'
import logoImg from '@/assets/imgs/logo.png'
import ForgotPasswordDialog from './ForgotPasswordDialog.vue'
import { LAD_HOME_PATH } from '@/constants/lad'

const { required } = useValidator()

const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const { currentRoute, addRoute, push } = useRouter()
const { t } = useI18n()

const rules = {
  username: [required()],
  password: [required()]
}

const schema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => (
          <h2 class="text-2xl font-bold text-center w-[100%] text-[#303133]">
            {t('login.platformTitle')}
          </h2>
        )
      }
    }
  },
  {
    field: 'logo',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => (
          <div class="flex justify-center mb-10px w-[100%]">
            <img src={logoImg} alt="LOGO" class="max-h-56px max-w-200px object-contain" />
          </div>
        )
      }
    }
  },
  {
    field: 'username',
    label: t('login.username'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.usernamePlaceholder')
    }
  },
  {
    field: 'password',
    label: t('login.password'),
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      placeholder: t('login.passwordPlaceholder'),
      onKeydown: (_e: KeyboardEvent) => {
        if (_e.key === 'Enter') {
          _e.stopPropagation()
          signIn()
        }
      }
    }
  },
  {
    field: 'tool',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => (
          <div class="flex justify-between items-center w-[100%]">
            <ElCheckbox v-model={remember.value} label={t('login.remember')} size="small" />
            <ElLink type="primary" underline={false} onClick={openForgotPassword}>
              {t('login.forgetPassword')}
            </ElLink>
          </div>
        )
      }
    }
  },
  {
    field: 'login',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => (
          <div class="w-[100%]">
            <BaseButton loading={loading.value} type="primary" class="w-[100%]" onClick={signIn}>
              {t('login.login')}
            </BaseButton>
          </div>
        )
      }
    }
  },
  {
    field: 'copyright',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => (
          <p class="text-12px text-[var(--el-text-color-secondary)] text-center w-[100%] m-0 mt-10px">
            {t('login.copyright')}
          </p>
        )
      }
    }
  }
])

const remember = ref(userStore.getRememberMe)
const forgotVisible = ref(false)

const { formRegister, formMethods } = useForm()
const { getFormData, getElFormExpose, setValues } = formMethods

const openForgotPassword = () => {
  forgotVisible.value = true
}

const onResetSuccess = (username?: string) => {
  if (username) {
    setValues({ username, password: '' })
  }
}

const initLoginInfo = () => {
  const loginInfo = userStore.getLoginInfo
  if (loginInfo) {
    const { username, password } = loginInfo
    setValues({ username, password })
  }
}

onMounted(() => {
  initLoginInfo()
})

const loading = ref(false)
const redirect = ref<string>('')

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  { immediate: true }
)

const signIn = async () => {
  const formRef = await getElFormExpose()
  await formRef?.validate(async (isValid) => {
    if (isValid) {
      loading.value = true
      const formData = await getFormData<UserType>()

      try {
        const res = await loginApi(formData)

        if (res?.data) {
          if (unref(remember)) {
            userStore.setLoginInfo({
              username: formData.username,
              password: formData.password
            })
          } else {
            userStore.setLoginInfo(undefined)
          }
          userStore.setRememberMe(unref(remember))
          userStore.setUserInfo(res.data)
          if (appStore.getDynamicRouter) {
            getRole()
          } else {
            await permissionStore.generateRoutes('static').catch(() => {})
            resetRouter()
            permissionStore.getAddRouters.forEach((route) => {
              addRoute(route as RouteRecordRaw)
            })
            permissionStore.setIsAddRouters(true)
            push({ path: redirect.value || LAD_HOME_PATH })
          }
        } else {
          ElMessage.error('登录失败，请检查账号密码或确认开发服务已启动（Mock）')
        }
      } catch {
        ElMessage.error('无法连接登录服务，请执行 cd preview-app && npm run dev')
      } finally {
        loading.value = false
      }
    }
  })
}

const getRole = async () => {
  const formData = await getFormData<UserType>()
  const params = { roleName: formData.username }
  const res =
    appStore.getDynamicRouter && appStore.getServerDynamicRouter
      ? await getAdminRoleApi(params)
      : await getTestRoleApi(params)
  if (res) {
    const routers = res.data || []
    userStore.setRoleRouters(routers)
    appStore.getDynamicRouter && appStore.getServerDynamicRouter
      ? await permissionStore.generateRoutes('server', routers).catch(() => {})
      : await permissionStore.generateRoutes('frontEnd', routers).catch(() => {})

    resetRouter()
    permissionStore.getAddRouters.forEach((route) => {
      addRoute(route as RouteRecordRaw)
    })
    permissionStore.setIsAddRouters(true)
    push({ path: redirect.value || LAD_HOME_PATH })
  }
}
</script>

<template>
  <Form
    :schema="schema"
    :rules="rules"
    label-position="top"
    hide-required-asterisk
    size="large"
    class="lad-login-form dark:(border-1 border-[var(--el-border-color)] border-solid)"
    @register="formRegister"
  />
  <ForgotPasswordDialog v-model="forgotVisible" @success="onResetSuccess" />
</template>
