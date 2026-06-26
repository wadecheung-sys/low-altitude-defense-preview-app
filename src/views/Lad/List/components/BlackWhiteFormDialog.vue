<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { saveBlackWhiteApi } from '@/api/lad/list'
import type { BlackWhiteListItem, EntryMethod, ListType } from '@/api/lad/list/types'
import { targetModelOptions } from '../../shared/ladOptionConstants'
import {
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect
} from 'element-plus'

type FrequencyBand = {
  id: string
  value?: number
}

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
let frequencySeq = 0

const modelOptions = targetModelOptions.map((item) => item.value)

function createFrequencyBand(value?: number): FrequencyBand {
  frequencySeq += 1
  return {
    id: `freq-${Date.now()}-${frequencySeq}`,
    value
  }
}

function parseFrequencyBands(frequency?: string): FrequencyBand[] {
  const matches = [...(frequency || '').matchAll(/(\d+(?:\.\d+)?)\s*(GHz|MHz)?/gi)]
  const values = matches
    .map((match) => {
      const value = Number(match[1])
      if (!Number.isFinite(value)) return undefined
      return match[2]?.toLowerCase() === 'mhz' ? Number((value / 1000).toFixed(3)) : value
    })
    .filter((value): value is number => value !== undefined)
  const uniqueValues = [...new Set(values)]
  return uniqueValues.length
    ? uniqueValues.map((value) => createFrequencyBand(value))
    : [createFrequencyBand()]
}

function createDefaultForm() {
  return {
    listType: '未知' as ListType,
    targetId: '',
    targetType: '多旋翼',
    validUntil: '',
    model: modelOptions[0],
    frequencyBands: [createFrequencyBand(2.4), createFrequencyBand(5.8)] as FrequencyBand[],
    sn: '',
    zoneName: '核心防护区A区',
    longitude: 113.4,
    latitude: 23.1,
    entryMethod: '人工录入' as EntryMethod,
    remark: ''
  }
}

const form = ref(createDefaultForm())

function formatFrequencyValue(value: number) {
  return Number(value.toFixed(3)).toString()
}

function buildFrequencyText() {
  return form.value.frequencyBands
    .map((item) => item.value)
    .filter((value): value is number => Number.isFinite(value) && value > 0)
    .map((value) => `${formatFrequencyValue(value)}GHz`)
    .join(' + ')
}

function addFrequencyBand() {
  form.value.frequencyBands.push(createFrequencyBand())
}

function removeFrequencyBand(id: string) {
  if (form.value.frequencyBands.length <= 1) return
  form.value.frequencyBands = form.value.frequencyBands.filter((item) => item.id !== id)
}

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
        frequencyBands: parseFrequencyBands(props.row.frequency),
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
  const frequency = buildFrequencyText()
  if (!frequency) {
    ElMessage.warning('请至少录入一个有效的频段数值')
    return
  }
  if (!isEdit.value && !form.value.sn.trim()) {
    ElMessage.warning('请填写识别码')
    return
  }

  loading.value = true
  try {
    await saveBlackWhiteApi({
      id: props.row?.id,
      listType: form.value.listType,
      targetId: form.value.targetId,
      targetType: form.value.targetType,
      validUntil: form.value.validUntil || '永久',
      model: form.value.model,
      frequency,
      sn: form.value.sn.trim(),
      zoneName: form.value.zoneName,
      longitude: form.value.longitude,
      latitude: form.value.latitude,
      entryMethod: form.value.entryMethod,
      remark: form.value.remark
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
      <ElFormItem label="识别码" :required="!isEdit">
        <ElInput v-model="form.sn" placeholder="请输入识别码" />
      </ElFormItem>
      <ElFormItem label="目标型号">
        <ElSelect v-model="form.model" style="width: 100%" placeholder="请选择目标型号">
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
        <div class="black-white-frequency-editor">
          <div v-for="band in form.frequencyBands" :key="band.id" class="black-white-frequency-row">
            <ElInputNumber
              v-model="band.value"
              :min="0.001"
              :max="300"
              :precision="3"
              :step="0.1"
              controls-position="right"
              class="black-white-frequency-row__input"
              placeholder="请输入频段"
            />
            <span class="black-white-frequency-row__unit">GHz</span>
            <BaseButton
              v-if="form.frequencyBands.length > 1"
              type="danger"
              link
              @click="removeFrequencyBand(band.id)"
            >
              删除
            </BaseButton>
          </div>
          <BaseButton type="primary" link @click="addFrequencyBand">+ 新增频段</BaseButton>
        </div>
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

<style scoped lang="less">
.black-white-frequency-editor {
  width: 100%;
}

.black-white-frequency-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.black-white-frequency-row__input {
  width: 180px;
}

.black-white-frequency-row__unit {
  color: var(--el-text-color-regular);
}
</style>
