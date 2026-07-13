<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElForm, ElFormItem, ElMessage, ElMessageBox, ElTooltip } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import {
  getSystemParamListApi,
  restoreSystemParamDefaultsApi,
  saveSystemParamApi
} from '@/api/lad/system'
import { ALARM_PARAM_KEYS } from '@/api/lad/system/alarmParams'
import type { ParamGroup, SystemParam } from '@/api/lad/system/types'
import SystemParamValueInput from './components/SystemParamValueInput.vue'

defineOptions({ name: 'LadSystemParams' })

const PARAM_GROUP_ORDER: ParamGroup[] = ['系统', '存储', '管制', '模拟', '告警']

const loading = ref(false)
const editing = ref(false)
const saveLoading = ref(false)
const restoreLoading = ref(false)
const params = ref<SystemParam[]>([])
const formValues = ref<Record<string, string | number | boolean | null>>({})

const groupedParams = computed(() => {
  const map = new Map<ParamGroup, SystemParam[]>()
  PARAM_GROUP_ORDER.forEach((group) => map.set(group, []))
  params.value.forEach((param) => {
    const list = map.get(param.group) ?? []
    list.push(param)
    map.set(param.group, list)
  })
  return PARAM_GROUP_ORDER.map((group) => ({
    group,
    items: map.get(group) ?? []
  })).filter((section) => section.items.length > 0)
})

function toFormValue(param: SystemParam): string | number | boolean | null {
  const value = param.paramValue
  if (param.valueType === 'boolean') return Boolean(value)
  if (param.valueType === 'number') {
    if (value === null || value === undefined || value === '') return null
    return Number(value)
  }
  return String(value ?? '')
}

function syncFormValues(list: SystemParam[]) {
  const next: Record<string, string | number | boolean | null> = {}
  list.forEach((param) => {
    next[param.id] = toFormValue(param)
  })
  formValues.value = next
}

async function loadParams() {
  loading.value = true
  try {
    const res = await getSystemParamListApi({ pageIndex: 1, pageSize: 200 })
    params.value = res.data.list
    syncFormValues(res.data.list)
  } finally {
    loading.value = false
  }
}

function startEdit() {
  editing.value = true
}

function cancelEdit() {
  syncFormValues(params.value)
  editing.value = false
}

function validateParam(param: SystemParam, value: string | number | boolean | null): string | null {
  if (param.paramKey === ALARM_PARAM_KEYS.maxDurationSeconds) {
    const duration = value === null || value === undefined || value === '' ? undefined : Number(value)
    if (duration === undefined || !Number.isFinite(duration) || duration < 1) {
      return '持续时间须大于 0 秒'
    }
  }
  if (param.paramKey === ALARM_PARAM_KEYS.visualMode) {
    if (!String(value ?? '').trim()) {
      return '请选择告警视觉表现形式'
    }
  }
  return null
}

async function saveAll() {
  for (const param of params.value) {
    const message = validateParam(param, formValues.value[param.id])
    if (message) {
      ElMessage.warning(`${param.paramName}：${message}`)
      return
    }
  }

  saveLoading.value = true
  try {
    await Promise.all(
      params.value.map((param) =>
        saveSystemParamApi({
          id: param.id,
          paramValue: formValues.value[param.id]
        })
      )
    )
    await loadParams()
    editing.value = false
    ElMessage.success('参数配置已保存')
  } finally {
    saveLoading.value = false
  }
}

async function restoreDefaults() {
  await ElMessageBox.confirm('确认将所有参数恢复为系统初始值吗？当前修改将被覆盖。', '恢复初始值', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
  restoreLoading.value = true
  try {
    await restoreSystemParamDefaultsApi()
    await loadParams()
    editing.value = false
    ElMessage.success('已恢复初始值')
  } finally {
    restoreLoading.value = false
  }
}

onMounted(() => {
  loadParams()
})
</script>

<template>
  <ContentWrap title="参数配置" message="按业务分组维护系统运行参数，编辑后统一保存。">
    <template #header>
      <div class="system-params__actions">
        <template v-if="!editing">
          <BaseButton type="primary" @click="startEdit">编辑</BaseButton>
          <BaseButton :loading="restoreLoading" @click="restoreDefaults">恢复初始值</BaseButton>
        </template>
        <template v-else>
          <BaseButton type="primary" :loading="saveLoading" @click="saveAll">保存</BaseButton>
          <BaseButton @click="cancelEdit">取消</BaseButton>
        </template>
      </div>
    </template>

    <div v-loading="loading" class="system-params">
      <section v-for="section in groupedParams" :key="section.group" class="system-params__group">
        <h3 class="system-params__group-title">{{ section.group }}</h3>
        <ElForm class="system-params__form" label-position="top" :disabled="!editing">
          <div class="system-params__form-grid">
            <ElFormItem
              v-for="param in section.items"
              :key="param.id"
              class="system-params__form-item"
            >
              <template #label>
                <span class="system-params__label">
                  {{ param.paramName }}
                  <ElTooltip
                    v-if="param.remark"
                    :content="param.remark"
                    placement="top"
                    effect="dark"
                  >
                    <Icon
                      icon="vi-bi:question-circle-fill"
                      :size="14"
                      class="system-params__label-tip"
                    />
                  </ElTooltip>
                </span>
              </template>
              <SystemParamValueInput
                :param="param"
                :model-value="formValues[param.id]"
                :readonly="!editing"
                @update:model-value="formValues[param.id] = $event"
              />
            </ElFormItem>
          </div>
        </ElForm>
      </section>
    </div>
  </ContentWrap>
</template>

<style scoped lang="less">
.system-params {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.system-params__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.system-params__group {
  padding-top: 10px;

  &:first-child {
    padding-top: 0;
  }

  & + & {
    margin-top: 2px;
    padding-top: 12px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }
}

.system-params__group-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-regular);
}

.system-params__form {
  width: 100%;
}

.system-params__form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 16px;
}

.system-params__label {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.system-params__label-tip {
  color: var(--el-text-color-secondary);
  cursor: help;
}

.system-params__form-item {
  margin-bottom: 0;

  :deep(.el-form-item__label) {
    margin-bottom: 4px;
    padding-bottom: 0;
    font-size: 13px;
    line-height: 20px;
  }

  :deep(.el-form-item__content) {
    line-height: 1.2;
  }
}

@media (max-width: 1200px) {
  .system-params__form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .system-params__form-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1600px) {
  .system-params__form-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
