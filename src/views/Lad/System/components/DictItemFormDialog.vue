<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveDictEntryApi } from '@/api/lad/system'
import type { DictEntryItem } from '@/api/lad/system/types'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElRadio,
  ElRadioGroup
} from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  dictTypeId: string
  row?: DictEntryItem
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

const form = ref({
  label: '',
  value: '',
  sort: 1,
  status: 'enabled' as 'enabled' | 'disabled',
  remark: ''
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.row) {
      form.value = {
        label: props.row.label,
        value: props.row.value,
        sort: props.row.sort,
        status: props.row.status,
        remark: props.row.remark || ''
      }
    } else {
      form.value = { label: '', value: '', sort: 1, status: 'enabled', remark: '' }
    }
  }
)

async function onSave() {
  if (!form.value.label.trim() || !form.value.value.trim()) {
    ElMessage.warning('请填写显示标签与字典值')
    return
  }
  loading.value = true
  try {
    await saveDictEntryApi({
      id: props.row?.id,
      dictTypeId: props.dictTypeId,
      label: form.value.label.trim(),
      value: form.value.value.trim(),
      sort: form.value.sort,
      status: form.value.status,
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
  <Dialog
    v-model="visible"
    :title="isEdit ? '编辑字典项' : '新增字典项'"
    width="520px"
    max-height="70vh"
  >
    <ElForm label-width="90px">
      <ElFormItem label="显示标签" required>
        <ElInput v-model="form.label" clearable />
      </ElFormItem>
      <ElFormItem label="字典值" required>
        <ElInput v-model="form.value" clearable />
      </ElFormItem>
      <ElFormItem label="排序">
        <ElInputNumber v-model="form.sort" :min="0" class="w-full" controls-position="right" />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="form.status">
          <ElRadio value="enabled">启用</ElRadio>
          <ElRadio value="disabled">停用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="form.remark" type="textarea" :rows="2" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton type="primary" :loading="loading" @click="onSave">保存</BaseButton>
      <BaseButton @click="visible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>
