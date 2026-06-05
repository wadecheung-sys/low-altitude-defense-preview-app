<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage, ElSwitch } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveSystemParamApi } from '@/api/lad/system'
import type { SystemParam } from '@/api/lad/system/types'

const props = defineProps<{
  modelValue: boolean
  row?: SystemParam
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
const boolValue = ref(true)
const numValue = ref(0)
const strValue = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.row) return
    const value = props.row.paramValue
    if (props.row.valueType === 'boolean') boolValue.value = Boolean(value)
    else if (props.row.valueType === 'number') numValue.value = Number(value)
    else strValue.value = String(value ?? '')
  }
)

async function onSave() {
  if (!props.row) return
  let paramValue: string | number | boolean
  if (props.row.valueType === 'boolean') paramValue = boolValue.value
  else if (props.row.valueType === 'number') paramValue = numValue.value
  else paramValue = strValue.value

  loading.value = true
  try {
    await saveSystemParamApi({ id: props.row.id, paramValue })
    ElMessage.success('保存成功')
    emit('success')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" title="编辑系统参数" width="640px" max-height="70vh">
    <ElForm v-if="row" label-width="100px" class="lad-param-edit-form">
      <div class="lad-param-edit-form__grid">
        <ElFormItem label="参数名称">
          <ElInput :model-value="row.paramName" disabled />
        </ElFormItem>
        <ElFormItem label="分组">
          <ElInput :model-value="row.group" disabled />
        </ElFormItem>
        <ElFormItem label="参数值" class="lad-param-edit-form__value">
          <ElSwitch v-if="row.valueType === 'boolean'" v-model="boolValue" />
          <ElInputNumber
            v-else-if="row.valueType === 'number'"
            v-model="numValue"
            class="w-full"
            controls-position="right"
          />
          <ElInput v-else v-model="strValue" clearable />
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
.lad-param-edit-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.lad-param-edit-form__value {
  grid-column: 1 / -1;
}
</style>
