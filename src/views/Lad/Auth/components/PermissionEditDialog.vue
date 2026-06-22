<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveAuthPermissionApi } from '@/api/lad/auth'
import type { AuthPermissionNode } from '@/api/lad/auth/types'
import { permTypeLabel, statusOptions } from '../authConstants'
import { ElForm, ElFormItem, ElInput, ElMessage, ElRadio, ElRadioGroup } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  row?: AuthPermissionNode
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
const permCode = ref('')
const status = ref<'enabled' | 'disabled'>('enabled')

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.row) return
    permCode.value = props.row.permCode
    status.value = props.row.status
  }
)

async function onSave() {
  if (!props.row) return
  if (!permCode.value.trim()) {
    ElMessage.warning('请填写权限标识')
    return
  }
  loading.value = true
  try {
    await saveAuthPermissionApi({
      id: props.row.id,
      permCode: permCode.value.trim(),
      status: status.value
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
  <Dialog v-model="visible" title="编辑功能权限" width="520px">
    <ElForm v-if="row" label-width="100px">
      <ElFormItem label="权限名称">
        <ElInput :model-value="row.name" readonly />
      </ElFormItem>
      <ElFormItem label="节点类型">
        <ElInput :model-value="permTypeLabel[row.nodeType]" readonly />
      </ElFormItem>
      <ElFormItem label="路由路径">
        <ElInput :model-value="row.path || '-'" readonly />
      </ElFormItem>
      <ElFormItem label="权限标识" required>
        <ElInput v-model="permCode" clearable />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="status">
          <ElRadio v-for="o in statusOptions" :key="o.value" :value="o.value">{{
            o.label
          }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton type="primary" :loading="loading" @click="onSave">保存</BaseButton>
      <BaseButton @click="visible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>
