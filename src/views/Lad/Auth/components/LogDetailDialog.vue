<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getAuthLogDetailApi } from '@/api/lad/auth'
import type { AuthLogItem } from '@/api/lad/auth/types'
import { logTypeLabel } from '../authConstants'
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  logId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const detail = ref<AuthLogItem | null>(null)

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.logId) return
    loading.value = true
    try {
      const res = await getAuthLogDetailApi({ id: props.logId })
      detail.value = res.data
    } finally {
      loading.value = false
    }
  }
)
</script>

<template>
  <Dialog v-model="visible" title="日志详情" width="640px" max-height="75vh">
    <ElDescriptions v-if="detail" v-loading="loading" :column="2" border>
      <ElDescriptionsItem label="日志类型">
        {{ logTypeLabel[detail.logType] }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="结果">
        <ElTag :type="detail.result === 'success' ? 'success' : 'danger'">
          {{ detail.result === 'success' ? '成功' : '失败' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作人">{{ detail.operator }}</ElDescriptionsItem>
      <ElDescriptionsItem label="账号">{{ detail.account }}</ElDescriptionsItem>
      <ElDescriptionsItem label="功能模块">{{ detail.module }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作动作">{{ detail.action }}</ElDescriptionsItem>
      <ElDescriptionsItem label="IP 地址">{{ detail.ip }}</ElDescriptionsItem>
      <ElDescriptionsItem label="时间">{{ detail.createdAt }}</ElDescriptionsItem>
      <ElDescriptionsItem label="详情" :span="2">
        {{ detail.detail || '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>
    <template #footer>
      <BaseButton @click="visible = false">关闭</BaseButton>
    </template>
  </Dialog>
</template>
