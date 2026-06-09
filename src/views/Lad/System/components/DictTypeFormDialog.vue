<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveDictTypeApi } from '@/api/lad/system'
import type { DictTypeItem } from '@/api/lad/system/types'
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  row?: DictTypeItem
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
  dictCode: '',
  dictName: '',
  remark: ''
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.row) {
      form.value = {
        dictCode: props.row.dictCode,
        dictName: props.row.dictName,
        remark: props.row.remark || ''
      }
    } else {
      form.value = { dictCode: '', dictName: '', remark: '' }
    }
  }
)

async function onSave() {
  if (!form.value.dictCode.trim() || !form.value.dictName.trim()) {
    ElMessage.warning('请填写字典编码与名称')
    return
  }
  loading.value = true
  try {
    await saveDictTypeApi({
      id: props.row?.id,
      dictCode: form.value.dictCode.trim(),
      dictName: form.value.dictName.trim(),
      remark: form.value.remark.trim() || undefined
    })
    ElMessage.success('保存成功')
    emit('success')
    visible.value = false
  } catch {
    /* axios 已提示 */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    v-model="visible"
    :title="isEdit ? '编辑字典' : '新增字典'"
    width="520px"
    max-height="70vh"
  >
    <ElForm label-width="90px">
      <ElFormItem label="字典编码" required>
        <ElInput
          v-model="form.dictCode"
          :disabled="isEdit"
          placeholder="如 list_type"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="字典名称" required>
        <ElInput v-model="form.dictName" placeholder="显示名称" clearable />
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
