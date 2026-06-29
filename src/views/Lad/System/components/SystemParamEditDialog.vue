<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch
} from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveSystemParamApi } from '@/api/lad/system'
import type { ParamValueType, SystemParam } from '@/api/lad/system/types'

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

const isEdit = computed(() => !!props.row?.id)
const loading = ref(false)
const boolValue = ref(true)
const numValue = ref(0)
const strValue = ref('')

const form = ref({
  paramKey: '',
  paramName: '',
  valueType: 'string' as ParamValueType,
  remark: ''
})

const valueTypeOptions = [
  { label: '文本', value: 'string' },
  { label: '数值', value: 'number' },
  { label: '布尔', value: 'boolean' }
]

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.row) {
      const value = props.row.paramValue
      form.value = {
        paramKey: props.row.paramKey,
        paramName: props.row.paramName,
        valueType: props.row.valueType,
        remark: props.row.remark || ''
      }
      if (props.row.valueType === 'boolean') boolValue.value = Boolean(value)
      else if (props.row.valueType === 'number') numValue.value = Number(value)
      else strValue.value = String(value ?? '')
    } else {
      form.value = {
        paramKey: '',
        paramName: '',
        valueType: 'string',
        remark: ''
      }
      boolValue.value = true
      numValue.value = 0
      strValue.value = ''
    }
  }
)

function currentParamValue(): string | number | boolean {
  if (isEdit.value && props.row) {
    if (props.row.valueType === 'boolean') return boolValue.value
    if (props.row.valueType === 'number') return numValue.value
    return strValue.value
  }
  if (form.value.valueType === 'boolean') return boolValue.value
  if (form.value.valueType === 'number') return numValue.value
  return strValue.value
}

async function onSave() {
  if (!isEdit.value) {
    if (!form.value.paramKey.trim() || !form.value.paramName.trim()) {
      ElMessage.warning('请填写参数键与参数名称')
      return
    }
  }

  loading.value = true
  try {
    await saveSystemParamApi({
      id: props.row?.id,
      paramKey: form.value.paramKey.trim(),
      paramName: form.value.paramName.trim(),
      valueType: isEdit.value ? props.row?.valueType : form.value.valueType,
      paramValue: currentParamValue(),
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
    :title="isEdit ? '编辑系统参数' : '新增系统参数'"
    width="640px"
    max-height="70vh"
  >
    <ElForm label-width="100px" class="lad-param-edit-form">
      <div class="lad-param-edit-form__grid">
        <ElFormItem label="参数键" :required="!isEdit">
          <ElInput
            v-model="form.paramKey"
            :disabled="isEdit"
            placeholder="如 sys.platform.name"
            clearable
          />
        </ElFormItem>
        <ElFormItem label="参数名称" :required="!isEdit">
          <ElInput
            v-model="form.paramName"
            :disabled="isEdit"
            placeholder="显示名称"
            clearable
          />
        </ElFormItem>
        <ElFormItem v-if="!isEdit" label="值类型" required>
          <ElSelect v-model="form.valueType" class="w-full">
            <ElOption
              v-for="item in valueTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="参数值" class="lad-param-edit-form__value">
          <ElSwitch
            v-if="(isEdit ? row?.valueType : form.valueType) === 'boolean'"
            v-model="boolValue"
          />
          <ElInputNumber
            v-else-if="(isEdit ? row?.valueType : form.valueType) === 'number'"
            v-model="numValue"
            class="w-full"
            controls-position="right"
          />
          <ElInput v-else v-model="strValue" clearable />
        </ElFormItem>
        <ElFormItem label="描述" class="lad-param-edit-form__remark">
          <ElInput v-model="form.remark" type="textarea" :rows="3" />
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

.lad-param-edit-form__value,
.lad-param-edit-form__remark {
  grid-column: 1 / -1;
}
</style>
