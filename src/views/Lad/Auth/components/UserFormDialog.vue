<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getAuthRoleOptionsApi, saveAuthUserApi } from '@/api/lad/auth'
import type { AuthUser } from '@/api/lad/auth/types'
import { accountLevelOptions, statusOptions, userTypeOptions } from '../authConstants'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect
} from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  row?: AuthUser
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.row?.id)
const loading = ref(false)
const roleOptions = ref<{ label: string; value: string }[]>([])

const form = ref({
  username: '',
  account: '',
  userType: 'operator' as AuthUser['userType'],
  accountLevel: 'duty' as AuthUser['accountLevel'],
  roleIds: [] as string[],
  phone: '',
  email: '',
  status: 'enabled' as AuthUser['status'],
  password: ''
})

async function loadRoles() {
  const res = await getAuthRoleOptionsApi()
  roleOptions.value = (res.data || [])
    .filter((r) => r.status === 'enabled')
    .map((r) => ({ label: r.roleName, value: r.id }))
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await loadRoles()
    if (props.row) {
      form.value = {
        username: props.row.username,
        account: props.row.account,
        userType: props.row.userType,
        accountLevel: props.row.accountLevel,
        roleIds: [...props.row.roleIds],
        phone: props.row.phone || '',
        email: props.row.email || '',
        status: props.row.status,
        password: ''
      }
    } else {
      form.value = {
        username: '',
        account: '',
        userType: 'operator',
        accountLevel: 'duty',
        roleIds: [],
        phone: '',
        email: '',
        status: 'enabled',
        password: 'Lad@123456'
      }
    }
  }
)

async function onSave() {
  if (!form.value.username.trim() || !form.value.account.trim()) {
    ElMessage.warning('请填写姓名与登录账号')
    return
  }
  if (!isEdit.value && !form.value.password.trim()) {
    ElMessage.warning('请设置初始密码')
    return
  }
  if (!form.value.roleIds.length) {
    ElMessage.warning('请至少选择一个角色')
    return
  }
  loading.value = true
  try {
    await saveAuthUserApi({
      id: props.row?.id,
      username: form.value.username.trim(),
      account: form.value.account.trim(),
      userType: form.value.userType,
      accountLevel: form.value.accountLevel,
      roleIds: form.value.roleIds,
      phone: form.value.phone.trim() || undefined,
      email: form.value.email.trim() || undefined,
      status: form.value.status,
      password: form.value.password.trim() || undefined
    })
    ElMessage.success('保存成功')
    emit('success')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    v-model="visible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    width="640px"
    max-height="75vh"
  >
    <ElForm label-width="100px">
      <div class="lad-auth-form-grid">
        <ElFormItem label="姓名" required>
          <ElInput v-model="form.username" clearable />
        </ElFormItem>
        <ElFormItem label="登录账号" required>
          <ElInput v-model="form.account" :disabled="isEdit && row?.builtin" clearable />
        </ElFormItem>
        <ElFormItem label="用户类型" required>
          <ElSelect v-model="form.userType" class="w-full" :disabled="!!row?.builtin">
            <ElOption
              v-for="o in userTypeOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="账号分级" required>
          <ElSelect v-model="form.accountLevel" class="w-full">
            <ElOption
              v-for="o in accountLevelOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="绑定角色" required class="lad-auth-form-grid__full">
          <ElSelect v-model="form.roleIds" multiple collapse-tags class="w-full">
            <ElOption v-for="o in roleOptions" :key="o.value" :label="o.label" :value="o.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="form.phone" clearable />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="form.email" clearable />
        </ElFormItem>
        <ElFormItem v-if="!isEdit" label="初始密码" required class="lad-auth-form-grid__full">
          <ElInput v-model="form.password" type="password" show-password />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="form.status" :disabled="!!row?.builtin">
            <ElRadio v-for="o in statusOptions" :key="o.value" :value="o.value">{{
              o.label
            }}</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <BaseButton type="primary" :loading="loading" @click="onSave">保存</BaseButton>
      <BaseButton @click="visible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped>
.lad-auth-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.lad-auth-form-grid__full {
  grid-column: 1 / -1;
}
</style>
