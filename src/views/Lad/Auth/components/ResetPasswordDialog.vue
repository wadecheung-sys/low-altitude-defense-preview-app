<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { resetAuthPasswordApi } from '@/api/lad/auth'
import type { AuthUser } from '@/api/lad/auth/types'
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'

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

const loading = ref(false)
const password = ref('')
const confirm = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      password.value = ''
      confirm.value = ''
    }
  }
)

async function onSave() {
  if (!props.row) return
  if (password.value.length < 8) {
    ElMessage.warning('密码长度至少 8 位')
    return
  }
  if (password.value !== confirm.value) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  loading.value = true
  try {
    await resetAuthPasswordApi({ id: props.row.id, newPassword: password.value })
    ElMessage.success('密码已重置')
    emit('success')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" title="重置密码" width="480px">
    <ElForm v-if="row" label-width="100px">
      <ElFormItem label="用户">
        <ElInput :model-value="`${row.username}（${row.account}）`" readonly />
      </ElFormItem>
      <ElFormItem label="新密码" required>
        <ElInput v-model="password" type="password" show-password placeholder="至少 8 位" />
      </ElFormItem>
      <ElFormItem label="确认密码" required>
        <ElInput v-model="confirm" type="password" show-password />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton type="primary" :loading="loading" @click="onSave">保存</BaseButton>
      <BaseButton @click="visible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>
