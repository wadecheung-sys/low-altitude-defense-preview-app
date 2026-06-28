<script setup lang="ts">
import { computed } from 'vue'
import { ElDatePicker } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: string[] | null
    startPlaceholder?: string
    endPlaceholder?: string
    valueFormat?: string
  }>(),
  {
    startPlaceholder: '开始时间',
    endPlaceholder: '结束时间',
    valueFormat: 'YYYY-MM-DD HH:mm:ss'
  }
)

const emit = defineEmits<{
  'update:modelValue': [string[] | undefined]
}>()

const emitRange = (start?: string, end?: string) => {
  if (!start && !end) {
    emit('update:modelValue', undefined)
    return
  }
  emit('update:modelValue', [start ?? '', end ?? ''])
}

const startValue = computed({
  get: () => props.modelValue?.[0] ?? '',
  set: (val: string) => emitRange(val || undefined, props.modelValue?.[1] || undefined)
})

const endValue = computed({
  get: () => props.modelValue?.[1] ?? '',
  set: (val: string) => emitRange(props.modelValue?.[0] || undefined, val || undefined)
})
</script>

<template>
  <div class="valid-until-range-search">
    <ElDatePicker
      v-model="startValue"
      type="datetime"
      :value-format="valueFormat"
      :placeholder="startPlaceholder"
      clearable
    />
    <span class="valid-until-range-search__sep">至</span>
    <ElDatePicker
      v-model="endValue"
      type="datetime"
      :value-format="valueFormat"
      :placeholder="endPlaceholder"
      clearable
    />
  </div>
</template>

<style scoped lang="less">
.valid-until-range-search {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  width: auto;
  max-width: 100%;
  white-space: nowrap;

  :deep(.el-date-editor) {
    width: 200px !important;
    flex: 0 0 200px;
  }

  :deep(.el-input__wrapper) {
    width: 100%;
  }

  &__sep {
    flex: 0 0 auto;
    font-size: 14px;
    line-height: 32px;
    color: var(--el-text-color-regular);
  }
}
</style>
