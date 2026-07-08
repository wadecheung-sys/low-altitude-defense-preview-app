<script setup lang="ts">
import { getDeviceArchiveDetailApi, saveDeviceArchiveApi } from '@/api/lad/device'
import type {
  DeviceArchiveCategory,
  DeviceArchiveDetail,
  DeviceArchiveIndicator,
  DeviceArchiveIndicatorDataType
} from '@/api/lad/device/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import {
  DEVICE_ARCHIVE_PLACEHOLDER,
  deviceArchiveTypeOptions,
  deviceArchiveVendorOptions
} from './constants'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ElForm,
  ElFormItem,
  ElDatePicker,
  ElDialog,
  ElImage,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTimePicker
} from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'LadDeviceArchiveDetail' })

const route = useRoute()
const { push, go } = useRouter()

const loading = ref(false)
const saveLoading = ref(false)
const detail = ref<DeviceArchiveDetail | null>(null)
const formRef = ref<FormInstance>()
const imageUrl = ref<string | null>(DEVICE_ARCHIVE_PLACEHOLDER)
const indicatorRows = ref<DeviceArchiveIndicator[]>([])
const indicatorDialogVisible = ref(false)
const enabledState = ref(true)
const recordCategory = ref<Exclude<DeviceArchiveCategory, 'all'>>('eo')

const isCreateMode = computed(() => route.name === 'LadDeviceArchiveAdd')
const isViewMode = computed(() => route.name === 'LadDeviceArchiveDetail')
const isEditable = computed(() => !isViewMode.value)
const hasArchiveImage = computed(() =>
  Boolean(imageUrl.value && imageUrl.value !== DEVICE_ARCHIVE_PLACEHOLDER)
)

const recordId = computed(() => (route.params.id as string) || '')

const form = reactive({
  archiveNo: '',
  archiveName: '',
  deviceType: '',
  vendor: '',
  deviceModel: '',
  remark: ''
})

const rules: FormRules = {
  archiveName: [{ required: true, message: '请输入档案名称', trigger: 'blur' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  vendor: [{ required: true, message: '请选择厂商', trigger: 'change' }],
  deviceModel: [{ required: true, message: '请输入设备型号', trigger: 'blur' }]
}

const indicatorTypeOptions: { label: string; value: DeviceArchiveIndicatorDataType }[] = [
  { label: '文本', value: 'text' },
  { label: '数值', value: 'number' },
  { label: '时间', value: 'datetime' },
  { label: '下拉选项', value: 'select' }
]

const timeFormatOptions = [
  { label: '年月日 时分秒', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: '年月日', value: 'YYYY-MM-DD' },
  { label: '年月', value: 'YYYY-MM' },
  { label: '年', value: 'YYYY' },
  { label: '时分秒', value: 'HH:mm:ss' }
] as const

const indicatorDraft = reactive({
  item: '',
  unit: '',
  dataType: 'text' as DeviceArchiveIndicatorDataType,
  value: '',
  maxLength: 100,
  integerDigits: 8,
  decimalPlaces: 2,
  timeFormat: 'YYYY-MM-DD HH:mm:ss',
  options: [''] as string[]
})

const draftDatePickerType = computed(() => {
  if (indicatorDraft.timeFormat === 'YYYY') return 'year'
  if (indicatorDraft.timeFormat === 'YYYY-MM') return 'month'
  if (indicatorDraft.timeFormat === 'YYYY-MM-DD') return 'date'
  return 'datetime'
})

const draftNumberLimit = computed(() =>
  Number('9'.repeat(Math.min(12, Math.max(1, indicatorDraft.integerDigits))))
)

function updateDraftNumber(value: number | undefined) {
  indicatorDraft.value = value === undefined ? '' : String(value)
}

function indicatorDatePickerType(row: DeviceArchiveIndicator) {
  if (row.config?.timeFormat === 'YYYY') return 'year'
  if (row.config?.timeFormat === 'YYYY-MM') return 'month'
  if (row.config?.timeFormat === 'YYYY-MM-DD') return 'date'
  return 'datetime'
}

function indicatorNumberLimit(row: DeviceArchiveIndicator) {
  const digits = Math.min(12, Math.max(1, row.config?.integerDigits || 8))
  return Number('9'.repeat(digits))
}

function updateIndicatorNumber(row: DeviceArchiveIndicator, value: number | undefined) {
  row.value = value === undefined ? '' : String(value)
}

let indicatorSeq = 0
function nextIndicatorId() {
  indicatorSeq += 1
  return `ind-${Date.now()}-${indicatorSeq}`
}

function resetCreateState() {
  detail.value = null
  form.archiveNo = ''
  form.archiveName = ''
  form.deviceType = '雷达'
  form.vendor = '凡双科技'
  form.deviceModel = ''
  form.remark = ''
  enabledState.value = true
  recordCategory.value = 'radar'
  imageUrl.value = DEVICE_ARCHIVE_PLACEHOLDER
  indicatorRows.value = [
    {
      id: nextIndicatorId(),
      item: '设备重量',
      unit: 'kg',
      dataType: 'number',
      config: { integerDigits: 3, decimalPlaces: 1 },
      value: '55'
    },
    {
      id: nextIndicatorId(),
      item: '额定电压',
      unit: 'V',
      dataType: 'number',
      config: { integerDigits: 3, decimalPlaces: 0 },
      value: '220'
    }
  ]
}

const applyDetail = (data: DeviceArchiveDetail) => {
  detail.value = data
  form.archiveNo = data.archiveNo
  form.archiveName = data.archiveName
  form.deviceType = data.deviceType
  form.vendor = data.vendor
  form.deviceModel = data.deviceModel
  form.remark = data.remark
  enabledState.value = data.enabled
  recordCategory.value = data.category
  imageUrl.value = data.imageUrl
  indicatorRows.value = data.indicators.map((i) => ({ ...i }))
}

const fetchDetail = async () => {
  if (isCreateMode.value) {
    resetCreateState()
    return
  }
  loading.value = true
  try {
    const res = await getDeviceArchiveDetailApi(recordId.value)
    applyDetail(res.data)
  } catch {
    detail.value = null
    ElMessage.error('档案不存在或已删除')
    push('/lad/device/archive')
  } finally {
    loading.value = false
  }
}

function validateIndicators(): string | null {
  if (!indicatorRows.value.length) {
    return '请至少填写一条档案指标'
  }
  for (const row of indicatorRows.value) {
    if (!row.item.trim() || !row.unit.trim()) {
      return '指标项与单位不能为空'
    }
  }
  return null
}

function addIndicatorRow() {
  Object.assign(indicatorDraft, {
    item: '',
    unit: '',
    dataType: 'text',
    value: '',
    maxLength: 100,
    integerDigits: 8,
    decimalPlaces: 2,
    timeFormat: 'YYYY-MM-DD HH:mm:ss',
    options: ['']
  })
  indicatorDialogVisible.value = true
}

function addEnumOption() {
  indicatorDraft.options.push('')
}

function removeEnumOption(index: number) {
  indicatorDraft.options.splice(index, 1)
  if (!indicatorDraft.options.length) indicatorDraft.options.push('')
}

function indicatorTypeLabel(row: DeviceArchiveIndicator) {
  const label =
    indicatorTypeOptions.find((option) => option.value === row.dataType)?.label || '文本'
  const config = row.config || {}
  if (row.dataType === 'text') return `${label}（最多 ${config.maxLength || 100} 字符）`
  if (row.dataType === 'number') {
    return `${label}（整数 ${config.integerDigits || 8} 位 / 小数 ${config.decimalPlaces ?? 0} 位）`
  }
  if (row.dataType === 'datetime') {
    return `${label}（${config.timeFormat || 'YYYY-MM-DD HH:mm:ss'}）`
  }
  if (row.dataType === 'select') return `${label}（${config.options?.length || 0} 项）`
  return label
}

function confirmAddIndicator() {
  const item = indicatorDraft.item.trim()
  const unit = indicatorDraft.unit.trim()
  if (!item || !unit) {
    ElMessage.warning('请填写指标项与单位')
    return
  }
  const enumOptions = indicatorDraft.options.map((option) => option.trim()).filter(Boolean)
  if (indicatorDraft.dataType === 'select' && !enumOptions.length) {
    ElMessage.warning('请至少新增一个枚举值')
    return
  }
  if (
    indicatorDraft.dataType === 'text' &&
    indicatorDraft.value.length > indicatorDraft.maxLength
  ) {
    ElMessage.warning(`默认值不能超过 ${indicatorDraft.maxLength} 个字符`)
    return
  }

  const config =
    indicatorDraft.dataType === 'text'
      ? { maxLength: indicatorDraft.maxLength }
      : indicatorDraft.dataType === 'number'
        ? {
            integerDigits: indicatorDraft.integerDigits,
            decimalPlaces: indicatorDraft.decimalPlaces
          }
        : indicatorDraft.dataType === 'datetime'
          ? { timeFormat: indicatorDraft.timeFormat }
          : { options: enumOptions }

  indicatorRows.value.push({
    id: nextIndicatorId(),
    item,
    unit,
    dataType: indicatorDraft.dataType,
    config,
    value: indicatorDraft.value.trim()
  })
  indicatorDialogVisible.value = false
}

function removeIndicatorRow(row: DeviceArchiveIndicator) {
  indicatorRows.value = indicatorRows.value.filter((r) => r.id !== row.id)
}

async function save() {
  if (!isEditable.value) return
  const indErr = validateIndicators()
  if (indErr) {
    ElMessage.warning(indErr)
    return
  }
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saveLoading.value = true
  try {
    const res = await saveDeviceArchiveApi({
      id: isCreateMode.value ? undefined : recordId.value,
      archiveNo: form.archiveNo || undefined,
      archiveName: form.archiveName.trim(),
      deviceType: form.deviceType,
      vendor: form.vendor,
      deviceModel: form.deviceModel.trim(),
      enabled: enabledState.value,
      category: recordCategory.value,
      remark: form.remark,
      imageUrl: imageUrl.value,
      indicators: indicatorRows.value.map((r) => ({
        id: r.id,
        item: r.item.trim(),
        unit: r.unit.trim(),
        dataType: r.dataType || 'text',
        config: r.config
          ? { ...r.config, options: r.config.options ? [...r.config.options] : undefined }
          : { maxLength: 100 },
        value: r.value.trim()
      }))
    })
    ElMessage.success(isCreateMode.value ? '新增成功' : '保存成功')
    if (isCreateMode.value) {
      await push(`/lad/device/archive/edit/${res.data.id}`)
      return
    }
    const full = await getDeviceArchiveDetailApi(res.data.id)
    applyDetail(full.data)
  } finally {
    saveLoading.value = false
  }
}

function loadPage() {
  fetchDetail()
}

onMounted(loadPage)

watch(
  () => `${String(route.name)}|${recordId.value}`,
  () => {
    loadPage()
  }
)
</script>

<template>
  <ContentDetailWrap v-loading="loading && !isCreateMode" title="">
    <template #header>
      <BaseButton v-if="isEditable" type="primary" :loading="saveLoading" @click="save">
        保存
      </BaseButton>
      <BaseButton @click="go(-1)">返回</BaseButton>
    </template>

    <div v-if="isCreateMode || detail" class="archive-detail-grid">
      <section class="archive-detail-panel">
        <div class="archive-detail-panel__title">档案图像</div>
        <div class="archive-detail-image">
          <ElImage
            v-if="hasArchiveImage"
            :src="imageUrl"
            fit="contain"
            class="archive-detail-image__img"
          />
          <div v-else class="device-radar-placeholder" aria-label="暂无设备图像">
            <div class="device-radar-placeholder__scope">
              <i class="device-radar-placeholder__ring ring-1"></i>
              <i class="device-radar-placeholder__ring ring-2"></i>
              <i class="device-radar-placeholder__ring ring-3"></i>
              <i class="device-radar-placeholder__axis axis-x"></i>
              <i class="device-radar-placeholder__axis axis-y"></i>
              <i class="device-radar-placeholder__sweep"></i>
              <i class="device-radar-placeholder__target target-1"></i>
              <i class="device-radar-placeholder__target target-2"></i>
              <i class="device-radar-placeholder__center"></i>
            </div>
            <strong>暂无设备图像</strong>
            <span>RADAR DEVICE</span>
          </div>
        </div>
      </section>

      <section class="archive-detail-panel">
        <div class="archive-detail-panel__title">基本信息</div>
        <ElForm
          ref="formRef"
          label-position="top"
          :model="form"
          :rules="rules"
          class="archive-detail-form"
          :disabled="!isEditable"
        >
          <ElFormItem label="档案编号">
            <ElInput
              v-model="form.archiveNo"
              :placeholder="isCreateMode ? '保存后自动生成' : ''"
              disabled
            />
          </ElFormItem>
          <ElFormItem label="档案" prop="archiveName" required>
            <ElInput v-model="form.archiveName" placeholder="请输入档案名称" clearable />
          </ElFormItem>
          <ElFormItem label="设备类型" prop="deviceType" required>
            <ElSelect v-model="form.deviceType" placeholder="--" clearable class="w-100%">
              <ElOption
                v-for="o in deviceArchiveTypeOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="厂商" prop="vendor" required>
            <ElSelect v-model="form.vendor" placeholder="--" clearable class="w-100%">
              <ElOption
                v-for="o in deviceArchiveVendorOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="设备型号" prop="deviceModel" required>
            <ElInput v-model="form.deviceModel" placeholder="请输入设备型号" clearable />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </ElFormItem>
        </ElForm>
      </section>

      <section class="archive-detail-panel archive-detail-panel--wide">
        <div class="archive-detail-panel__title">档案指标</div>
        <div v-if="isEditable" class="archive-detail-ind-toolbar mb-10px">
          <BaseButton type="primary" @click="addIndicatorRow">新增指标</BaseButton>
        </div>
        <ElTable :data="indicatorRows" border stripe row-key="id" max-height="420">
          <ElTableColumn type="index" label="序号" width="64" />
          <ElTableColumn label="指标项" min-width="130">
            <template #header>
              <span><span class="archive-detail-req">*</span>指标项</span>
            </template>
            <template #default="{ row }">
              <ElInput v-if="isEditable" v-model="row.item" placeholder="请输入" size="small" />
              <span v-else>{{ row.item }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="单位" width="100">
            <template #header>
              <span><span class="archive-detail-req">*</span>单位</span>
            </template>
            <template #default="{ row }">
              <ElInput v-if="isEditable" v-model="row.unit" placeholder="请输入" size="small" />
              <span v-else>{{ row.unit }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="数据规则" min-width="190">
            <template #default="{ row }">
              <span>{{ indicatorTypeLabel(row) }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="默认值" min-width="120">
            <template #default="{ row }">
              <template v-if="isEditable">
                <ElInputNumber
                  v-if="row.dataType === 'number'"
                  :model-value="row.value === '' ? undefined : Number(row.value)"
                  :precision="row.config?.decimalPlaces ?? 0"
                  :min="-indicatorNumberLimit(row)"
                  :max="indicatorNumberLimit(row)"
                  controls-position="right"
                  class="w-100%"
                  size="small"
                  placeholder="非必填"
                  @update:model-value="updateIndicatorNumber(row, $event)"
                />
                <ElSelect
                  v-else-if="row.dataType === 'select'"
                  v-model="row.value"
                  class="w-100%"
                  size="small"
                  clearable
                  placeholder="非必填"
                >
                  <ElOption
                    v-for="option in row.config?.options || []"
                    :key="option"
                    :label="option"
                    :value="option"
                  />
                </ElSelect>
                <ElTimePicker
                  v-else-if="row.dataType === 'datetime' && row.config?.timeFormat === 'HH:mm:ss'"
                  v-model="row.value"
                  value-format="HH:mm:ss"
                  format="HH:mm:ss"
                  class="w-100%"
                  size="small"
                  placeholder="非必填"
                />
                <ElDatePicker
                  v-else-if="row.dataType === 'datetime'"
                  v-model="row.value"
                  :type="indicatorDatePickerType(row)"
                  :value-format="row.config?.timeFormat || 'YYYY-MM-DD HH:mm:ss'"
                  :format="row.config?.timeFormat || 'YYYY-MM-DD HH:mm:ss'"
                  class="w-100%"
                  size="small"
                  placeholder="非必填"
                />
                <ElInput
                  v-else
                  v-model="row.value"
                  :maxlength="row.config?.maxLength || 100"
                  placeholder="非必填"
                  size="small"
                />
              </template>
              <span v-else>{{ row.value || '—' }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn v-if="isEditable" label="操作" width="88" fixed="right">
            <template #default="{ row }">
              <BaseButton type="danger" link @click="removeIndicatorRow(row)">删除</BaseButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </section>
    </div>

    <ElDialog v-model="indicatorDialogVisible" title="新增档案指标" width="600px" destroy-on-close>
      <ElForm label-position="top" class="indicator-dialog-form">
        <div class="indicator-dialog-grid">
          <ElFormItem label="指标项" required>
            <ElInput v-model="indicatorDraft.item" placeholder="请输入指标名称" clearable />
          </ElFormItem>
          <ElFormItem label="单位" required>
            <ElInput v-model="indicatorDraft.unit" placeholder="如：kg、V、GHz" clearable />
          </ElFormItem>
        </div>
        <ElFormItem label="数据类型" required>
          <ElSelect v-model="indicatorDraft.dataType" class="w-100%">
            <ElOption
              v-for="option in indicatorTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <div v-if="indicatorDraft.dataType === 'text'" class="indicator-type-config">
          <ElFormItem label="最大长度">
            <ElInputNumber
              v-model="indicatorDraft.maxLength"
              :min="1"
              :max="2000"
              controls-position="right"
              class="w-100%"
            />
          </ElFormItem>
        </div>
        <div
          v-else-if="indicatorDraft.dataType === 'number'"
          class="indicator-dialog-grid indicator-type-config"
        >
          <ElFormItem label="整数位数">
            <ElInputNumber
              v-model="indicatorDraft.integerDigits"
              :min="1"
              :max="18"
              controls-position="right"
              class="w-100%"
            />
          </ElFormItem>
          <ElFormItem label="小数位数">
            <ElInputNumber
              v-model="indicatorDraft.decimalPlaces"
              :min="0"
              :max="8"
              controls-position="right"
              class="w-100%"
            />
          </ElFormItem>
        </div>
        <div v-else-if="indicatorDraft.dataType === 'datetime'" class="indicator-type-config">
          <ElFormItem label="时间格式">
            <ElSelect v-model="indicatorDraft.timeFormat" class="w-100%">
              <ElOption
                v-for="option in timeFormatOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </div>
        <div v-else class="indicator-type-config">
          <div class="indicator-enum-head">
            <span>枚举值 <b>*</b></span>
            <BaseButton type="primary" link @click="addEnumOption">新增枚举值</BaseButton>
          </div>
          <div v-for="(_, index) in indicatorDraft.options" :key="index" class="indicator-enum-row">
            <ElInput v-model="indicatorDraft.options[index]" :placeholder="`选项 ${index + 1}`" />
            <BaseButton type="danger" link @click="removeEnumOption(index)">删除</BaseButton>
          </div>
        </div>

        <ElFormItem label="默认值">
          <ElSelect
            v-if="indicatorDraft.dataType === 'select'"
            v-model="indicatorDraft.value"
            class="w-100%"
            clearable
            placeholder="非必填"
          >
            <ElOption
              v-for="option in indicatorDraft.options.filter(Boolean)"
              :key="option"
              :label="option"
              :value="option"
            />
          </ElSelect>
          <ElInputNumber
            v-else-if="indicatorDraft.dataType === 'number'"
            :model-value="indicatorDraft.value === '' ? undefined : Number(indicatorDraft.value)"
            :precision="indicatorDraft.decimalPlaces"
            :min="-draftNumberLimit"
            :max="draftNumberLimit"
            controls-position="right"
            class="w-100%"
            placeholder="非必填"
            @update:model-value="updateDraftNumber"
          />
          <ElTimePicker
            v-else-if="
              indicatorDraft.dataType === 'datetime' && indicatorDraft.timeFormat === 'HH:mm:ss'
            "
            v-model="indicatorDraft.value"
            value-format="HH:mm:ss"
            format="HH:mm:ss"
            class="w-100%"
            placeholder="非必填"
          />
          <ElDatePicker
            v-else-if="indicatorDraft.dataType === 'datetime'"
            v-model="indicatorDraft.value"
            :type="draftDatePickerType"
            :value-format="indicatorDraft.timeFormat"
            :format="indicatorDraft.timeFormat"
            class="w-100%"
            placeholder="非必填"
          />
          <ElInput
            v-else
            v-model="indicatorDraft.value"
            :maxlength="indicatorDraft.maxLength"
            placeholder="非必填"
            clearable
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <BaseButton @click="indicatorDialogVisible = false">取消</BaseButton>
        <BaseButton type="primary" @click="confirmAddIndicator">确定新增</BaseButton>
      </template>
    </ElDialog>
  </ContentDetailWrap>
</template>

<style scoped lang="less">
.archive-detail-grid {
  display: grid;
  grid-template-columns: 250px minmax(300px, 0.8fr) minmax(720px, 1.8fr);
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 1200px) {
  .archive-detail-grid {
    grid-template-columns: 1fr;
  }
}

.archive-detail-panel {
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.archive-detail-panel__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.archive-detail-panel--wide {
  min-width: 720px;
}

.archive-detail-image {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  height: min(38vh, 360px);
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
}

.archive-detail-image__img {
  width: 100%;
  max-height: 100%;
}

.device-radar-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  color: #708696;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.device-radar-placeholder__scope {
  position: relative;
  width: 138px;
  height: 138px;
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid #9db4c2;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(66 124 151 / 9%), rgb(66 124 151 / 1.5%));
  box-shadow:
    inset 0 0 28px rgb(42 96 122 / 8%),
    0 8px 24px rgb(56 89 105 / 8%);
}

.device-radar-placeholder__ring,
.device-radar-placeholder__axis,
.device-radar-placeholder__sweep,
.device-radar-placeholder__target,
.device-radar-placeholder__center {
  position: absolute;
  display: block;
}

.device-radar-placeholder__ring {
  top: 50%;
  left: 50%;
  border: 1px solid rgb(78 126 148 / 30%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.device-radar-placeholder__ring.ring-1 {
  width: 38px;
  height: 38px;
}
.device-radar-placeholder__ring.ring-2 {
  width: 78px;
  height: 78px;
}
.device-radar-placeholder__ring.ring-3 {
  width: 116px;
  height: 116px;
}
.device-radar-placeholder__axis {
  background: rgb(78 126 148 / 20%);
}
.device-radar-placeholder__axis.axis-x {
  top: 50%;
  left: 10px;
  width: calc(100% - 20px);
  height: 1px;
}
.device-radar-placeholder__axis.axis-y {
  top: 10px;
  left: 50%;
  width: 1px;
  height: calc(100% - 20px);
}
.device-radar-placeholder__sweep {
  inset: 8px;
  border-radius: 50%;
  background: conic-gradient(from 10deg, rgb(45 129 164 / 30%), transparent 28%);
  animation: archive-radar-sweep 4s linear infinite;
}
.device-radar-placeholder__target {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #5c94aa;
  box-shadow: 0 0 0 4px rgb(92 148 170 / 15%);
}
.device-radar-placeholder__target.target-1 {
  top: 37px;
  right: 34px;
}
.device-radar-placeholder__target.target-2 {
  bottom: 31px;
  left: 43px;
}
.device-radar-placeholder__center {
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border: 2px solid #527f93;
  border-radius: 50%;
  background: #f4f8fa;
  transform: translate(-50%, -50%);
}
.device-radar-placeholder strong {
  color: #526b79;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.device-radar-placeholder > span {
  margin-top: 3px;
  color: #9aabb5;
  font-size: 9px;
  letter-spacing: 0.22em;
}

@keyframes archive-radar-sweep {
  to {
    transform: rotate(360deg);
  }
}

.archive-detail-form {
  :deep(.el-form-item__label) {
    padding-bottom: 4px;
    line-height: 1.4;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
}

.archive-detail-req {
  margin-right: 2px;
  color: var(--el-color-danger);
}

.indicator-dialog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.indicator-type-config {
  margin: 0 0 16px;
  padding: 12px 14px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.indicator-enum-head,
.indicator-enum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.indicator-enum-head {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.indicator-enum-head b {
  color: var(--el-color-danger);
}
.indicator-enum-row {
  margin-bottom: 8px;
}

@media (max-width: 640px) {
  .indicator-dialog-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

@media (max-width: 1200px) {
  .archive-detail-panel--wide {
    min-width: 0;
  }
}
</style>
