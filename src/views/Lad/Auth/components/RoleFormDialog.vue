<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveAuthRoleApi } from '@/api/lad/auth'
import type { AuthRole } from '@/api/lad/auth/types'
import { roleUserTypeOptions, statusOptions } from '../authConstants'
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
  row?: AuthRole
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
const builtin = computed(() =>
  props.row ? ['role-sys', 'role-sec', 'role-audit'].includes(props.row.id) : false
)

const form = ref({
  roleCode: '',
  roleName: '',
  userType: 'any' as AuthRole['userType'],
  status: 'enabled' as AuthRole['status'],
  remark: ''
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.row) {
      form.value = {
        roleCode: props.row.roleCode,
        roleName: props.row.roleName,
        userType: props.row.userType,
        status: props.row.status,
        remark: props.row.remark || ''
      }
    } else {
      form.value = { roleCode: '', roleName: '', userType: 'any', status: 'enabled', remark: '' }
    }
  }
)

async function onSave() {
  if (!form.value.roleCode.trim() || !form.value.roleName.trim()) {
    ElMessage.warning('请填写角色编码与名称')
    return
  }
  loading.value = true
  try {
    await saveAuthRoleApi({
      id: props.row?.id,
      roleCode: form.value.roleCode.trim(),
      roleName: form.value.roleName.trim(),
      userType: form.value.userType,
      status: form.value.status,
      permissionIds: props.row?.permissionIds || [],
      remark: form.value.remark.trim() || undefined
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
  <Dialog v-model="visible" :title="isEdit ? '编辑角色' : '新增角色'" width="520px">
    <ElForm label-width="100px">
      <ElFormItem label="角色编码" required>
        <ElInput v-model="form.roleCode" :disabled="builtin" clearable />
      </ElFormItem>
      <ElFormItem label="角色名称" required>
        <ElInput v-model="form.roleName" clearable />
      </ElFormItem>
      <ElFormItem label="适用用户类型">
        <ElSelect v-model="form.userType" class="w-full" :disabled="builtin">
          <ElOption
            v-for="o in roleUserTypeOptions"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="form.status" :disabled="builtin">
          <ElRadio v-for="o in statusOptions" :key="o.value" :value="o.value">{{
            o.label
          }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="form.remark" type="textarea" :rows="3" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton type="primary" :loading="loading" @click="onSave">保存</BaseButton>
      <BaseButton @click="visible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>
