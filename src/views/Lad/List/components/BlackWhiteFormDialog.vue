<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveBlackWhiteApi } from '@/api/lad/list'
import type { BlackWhiteListItem, EntryMethod, ListType } from '@/api/lad/list/types'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect
} from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  row?: BlackWhiteListItem
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
  listType: '未知' as ListType,
  targetId: '',
  targetType: '多旋翼',
  validUntil: '永久',
  model: '',
  frequency: '2.4GHz + 5.8GHz',
  sn: '',
  zoneName: '核心保护区-A区',
  longitude: 113.4,
  latitude: 23.1,
  entryMethod: '人工录入' as EntryMethod,
  remark: ''
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.row) {
      form.value = {
        listType: props.row.listType,
        targetId: props.row.targetId,
        targetType: props.row.targetType,
        validUntil: props.row.validUntil,
        model: props.row.model,
        frequency: props.row.frequency,
        sn: props.row.sn,
        zoneName: props.row.zoneName,
        longitude: props.row.longitude,
        latitude: props.row.latitude,
        entryMethod: props.row.entryMethod,
        remark: props.row.remark
      }
    } else {
      form.value = {
        listType: '未知',
        targetId: '',
        targetType: '多旋翼',
        validUntil: '永久',
        model: '',
        frequency: '2.4GHz + 5.8GHz',
        sn: '',
        zoneName: '核心保护区-A区',
        longitude: 113.4,
        latitude: 23.1,
        entryMethod: '人工录入',
        remark: ''
      }
    }
  }
)

const onSubmit = async () => {
  loading.value = true
  try {
    await saveBlackWhiteApi({
      id: props.row?.id,
      ...form.value
    })
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
    :title="isEdit ? '编辑名单' : '新增名单'"
    width="640px"
    max-height="auto"
  >
    <ElForm label-width="100px">
      <ElFormItem label="名单类型" required>
        <ElSelect v-model="form.listType" style="width: 100%">
          <ElOption label="黑名单" value="黑名单" />
          <ElOption label="白名单" value="白名单" />
          <ElOption label="未知" value="未知" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="目标 ID" required>
        <ElInput v-model="form.targetId" placeholder="融合目标编号" />
      </ElFormItem>
      <ElFormItem label="SN 码">
        <ElInput v-model="form.sn" placeholder="无人机设备 SN" />
      </ElFormItem>
      <ElFormItem label="机型/型号">
        <ElInput v-model="form.model" placeholder="如 DJI Mavic 3" />
      </ElFormItem>
      <ElFormItem label="目标类型">
        <ElSelect v-model="form.targetType" style="width: 100%">
          <ElOption label="多旋翼" value="多旋翼" />
          <ElOption label="固定翼" value="固定翼" />
          <ElOption label="行业级" value="行业级" />
          <ElOption label="未知" value="未知" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="频段/频率">
        <ElInput v-model="form.frequency" />
      </ElFormItem>
      <ElFormItem label="所在区域">
        <ElInput v-model="form.zoneName" />
      </ElFormItem>
      <ElFormItem label="有效期至">
        <ElInput v-model="form.validUntil" placeholder="永久 或 YYYY-MM-DD" />
      </ElFormItem>
      <ElFormItem label="经度">
        <ElInputNumber v-model="form.longitude" :precision="4" :step="0.0001" style="width: 100%" />
      </ElFormItem>
      <ElFormItem label="纬度">
        <ElInputNumber v-model="form.latitude" :precision="4" :step="0.0001" style="width: 100%" />
      </ElFormItem>
      <ElFormItem label="录入方式">
        <ElSelect v-model="form.entryMethod" style="width: 100%">
          <ElOption label="自动录入" value="自动录入" />
          <ElOption label="人工录入" value="人工录入" />
          <ElOption label="自动+人工校验" value="自动+人工校验" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="form.remark" type="textarea" :rows="2" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <BaseButton @click="visible = false">取消</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSubmit">保存</BaseButton>
    </template>
  </Dialog>
</template>
