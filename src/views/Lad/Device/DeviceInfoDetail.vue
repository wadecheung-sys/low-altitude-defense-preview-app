<script setup lang="ts">
import { getDeviceArchiveDetailApi, getDeviceArchiveListApi } from '@/api/lad/device'
import type { DeviceArchiveItem } from '@/api/lad/device'
import {
  getDeviceInfoDetailApi,
  runDeviceSelfCheckApi,
  saveDeviceInfoApi
} from '@/api/lad/device-info'
import { deviceSupportsSelfCheck } from '@/api/lad/device-info/deviceSelfCheck'
import type {
  DeviceExtendedField,
  DeviceInfoDetail,
  DeviceLinkedArchive,
  DeviceSelfCheckResult
} from '@/api/lad/device-info/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import { deviceInfoTypeOptions } from './deviceInfoConstants'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ElAlert,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElImage,
  ElInput,
  ElInputNumber,
  ElLink,
  ElMessage,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTag,
  ElTimePicker
} from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'LadDeviceInfoDetail' })

const route = useRoute()
const { push, go } = useRouter()

const loading = ref(false)
const saveLoading = ref(false)
const archiveLoading = ref(false)
const detail = ref<DeviceInfoDetail | null>(null)
const currentLinkedArchive = ref<DeviceLinkedArchive | null>(null)
const archiveOptions = ref<DeviceArchiveItem[]>([])
const formRef = ref<FormInstance>()
const metricsTab = ref<'archive' | 'extend'>('extend')
const extendedRows = ref<DeviceExtendedField[]>([])
const deviceImageUrl = ref('')
const imageInputRef = ref<HTMLInputElement>()
const selfCheckLoading = ref(false)
const selfCheckVisible = ref(false)
const selfCheckResult = ref<DeviceSelfCheckResult | null>(null)

const isCreateMode = computed(() => route.name === 'LadDeviceInfoAdd')
const isMonitorDetailMode = computed(() => route.name === 'LadDeviceMonitorDetail')
const isViewMode = computed(() => route.name === 'LadDeviceDetail' || isMonitorDetailMode.value)
const isEditable = computed(() => !isViewMode.value)
const recordId = computed(() => (route.params.id as string) || '')
const detailFallbackPath = computed(() =>
  isMonitorDetailMode.value ? '/lad/device/monitor' : '/lad/device/info/list'
)

const linkedArchive = computed(() => currentLinkedArchive.value)
const archiveSelectOptions = computed(() => {
  const selectedArchiveId = form.archiveId
  return archiveOptions.value.filter((item) => item.enabled || item.id === selectedArchiveId)
})

const supportsSelfCheck = computed(
  () => detail.value?.supportsSelfCheck ?? deviceSupportsSelfCheck(form.deviceType)
)

const selfCheckOverallTag = computed(() => {
  const overall = selfCheckResult.value?.overall
  if (overall === 'healthy') return { type: 'success' as const, label: '健康' }
  if (overall === 'degraded') return { type: 'warning' as const, label: '告警' }
  if (overall === 'fault') return { type: 'danger' as const, label: '故障' }
  return { type: 'info' as const, label: '不支持' }
})

function selfCheckItemTag(status: string) {
  if (status === 'pass') return { type: 'success' as const, label: '通过' }
  if (status === 'warn') return { type: 'warning' as const, label: '告警' }
  return { type: 'danger' as const, label: '异常' }
}

const form = reactive({
  deviceId: '',
  ipAddress: '',
  deviceName: '',
  archiveId: '',
  serialNo: '',
  deviceType: '',
  deployLocation: '',
  deployAddress: '',
  personInCharge: '',
  contactPhone: '',
  remark: ''
})

const rules: FormRules = {
  deviceId: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  archiveId: [{ required: true, message: '请选择基础档案', trigger: 'change' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
}

let extendSeq = 0
function nextExtendId() {
  extendSeq += 1
  return `ext-${Date.now()}-${extendSeq}`
}

const fixedExtendedLabels = [
  '安装方位',
  '现场编号',
  '维护周期',
  '部署位置',
  '详细地址',
  '负责人',
  '联系方式',
  '设备IP',
  '设备序列号'
]

function createFixedExtendedRows() {
  return fixedExtendedLabels.map((label) => ({ id: nextExtendId(), label, value: '' }))
}

function mapArchiveDetailToLinkedArchive(
  data: Awaited<ReturnType<typeof getDeviceArchiveDetailApi>>['data']
) {
  return {
    id: data.id,
    archiveNo: data.archiveNo,
    archiveName: data.archiveName,
    deviceType: data.deviceType,
    vendor: data.vendor,
    deviceModel: data.deviceModel,
    imageUrl: data.imageUrl,
    indicators: data.indicators.map((item) => ({ ...item }))
  } satisfies DeviceLinkedArchive
}

function indicatorDatePickerType(row: DeviceLinkedArchive['indicators'][number]) {
  const format = row.config?.timeFormat
  if (format === 'YYYY') return 'year'
  if (format === 'YYYY-MM') return 'month'
  if (format === 'YYYY-MM-DD') return 'date'
  return 'datetime'
}

function indicatorNumberLimit(row: DeviceLinkedArchive['indicators'][number]) {
  const digits = Math.min(12, Math.max(1, row.config?.integerDigits || 8))
  return Number('9'.repeat(digits))
}

function updateIndicatorNumber(
  row: DeviceLinkedArchive['indicators'][number],
  value: number | undefined
) {
  row.value = value === undefined ? '' : String(value)
}

function validateArchiveIndicatorValues() {
  for (const row of linkedArchive.value?.indicators || []) {
    if (!row.value) continue
    if (row.dataType === 'text' && row.value.length > (row.config?.maxLength || 100)) {
      return `“${row.item}”不能超过 ${row.config?.maxLength || 100} 个字符`
    }
    if (row.dataType === 'number') {
      const match = row.value.match(/^-?(\d+)(?:\.(\d+))?$/)
      if (!match) return `“${row.item}”必须填写有效数值`
      const integerLength = match[1]?.replace(/^0+/, '').length || 1
      const decimalLength = match[2]?.length || 0
      if (integerLength > (row.config?.integerDigits || 8)) {
        return `“${row.item}”整数部分最多 ${row.config?.integerDigits || 8} 位`
      }
      if (decimalLength > (row.config?.decimalPlaces ?? 0)) {
        return `“${row.item}”小数部分最多 ${row.config?.decimalPlaces ?? 0} 位`
      }
    }
    if (row.dataType === 'select' && !row.config?.options?.includes(row.value)) {
      return `“${row.item}”不在档案允许的选项范围内`
    }
  }
  return null
}

function applyDetail(data: DeviceInfoDetail) {
  detail.value = data
  currentLinkedArchive.value = data.linkedArchive
  form.deviceId = data.deviceId
  form.ipAddress = data.ipAddress
  form.deviceName = data.deviceName
  form.archiveId = data.archiveId || ''
  form.serialNo = data.serialNo
  form.deviceType = data.deviceType
  form.deployLocation = data.deployLocation
  form.deployAddress = data.deployAddress
  form.personInCharge = data.personInCharge
  form.contactPhone = data.contactPhone
  form.remark = data.remark
  deviceImageUrl.value = data.imageUrl || ''
  const fields = data.extendedFields.map((field) => ({ ...field }))
  const appendLegacyField = (label: string, value: string) => {
    if (!fields.some((field) => field.label === label)) {
      fields.push({ id: nextExtendId(), label, value })
    }
  }
  const legacyValues: Record<string, string> = {
    部署位置: data.deployLocation,
    详细地址: data.deployAddress,
    负责人: data.personInCharge,
    联系方式: data.contactPhone,
    设备IP: data.ipAddress,
    设备序列号: data.serialNo
  }
  fixedExtendedLabels.forEach((label) => appendLegacyField(label, legacyValues[label] || ''))
  extendedRows.value = fields
}

function resetCreate() {
  detail.value = null
  currentLinkedArchive.value = null
  form.deviceId = ''
  form.ipAddress = ''
  form.deviceName = ''
  form.archiveId = ''
  form.serialNo = ''
  form.deviceType = '无线电干扰'
  form.deployLocation = ''
  form.deployAddress = ''
  form.personInCharge = ''
  form.contactPhone = ''
  form.remark = ''
  deviceImageUrl.value = ''
  extendedRows.value = createFixedExtendedRows()
}

async function loadArchiveOptions() {
  const res = await getDeviceArchiveListApi({ pageIndex: 1, pageSize: 200 })
  archiveOptions.value = res.data.list
}

async function syncLinkedArchive(archiveId?: string) {
  if (!archiveId) {
    currentLinkedArchive.value = null
    return
  }
  if (currentLinkedArchive.value?.id === archiveId) return
  archiveLoading.value = true
  try {
    const res = await getDeviceArchiveDetailApi(archiveId)
    currentLinkedArchive.value = mapArchiveDetailToLinkedArchive(res.data)
  } catch {
    currentLinkedArchive.value = null
    ElMessage.warning('基础档案加载失败')
  } finally {
    archiveLoading.value = false
  }
}

async function fetchDetail() {
  await loadArchiveOptions()
  if (isCreateMode.value) {
    resetCreate()
    return
  }
  loading.value = true
  try {
    const res = await getDeviceInfoDetailApi(recordId.value)
    applyDetail(res.data)
  } catch {
    detail.value = null
    ElMessage.error('设备不存在或已删除')
    push(detailFallbackPath.value)
  } finally {
    loading.value = false
  }
}

function extendedValue(label: string) {
  return extendedRows.value.find((row) => row.label.trim() === label)?.value.trim() || ''
}

function openImagePicker() {
  imageInputRef.value?.click()
}

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG 或 WebP 图片')
    return
  }
  if (file.size > 3 * 1024 * 1024) {
    ElMessage.warning('设备图片不能超过 3 MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    deviceImageUrl.value = typeof reader.result === 'string' ? reader.result : ''
  }
  reader.readAsDataURL(file)
}

function removeDeviceImage() {
  deviceImageUrl.value = ''
}

function goArchiveDetail() {
  const id = linkedArchive.value?.id
  if (!id) return
  push(`/lad/device/archive/detail/${id}`)
}

async function runSelfCheck() {
  if (isCreateMode.value || !recordId.value) return
  if (!supportsSelfCheck.value) {
    ElMessage.info('当前设备类型不支持自检')
    return
  }
  selfCheckLoading.value = true
  selfCheckResult.value = null
  try {
    const res = await runDeviceSelfCheckApi(recordId.value)
    selfCheckResult.value = res.data
    selfCheckVisible.value = true
  } catch {
    ElMessage.error('自检请求失败')
  } finally {
    selfCheckLoading.value = false
  }
}

async function save() {
  if (!isEditable.value) return
  const indicatorError = validateArchiveIndicatorValues()
  if (indicatorError) {
    ElMessage.warning(indicatorError)
    metricsTab.value = 'archive'
    return
  }
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saveLoading.value = true
  try {
    const archiveInfo =
      linkedArchive.value?.archiveName || detail.value?.archiveInfo || form.deviceName.trim()
    const res = await saveDeviceInfoApi({
      id: isCreateMode.value ? undefined : recordId.value,
      deviceId: form.deviceId || undefined,
      deviceName: form.deviceName.trim(),
      archiveInfo,
      archiveId: form.archiveId || undefined,
      deviceType: form.deviceType,
      deployLocation: extendedValue('部署位置'),
      deployAddress: extendedValue('详细地址'),
      ipAddress: extendedValue('设备IP'),
      serialNo: extendedValue('设备序列号'),
      personInCharge: extendedValue('负责人'),
      contactPhone: extendedValue('联系方式'),
      remark: form.remark,
      imageUrl: deviceImageUrl.value,
      extendedFields: extendedRows.value.map((row) => ({
        id: row.id,
        label: row.label.trim(),
        value: row.value.trim()
      })),
      archiveIndicatorValues: Object.fromEntries(
        (linkedArchive.value?.indicators || []).map((row) => [row.id, row.value.trim()])
      )
    })
    ElMessage.success(isCreateMode.value ? '新增成功' : '保存成功')
    if (isCreateMode.value) {
      await push(`/lad/device/info/edit/${res.data.id}`)
    } else {
      const full = await getDeviceInfoDetailApi(res.data.id)
      applyDetail(full.data)
    }
  } finally {
    saveLoading.value = false
  }
}

onMounted(fetchDetail)

watch(
  () => form.archiveId,
  (archiveId) => {
    syncLinkedArchive(archiveId)
  }
)

watch(
  () => `${String(route.name)}|${recordId.value}`,
  () => {
    metricsTab.value = 'extend'
    fetchDetail()
  }
)
</script>

<template>
  <ContentDetailWrap v-loading="loading && !isCreateMode" title="">
    <template #header>
      <div class="device-detail-header">
        <div class="device-detail-header__left">
          <BaseButton v-if="isEditable" type="primary" :loading="saveLoading" @click="save">
            保存
          </BaseButton>
          <BaseButton @click="go(-1)">返回</BaseButton>
        </div>
        <BaseButton
          v-if="!isCreateMode && detail"
          type="primary"
          :loading="selfCheckLoading"
          :disabled="!supportsSelfCheck"
          @click="runSelfCheck"
        >
          设备自检
        </BaseButton>
      </div>
    </template>

    <div v-if="isCreateMode || detail" class="device-detail-grid">
      <section class="device-detail-panel">
        <div class="device-detail-image-head">
          <div class="device-detail-panel__title">设备图像</div>
          <div v-if="isEditable" class="device-detail-image-actions">
            <BaseButton type="primary" link @click="openImagePicker">
              {{ deviceImageUrl ? '更换图片' : '上传图片' }}
            </BaseButton>
            <BaseButton v-if="deviceImageUrl" type="danger" link @click="removeDeviceImage">
              移除
            </BaseButton>
          </div>
        </div>
        <input
          ref="imageInputRef"
          class="device-detail-image-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="onImageSelected"
        />
        <div class="device-detail-image">
          <ElImage
            v-if="deviceImageUrl"
            :src="deviceImageUrl"
            fit="contain"
            class="device-detail-image__img"
            :preview-src-list="[deviceImageUrl]"
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
        <p v-if="isEditable" class="device-detail-image__hint">
          支持 JPG、PNG、WebP，文件不超过 3 MB
        </p>
      </section>

      <section class="device-detail-panel">
        <div class="device-detail-panel__title">基本信息</div>
        <p class="device-detail-panel__hint">设备台账核心字段，与扩展信息区分。</p>
        <ElForm
          ref="formRef"
          label-position="top"
          :model="form"
          :rules="rules"
          class="device-detail-form"
          :disabled="!isEditable"
        >
          <ElFormItem label="设备编号" prop="deviceId" required>
            <ElInput v-model="form.deviceId" placeholder="请输入设备编号" clearable />
          </ElFormItem>
          <ElFormItem label="设备" prop="deviceName" required>
            <ElInput v-model="form.deviceName" placeholder="请输入设备名称" clearable />
          </ElFormItem>
          <ElFormItem label="基础档案" prop="archiveId" required>
            <ElSelect
              v-if="isEditable"
              v-model="form.archiveId"
              class="w-100%"
              filterable
              :loading="archiveLoading"
              placeholder="请选择基础档案"
            >
              <ElOption
                v-for="item in archiveSelectOptions"
                :key="item.id"
                :label="`${item.archiveName} (${item.archiveNo})`"
                :value="item.id"
              />
            </ElSelect>
            <template v-else-if="linkedArchive">
              <ElLink type="primary" :underline="false" @click="goArchiveDetail">
                {{ linkedArchive.archiveName }}
              </ElLink>
            </template>
            <span v-else class="text-[var(--el-text-color-secondary)]">
              {{ detail?.archiveInfo || '未关联' }}
            </span>
            <span v-if="linkedArchive" class="device-detail-form__sub">
              {{ linkedArchive.archiveNo }} / {{ linkedArchive.deviceModel }}
            </span>
          </ElFormItem>
          <ElFormItem label="设备类型" prop="deviceType" required>
            <ElSelect v-model="form.deviceType" placeholder="请选择" class="w-100%" clearable>
              <ElOption
                v-for="option in deviceInfoTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="厂商" required>
            <ElInput :model-value="linkedArchive?.vendor || '--'" disabled />
          </ElFormItem>
          <ElFormItem label="设备型号" required>
            <ElInput :model-value="linkedArchive?.deviceModel || '--'" disabled />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
          </ElFormItem>
        </ElForm>
      </section>

      <section class="device-detail-panel device-detail-panel--wide">
        <ElTabs v-model="metricsTab" class="device-detail-metrics-tabs">
          <ElTabPane label="扩展信息" name="extend">
            <ElForm label-position="top" class="device-detail-extended-form">
              <div class="device-detail-extended-grid">
                <ElFormItem v-for="row in extendedRows" :key="row.id" :label="row.label">
                  <ElInput
                    v-model="row.value"
                    :disabled="!isEditable"
                    placeholder="请输入"
                    clearable
                  />
                </ElFormItem>
              </div>
            </ElForm>
          </ElTabPane>
          <ElTabPane label="档案信息" name="archive">
            <p v-if="!linkedArchive" class="device-detail-metrics-empty">
              未关联基础档案，暂无档案信息。请绑定基础档案后查看。
            </p>
            <template v-else>
              <p class="device-detail-metrics-tip">
                以下信息来自基础档案“{{
                  linkedArchive.archiveName
                }}”。指标值按档案规则校验，可针对当前设备单独维护。
              </p>
              <ElTable :data="linkedArchive.indicators" border stripe row-key="id" max-height="360">
                <ElTableColumn type="index" label="序号" width="64" />
                <ElTableColumn prop="item" label="指标项" min-width="130" />
                <ElTableColumn prop="unit" label="单位" width="100" />
                <ElTableColumn label="指标值" min-width="180">
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
                        placeholder="可不填"
                        @update:model-value="updateIndicatorNumber(row, $event)"
                      />
                      <ElSelect
                        v-else-if="row.dataType === 'select'"
                        v-model="row.value"
                        class="w-100%"
                        clearable
                        placeholder="可不填"
                      >
                        <ElOption
                          v-for="option in row.config?.options || []"
                          :key="option"
                          :label="option"
                          :value="option"
                        />
                      </ElSelect>
                      <ElTimePicker
                        v-else-if="
                          row.dataType === 'datetime' && row.config?.timeFormat === 'HH:mm:ss'
                        "
                        v-model="row.value"
                        value-format="HH:mm:ss"
                        format="HH:mm:ss"
                        class="w-100%"
                        placeholder="可不填"
                      />
                      <ElDatePicker
                        v-else-if="row.dataType === 'datetime'"
                        v-model="row.value"
                        :type="indicatorDatePickerType(row)"
                        :value-format="row.config?.timeFormat || 'YYYY-MM-DD HH:mm:ss'"
                        :format="row.config?.timeFormat || 'YYYY-MM-DD HH:mm:ss'"
                        class="w-100%"
                        placeholder="可不填"
                      />
                      <ElInput
                        v-else
                        v-model="row.value"
                        :maxlength="row.config?.maxLength || 100"
                        show-word-limit
                        clearable
                        placeholder="可不填"
                      />
                    </template>
                    <span v-else>{{ row.value || '—' }}</span>
                  </template>
                </ElTableColumn>
              </ElTable>
            </template>
          </ElTabPane>
        </ElTabs>
      </section>
    </div>

    <ElDialog v-model="selfCheckVisible" title="设备自检结果" width="520px" destroy-on-close>
      <template v-if="selfCheckResult">
        <ElAlert
          :type="
            selfCheckResult.overall === 'healthy'
              ? 'success'
              : selfCheckResult.overall === 'degraded'
                ? 'warning'
                : selfCheckResult.overall === 'fault'
                  ? 'error'
                  : 'info'
          "
          :title="selfCheckResult.summary"
          :closable="false"
          show-icon
          class="mb-12px"
        />
        <ElDescriptions :column="2" border size="small" class="mb-12px">
          <ElDescriptionsItem label="设备">{{ selfCheckResult.deviceName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="类型">{{ selfCheckResult.deviceType }}</ElDescriptionsItem>
          <ElDescriptionsItem label="综合状态">
            <ElTag :type="selfCheckOverallTag.type" size="small">
              {{ selfCheckOverallTag.label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="检测时间">{{ selfCheckResult.checkedAt }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElTable
          v-if="selfCheckResult.items.length"
          :data="selfCheckResult.items"
          border
          size="small"
        >
          <ElTableColumn prop="name" label="检测项" min-width="120" />
          <ElTableColumn label="结果" width="88" align="center">
            <template #default="{ row }">
              <ElTag :type="selfCheckItemTag(row.status).type" size="small">
                {{ selfCheckItemTag(row.status).label }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="detail" label="说明" min-width="180" show-overflow-tooltip />
        </ElTable>
      </template>
      <template #footer>
        <BaseButton @click="selfCheckVisible = false">关闭</BaseButton>
      </template>
    </ElDialog>
  </ContentDetailWrap>
</template>

<style scoped lang="less">
.device-detail-grid {
  display: grid;
  grid-template-columns: 280px minmax(260px, 1fr) minmax(340px, 1.25fr);
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 1200px) {
  .device-detail-grid {
    grid-template-columns: 1fr;
  }
}

.device-detail-panel {
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.device-detail-panel__title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.device-detail-image-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  margin-bottom: 8px;
}

.device-detail-image-head .device-detail-panel__title {
  margin-bottom: 0;
}

.device-detail-image-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.device-detail-image-input {
  display: none;
}

.device-detail-panel__hint {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.device-detail-panel--wide {
  min-width: 0;
}

.device-detail-image {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  width: 100%;
  min-height: 210px;
  overflow: hidden;
  background: linear-gradient(145deg, #f7fafc, #edf3f7);
  border: 1px solid #dce6ed;
  border-radius: 10px;
}

.device-detail-image__img {
  width: 100%;
  height: 100%;
}

.device-radar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #708696;
}

.device-radar-placeholder__scope {
  position: relative;
  width: 138px;
  height: 138px;
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid #9db4c2;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(66, 124, 151, 0.09), rgba(66, 124, 151, 0.015));
  box-shadow:
    inset 0 0 28px rgba(42, 96, 122, 0.08),
    0 8px 24px rgba(56, 89, 105, 0.08);
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
  border: 1px solid rgba(78, 126, 148, 0.3);
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
  background: rgba(78, 126, 148, 0.2);
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
  background: conic-gradient(from 10deg, rgba(45, 129, 164, 0.3), transparent 28%);
  animation: radar-sweep 4s linear infinite;
}

.device-radar-placeholder__target {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #5c94aa;
  box-shadow: 0 0 0 4px rgba(92, 148, 170, 0.15);
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
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #526b79;
}

.device-radar-placeholder > span {
  margin-top: 3px;
  font-size: 9px;
  letter-spacing: 0.22em;
  color: #9aabb5;
}

.device-detail-image__hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@keyframes radar-sweep {
  to {
    transform: rotate(360deg);
  }
}

.device-detail-form {
  :deep(.el-form-item__label) {
    padding-bottom: 4px;
    line-height: 1.4;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
}

.device-detail-form__sub {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.device-detail-metrics-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }
}

.device-detail-metrics-tip {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.device-detail-extended-form {
  padding: 16px 18px 2px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.device-detail-extended-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 42px;
  row-gap: 2px;
}

.device-detail-extended-form :deep(.el-form-item) {
  margin-bottom: 15px;
}

.device-detail-extended-form :deep(.el-form-item__label) {
  padding-bottom: 5px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}

.device-detail-metrics-empty {
  margin: 24px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.device-detail-ind-toolbar {
  display: flex;
  gap: 8px;
}

.device-detail-req {
  margin-right: 2px;
  color: var(--el-color-danger);
}

.device-detail-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.device-detail-header__left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 900px) {
  .device-detail-extended-grid {
    grid-template-columns: 1fr;
    column-gap: 0;
  }
}
</style>
