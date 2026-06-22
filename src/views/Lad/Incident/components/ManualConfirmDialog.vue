<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElForm, ElFormItem, ElInput, ElRadio, ElRadioGroup, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { confirmHistoryEventApi } from '@/api/lad/incident'
import type { HistoryEventItem, ManualConfirmResult, ThreatLevel } from '@/api/lad/incident/types'

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
const threatLevel = ref<ThreatLevel>('低')
const nuisanceType = ref('飞鸟')
const remark = ref('')
const loading = ref(false)

const threatOptions: Array<{
  value: ThreatLevel
  type: 'info' | 'success' | 'warning' | 'danger'
}> = [
  { value: '低', type: 'success' },
  { value: '中', type: 'warning' },
  { value: '高', type: 'danger' }
]

const nuisanceOptions = ['飞鸟', '地面杂波', '气球', '风筝', '其他低慢小目标']

const disposalHint = computed(() => {
  const hints: Record<ThreatLevel, string> = {
    未知: '威胁等级未判定，暂不执行自动处置',
    低: '系统将持续自动监控目标',
    中: '系统将联动反制设备自动驱离',
    高: '系统将联动高能设备自动打击反制'
  }
  return hints[threatLevel.value]
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    result.value = '真实入侵'
    threatLevel.value = '低'
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
  <Dialog v-model="visible" title="人工确认" width="920px" max-height="auto">
    <div class="confirm-layout">
      <section class="optical-panel">
        <div class="optical-toolbar">
          <span><i class="live-dot"></i>光电-01 实时画面</span>
          <span>EO · 4K · 12.6x</span>
        </div>
        <div class="optical-view">
          <div class="scan-line"></div>
          <div class="target-box">
            <span class="drone-shape">◆</span>
            <span class="target-label">{{ row?.targetId }}</span>
          </div>
          <div class="crosshair"><i></i><b></b></div>
          <div class="telemetry telemetry-top">TRACKING / AUTO</div>
          <div class="telemetry telemetry-bottom">
            AZ 126.4°&nbsp;&nbsp; EL 18.7°&nbsp;&nbsp; DIST 1.42 KM
          </div>
        </div>
        <div class="target-summary">
          <span>目标型号：{{ row?.targetModel }}</span>
          <span>无人机 SN：{{ row?.uavSn }}</span>
          <span>飞手位置：未定位</span>
        </div>
      </section>

      <ElForm label-position="top" class="decision-form">
        <ElFormItem label="确认结论" required>
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
    </div>

    <template #footer>
      <BaseButton @click="visible = false">取消</BaseButton>
      <BaseButton type="primary" :loading="loading" @click="onSubmit">确认提交</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped>
.confirm-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
  gap: 22px;
}

.optical-panel {
  overflow: hidden;
  border: 1px solid #273f4c;
  border-radius: 8px;
  background: #071318;
  color: #bce9df;
}

.optical-toolbar,
.target-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  font-size: 12px;
  background: #0b2028;
}

.live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 50%;
  background: #42e3b4;
  box-shadow: 0 0 8px #42e3b4;
}

.optical-view {
  position: relative;
  min-height: 292px;
  overflow: hidden;
  background:
    linear-gradient(rgba(9, 24, 28, 0.2), rgba(9, 24, 28, 0.55)),
    repeating-linear-gradient(0deg, transparent 0 3px, rgba(151, 221, 206, 0.06) 4px),
    radial-gradient(circle at 58% 42%, #869c91 0, #3d554e 11%, #1f3534 30%, #09191d 72%);
}

.optical-view::before,
.optical-view::after {
  position: absolute;
  content: '';
  background: rgba(164, 232, 216, 0.2);
}

.optical-view::before {
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
}
.optical-view::after {
  top: 0;
  left: 50%;
  width: 1px;
  height: 100%;
}

.scan-line {
  position: absolute;
  z-index: 2;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(75, 255, 201, 0.65), transparent);
  animation: scan 3.6s linear infinite;
}

.target-box {
  position: absolute;
  z-index: 3;
  top: 35%;
  left: 54%;
  width: 92px;
  height: 62px;
  border: 1px solid #64ffd0;
  box-shadow: 0 0 10px rgba(100, 255, 208, 0.25);
  animation: drift 4s ease-in-out infinite;
}

.drone-shape {
  position: absolute;
  top: 16px;
  left: 36px;
  color: #d8fff3;
  font-size: 21px;
}
.target-label {
  position: absolute;
  top: -20px;
  left: -1px;
  white-space: nowrap;
  font: 11px monospace;
}
.crosshair {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  width: 38px;
  height: 38px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(174, 255, 233, 0.7);
  border-radius: 50%;
}
.crosshair i,
.crosshair b {
  position: absolute;
  display: block;
  background: rgba(174, 255, 233, 0.8);
}
.crosshair i {
  top: 18px;
  left: -9px;
  width: 56px;
  height: 1px;
}
.crosshair b {
  top: -9px;
  left: 18px;
  width: 1px;
  height: 56px;
}
.telemetry {
  position: absolute;
  z-index: 4;
  left: 12px;
  color: #a7e9d8;
  font: 11px monospace;
}
.telemetry-top {
  top: 10px;
}
.telemetry-bottom {
  bottom: 10px;
}
.target-summary {
  gap: 8px;
  justify-content: flex-start;
  flex-wrap: wrap;
  color: #8eb8ae;
}

.decision-form {
  padding-top: 4px;
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
.disposal-hint[data-level='低'] {
  border-color: var(--el-color-success);
}
.disposal-hint[data-level='中'] {
  border-color: var(--el-color-warning);
}
.disposal-hint[data-level='高'] {
  border-color: var(--el-color-danger);
}

@keyframes scan {
  from {
    top: -2px;
  }
  to {
    top: 100%;
  }
}
@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(9px, -5px);
  }
}

@media (max-width: 760px) {
  .confirm-layout {
    grid-template-columns: 1fr;
  }
  .optical-view {
    min-height: 220px;
  }
}
</style>
