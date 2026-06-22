<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveBlackWhiteApi } from '@/api/lad/list'
import type { BlackWhiteListItem, EntryMethod, ListType } from '@/api/lad/list/types'
import { ElDatePicker, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus'

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

const modelOptions = [
  'DJI Mavic 3',
  'DJI Mini 3 Pro',
  'DJI Air 3',
  'Autel EVO II',
  '大疆经纬 M30',
  'Parrot Anafi',
  '其他'
]

const createDefaultForm = () => ({
  listType: '未知' as ListType,
  targetId: '',
  targetType: '多旋翼',
  validUntil: '',
  model: modelOptions[0],
  frequency: '2.4GHz + 5.8GHz',
  sn: '',
  zoneName: '核心防护区A区',
  longitude: 113.4,
  latitude: 23.1,
  entryMethod: '人工录入' as EntryMethod,
  remark: ''
})

const form = ref(createDefaultForm())

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.row) {
      form.value = {
        ...createDefaultForm(),
        listType: props.row.listType,
        targetId: props.row.targetId,
        targetType: props.row.targetType,
        validUntil: props.row.validUntil === '永久' ? '' : props.row.validUntil,
        model: props.row.model || '其他',
        frequency: props.row.frequency,
        sn: props.row.sn,
        zoneName: props.row.zoneName,
        longitude: props.row.longitude,
        latitude: props.row.latitude,
        entryMethod: props.row.entryMethod,
        remark: props.row.remark
      }
      if (!modelOptions.includes(form.value.model)) {
        form.value.model = '其他'
      }
    } else {
      form.value = createDefaultForm()
    }
  }
)

const onSubmit = async () => {
  loading.value = true
  try {
    await saveBlackWhiteApi({
      id: props.row?.id,
      ...form.value,
      validUntil: form.value.validUntil || '永久'
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
        <ElSelect v-model="form.model" style="width: 100%" placeholder="请选择机型/型号">
          <ElOption v-for="item in modelOptions" :key="item" :label="item" :value="item" />
        </ElSelect>
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
      <ElFormItem label="有效期至">
        <ElDatePicker
          v-model="form.validUntil"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择失效时间，不选则默认为永久"
          clearable
          style="width: 100%"
        />
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
