<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElForm, ElFormItem, ElInput, ElRadio, ElRadioGroup, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { confirmHistoryEventApi } from '@/api/lad/incident'
import type { HistoryEventItem, ManualConfirmResult, ThreatLevel } from '@/api/lad/incident/types'
import { THREAT_LEVEL_OPTIONS } from '../../shared/ladDictHelpers'

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
const threatLevel = ref<ThreatLevel>('低危')
const nuisanceType = ref('飞鸟')
const remark = ref('')
const loading = ref(false)

const threatOptions: Array<{
  value: ThreatLevel
  type: 'info' | 'success' | 'warning' | 'danger'
}> = THREAT_LEVEL_OPTIONS.filter((item) => item.value !== '无危').map((item) => ({
  value: item.value as ThreatLevel,
  type:
    item.value === '低危'
      ? 'success'
      : item.value === '中危'
        ? 'warning'
        : item.value === '高危'
          ? 'danger'
          : 'info'
}))

const nuisanceOptions = ['飞鸟', '地面杂波', '气球', '风筝', '其他低慢小目标']

const disposalHint = computed(() => {
  const hints: Record<ThreatLevel, string> = {
    无危: '威胁等级未判定，暂不执行自动处置',
    低危: '系统将持续自动监控目标',
    中危: '系统将联动反制设备自动驱离',
    高危: '系统将联动高能设备自动打击反制'
  }
  return hints[threatLevel.value]
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    result.value = '真实入侵'
    threatLevel.value = '低危'
    nuisanceType.value = '飞鸟'
    remark.value = ''
  }
)

const onSubmit = async () => {
  if (!props.row) return
  loading.value = true
  try {
    await confirmHistoryEventApi({
      id: props.row.id,
      result: result.value,
      threatLevel: result.value === '真实入侵' ? threatLevel.value : undefined,
      nuisanceType: result.value === '躁扰告警' ? nuisanceType.value : undefined,
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
  <Dialog v-model="visible" title="人工核查" width="520px" max-height="auto">
    <ElForm label-position="top" class="decision-form">
        <ElFormItem label="验证方式">
          <div class="verification-method-hint">提交后验证方式将更新为：人工核查</div>
        </ElFormItem>

        <ElFormItem label="核查结论" required>
          <ElRadioGroup v-model="result" class="conclusion-group">
            <ElRadio label="真实入侵">真实入侵</ElRadio>
            <ElRadio label="躁扰告警">躁扰告警</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem v-if="result === '真实入侵'" label="威胁等级" required>
          <div class="threat-levels">
            <ElTag
              v-for="item in threatOptions"
              :key="item.value"
              :type="item.type"
              :effect="threatLevel === item.value ? 'dark' : 'plain'"
              size="large"
              @click="threatLevel = item.value"
            >
              {{ item.value }}
            </ElTag>
          </div>
          <div class="disposal-hint" :data-level="threatLevel">
            {{ disposalHint }}
          </div>
        </ElFormItem>

        <ElFormItem v-else label="躁扰类型" required>
          <ElRadioGroup v-model="nuisanceType" class="nuisance-group">
            <ElRadio v-for="item in nuisanceOptions" :key="item" :label="item">
              {{ item }}
            </ElRadio>
          </ElRadioGroup>
          <div class="disposal-hint">系统将记录躁扰类型并关闭本次告警，不执行反制设备</div>
        </ElFormItem>

        <ElFormItem label="备注">
          <ElInput
            v-model="remark"
            type="textarea"
            :rows="3"
            placeholder="可选，记录执勤判定依据"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>
    </ElForm>

    <template #footer>
      <BaseButton @click="visible = false">取消</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSubmit">提交核查</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped>
.decision-form {
  padding-top: 4px;
}

.verification-method-hint {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 22px;
}

.conclusion-group {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.conclusion-group :deep(.el-radio) {
  height: 42px;
  margin: 0;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.conclusion-group :deep(.el-radio.is-checked) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.threat-levels {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.nuisance-group {
  display: flex;
  gap: 4px 14px;
  flex-wrap: wrap;
}

.threat-levels .el-tag {
  justify-content: center;
  cursor: pointer;
}

.disposal-hint {
  width: 100%;
  margin-top: 10px;
  padding: 10px 12px;
  border-left: 3px solid var(--el-color-info);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

.disposal-hint[data-level='低危'] {
  border-color: var(--el-color-success);
}

.disposal-hint[data-level='中危'] {
  border-color: var(--el-color-warning);
}

.disposal-hint[data-level='高危'] {
  border-color: var(--el-color-danger);
}
</style>
