<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { useI18n } from '@/hooks/web/useI18n'
import { useValidator } from '@/hooks/web/useValidator'
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { resetPasswordByPhoneApi, sendResetSmsApi } from '@/api/login'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const { t } = useI18n()
const { required, phone, notSpace } = useValidator()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const codeLoading = ref(false)
const codeCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: unknown, val: string, callback: (err?: Error) => void) => {
  if (!val) {
    callback(new Error(t('login.resetConfirmRequired')))
    return
  }
  if (val !== form.password) {
    callback(new Error(t('login.resetConfirmMismatch')))
    return
  }
  callback()
}

const rules = reactive<FormRules>({
  phone: [required(t('login.phoneRequired')), phone()],
  code: [required(t('login.codePlaceholder'))],
  password: [
    required(t('login.passwordPlaceholder')),
    notSpace(),
    { min: 6, message: t('login.resetPasswordMin') }
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
})

const resetForm = () => {
  form.phone = ''
  form.code = ''
  form.password = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  codeCountdown.value = 0
  codeLoading.value = false
}

const startCountdown = () => {
  stopCountdown()
  codeCountdown.value = 60
  codeLoading.value = true
  countdownTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

watch(visible, (val) => {
  if (!val) {
    resetForm()
    stopCountdown()
  }
})

const sendCode = async () => {
  try {
    await formRef.value?.validateField('phone')
  } catch {
    return
  }
  if (codeLoading.value) return

  try {
    const res = await sendResetSmsApi(form.phone)
    if (res?.data?.message) {
      ElMessage.success(res.data.message)
    } else {
      ElMessage.success(t('login.resetCodeSent'))
    }
    startCountdown()
  } catch {
    /* request layer shows error */
  }
}

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const res = await resetPasswordByPhoneApi({
      phone: form.phone,
      code: form.code,
      password: form.password
    })
    ElMessage.success(res?.data?.message || t('login.resetSuccess'))
    visible.value = false
    emit('success', res?.data?.username)
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" :title="t('login.forgetPassword')" width="480px" max-height="auto">
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      hide-required-asterisk
      class="lad-forgot-form"
      @submit.prevent="submit"
    >
      <ElFormItem :label="t('login.phone')" prop="phone">
        <ElInput v-model="form.phone" :placeholder="t('login.phonePlaceholder')" maxlength="11" />
      </ElFormItem>

      <ElFormItem :label="t('login.code')" prop="code">
        <div class="flex w-full gap-10px">
          <ElInput
            v-model="form.code"
            class="flex-1"
            :placeholder="t('login.codePlaceholder')"
            maxlength="6"
          />
          <BaseButton type="primary" :disabled="codeLoading" class="shrink-0" @click="sendCode">
            {{ codeLoading ? `${t('login.getCode')}(${codeCountdown})` : t('login.getCode') }}
          </BaseButton>
        </div>
      </ElFormItem>

      <ElFormItem :label="t('login.resetNewPassword')" prop="password">
        <ElInput
          v-model="form.password"
          type="password"
          show-password
          :placeholder="t('login.resetNewPasswordPlaceholder')"
        />
      </ElFormItem>

      <ElFormItem :label="t('login.resetConfirmPassword')" prop="confirmPassword">
        <ElInput
          v-model="form.confirmPassword"
          type="password"
          show-password
          :placeholder="t('login.resetConfirmPasswordPlaceholder')"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <BaseButton type="primary" :loading="submitLoading" @click="submit">
        {{ t('login.resetSubmit') }}
      </BaseButton>
      <BaseButton @click="visible = false">{{ t('common.cancel') }}</BaseButton>
    </template>
  </Dialog>
</template>

<style lang="less" scoped>
.lad-forgot-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
  }
}
</style>
