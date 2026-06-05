<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElAlert, ElForm, ElFormItem, ElInput, ElRadio, ElRadioGroup } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { confirmHistoryEventApi } from '@/api/lad/incident'
import type { HistoryEventItem, ManualConfirmResult } from '@/api/lad/incident/types'

const props = defineProps<{
  modelValue: boolean
  row?: HistoryEventItem
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const result = ref<ManualConfirmResult>('真实入侵')
const remark = ref('')
const loading = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    result.value = '真实入侵'
    remark.value = ''
  }
)

const summary = computed(() => props.row)

const onSubmit = async () => {
  if (!props.row) return
  loading.value = true
  try {
    await confirmHistoryEventApi({
      id: props.row.id,
      result: result.value,
      remark: remark.value || undefined
    })
    emit('success')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" title="人工确认" width="520px" max-height="auto">
    <ElAlert
      type="warning"
      :closable="false"
      show-icon
      class="mb-16px"
      title="请根据现场情况与多源情报确认本条记录"
      description="确认结论将写入处置状态；选择“启动反制”后会联动已配置的反制设备（演示）。"
    />

    <div v-if="summary" class="mb-16px text-14px text-[var(--el-text-color-regular)]">
      <p
        ><span class="text-[var(--el-text-color-secondary)]">目标ID：</span
        >{{ summary.targetId }}</p
      >
      <p
        ><span class="text-[var(--el-text-color-secondary)]">目标型号：</span
        >{{ summary.targetModel }}</p
      >
      <p
        ><span class="text-[var(--el-text-color-secondary)]">无人机SN：</span>{{ summary.uavSn }}</p
      >
      <p
        ><span class="text-[var(--el-text-color-secondary)]">飞手位置：</span
        >{{ summary.pilotLocation }}</p
      >
    </div>

    <ElForm label-position="top">
      <ElFormItem label="确认结论" required>
        <ElRadioGroup v-model="result" class="flex flex-col items-start gap-10px">
          <ElRadio label="真实入侵">标记为真实入侵，继续进入后续处置流程</ElRadio>
          <ElRadio label="飞鸟/误报">标记为飞鸟/误报，降低威胁等级并归档</ElRadio>
          <ElRadio label="启动反制">启动反制设备，对关联设备下发处置指令</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="remark"
          type="textarea"
          :rows="2"
          placeholder="可选，记录执勤判定依据"
          maxlength="200"
          show-word-limit
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <BaseButton @click="visible = false">取消</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSubmit">确认提交</BaseButton>
    </template>
  </Dialog>
</template>
