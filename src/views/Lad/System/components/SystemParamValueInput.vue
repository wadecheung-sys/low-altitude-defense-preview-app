<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag,
  ElUpload
} from 'element-plus'
import { BaseButton } from '@/components/Button'
import {
  ALARM_AUDIO_ACCEPT,
  ALARM_PARAM_KEYS,
  ALARM_VISUAL_MODE_OPTIONS
} from '@/api/lad/system/alarmParams'
import { getDictEntriesByCodeApi } from '@/api/lad/system'
import type { SystemParam } from '@/api/lad/system/types'
import {
  LAD_DATA_SOURCE_DICT_CODE,
  LAD_DATA_SOURCE_OPTIONS,
  LAD_DEFAULT_DATA_SOURCE_PARAM_KEY
} from '@/constants/ladDataSources'

const props = defineProps<{
  param: SystemParam
  modelValue: string | number | boolean | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [string | number | boolean | null]
}>()

const uploadProps = {
  action: '#',
  autoUpload: false,
  showFileList: false
}

const isAlarmAudioParam = computed(() => props.param.paramKey === ALARM_PARAM_KEYS.audioFile)
const isAlarmVisualParam = computed(() => props.param.paramKey === ALARM_PARAM_KEYS.visualMode)
const isAlarmMaxDurationParam = computed(
  () => props.param.paramKey === ALARM_PARAM_KEYS.maxDurationSeconds
)
const isDefaultDataSourceParam = computed(
  () => props.param.paramKey === LAD_DEFAULT_DATA_SOURCE_PARAM_KEY
)
const allowsEmptyNumber = computed(() => props.param.group === '模拟')
const dataSourceOptions = ref<Array<{ label: string; value: string }>>(
  LAD_DATA_SOURCE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))
)

const stringValue = computed({
  get: () => String(props.modelValue ?? ''),
  set: (val) => emit('update:modelValue', val)
})

const boolValue = computed({
  get: () => Boolean(props.modelValue),
  set: (val) => emit('update:modelValue', val)
})

const numValue = computed({
  get: () => {
    const value = props.modelValue
    if (value === null || value === undefined || value === '') return undefined
    return Number(value)
  },
  set: (val) => emit('update:modelValue', val ?? (allowsEmptyNumber.value ? null : 0))
})

const displayText = computed(() => {
  const value = props.modelValue
  if (props.param.valueType === 'boolean') {
    return value ? '是' : '否'
  }
  if (props.param.valueType === 'number') {
    if (value === null || value === undefined || value === '') {
      return allowsEmptyNumber.value ? '-' : '—'
    }
    return String(value)
  }
  if (value === '' || value === null || value === undefined) return '—'
  return String(value)
})

function applyAlarmAudio(file: { name?: string }) {
  const name = file.name?.trim()
  emit('update:modelValue', name || '自定义告警音频.wav')
  ElMessage.success(`已选择音频文件：${name || '自定义告警音频.wav'}`)
  return false
}

function clearAlarmAudio() {
  emit('update:modelValue', '')
  ElMessage.success('已清除告警音频')
}

async function loadDataSourceOptions() {
  try {
    const res = await getDictEntriesByCodeApi(LAD_DATA_SOURCE_DICT_CODE)
    const options = res.data.map((item) => ({
      label: item.label,
      value: item.value || item.label
    }))
    if (options.length) dataSourceOptions.value = options
  } catch {
    dataSourceOptions.value = LAD_DATA_SOURCE_OPTIONS.map((item) => ({
      label: item.label,
      value: item.value
    }))
  }
}

onMounted(() => {
  if (isDefaultDataSourceParam.value) {
    void loadDataSourceOptions()
  }
})

watch(isDefaultDataSourceParam, (active) => {
  if (active) {
    void loadDataSourceOptions()
  }
})
</script>

<template>
  <div class="system-param-value">
    <template v-if="readonly">
      <ElTag
        v-if="param.valueType === 'boolean'"
        :type="modelValue ? 'success' : 'info'"
        size="small"
      >
        {{ displayText }}
      </ElTag>
      <span v-else class="system-param-value__readonly">{{ displayText }}</span>
    </template>

    <template v-else-if="isAlarmAudioParam">
      <div class="system-param-value__audio">
        <span class="system-param-value__audio-name" :class="{ 'is-empty': !stringValue.trim() }">
          {{ stringValue.trim() || '未上传音频文件' }}
        </span>
        <div class="system-param-value__audio-actions">
          <ElUpload
            v-bind="uploadProps"
            :accept="ALARM_AUDIO_ACCEPT"
            :before-upload="applyAlarmAudio"
          >
            <BaseButton type="primary">上传</BaseButton>
          </ElUpload>
          <BaseButton :disabled="!stringValue.trim()" @click="clearAlarmAudio">清除</BaseButton>
        </div>
      </div>
    </template>

    <ElSelect
      v-else-if="isDefaultDataSourceParam"
      v-model="stringValue"
      class="system-param-value__control"
      placeholder="请选择默认数据来源形式"
      filterable
    >
      <ElOption
        v-for="item in dataSourceOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </ElSelect>

    <ElSelect
      v-else-if="isAlarmVisualParam"
      v-model="stringValue"
      class="system-param-value__control"
      placeholder="请选择告警视觉表现形式"
    >
      <ElOption
        v-for="item in ALARM_VISUAL_MODE_OPTIONS"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </ElSelect>

    <ElSwitch v-else-if="param.valueType === 'boolean'" v-model="boolValue" />

    <ElInputNumber
      v-else-if="param.valueType === 'number'"
      :model-value="numValue"
      class="system-param-value__control"
      controls-position="right"
      :min="isAlarmMaxDurationParam ? 1 : undefined"
      :max="isAlarmMaxDurationParam ? 600 : undefined"
      :placeholder="allowsEmptyNumber ? '留空表示不触发' : undefined"
      @update:model-value="numValue = $event ?? undefined"
    />

    <ElInput v-else v-model="stringValue" class="system-param-value__control" clearable />
  </div>
</template>

<style scoped lang="less">
.system-param-value {
  width: 100%;
}

.system-param-value__readonly {
  font-size: 13px;
  line-height: 28px;
  color: var(--el-text-color-primary);
}

.system-param-value__control {
  width: 100%;
}

.system-param-value__audio {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.system-param-value__audio-name {
  flex: 1 1 180px;
  min-width: 0;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 20px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.system-param-value__audio-name.is-empty {
  color: var(--el-text-color-secondary);
}

.system-param-value__audio-actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
