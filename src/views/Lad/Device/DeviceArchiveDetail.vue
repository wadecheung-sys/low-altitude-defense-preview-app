<script setup lang="ts">
import { getDeviceArchiveDetailApi, saveDeviceArchiveApi } from '@/api/lad/device'
import type {
  DeviceArchiveCategory,
  DeviceArchiveDetail,
  DeviceArchiveIndicator,
  DeviceArchiveConfigurableItem
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
  ElImage,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag
} from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'LadDeviceArchiveDetail' })

/** 可配置项区块：前端暂不展示，数据仍从接口加载并保留相关逻辑供后续启用 */
const showConfigurableItems = false

const route = useRoute()
const { push, go } = useRouter()

const loading = ref(false)
const saveLoading = ref(false)
const detail = ref<DeviceArchiveDetail | null>(null)
const formRef = ref<FormInstance>()
const imageUrl = ref<string | null>(DEVICE_ARCHIVE_PLACEHOLDER)
const specificationRows = ref<DeviceArchiveIndicator[]>([])
const configurableItemRows = ref<DeviceArchiveConfigurableItem[]>([])
const selectedIndicatorIds = ref<string[]>([])
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
  specificationRows.value = []
  configurableItemRows.value = []
  selectedIndicatorIds.value = []
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
  specificationRows.value = data.specifications.map((i) => ({ ...i }))
  configurableItemRows.value = data.configurableItems.map((i) => ({ ...i })) // 可配置项：暂不展示，仍同步接口数据
  selectedIndicatorIds.value = []
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

function validateSpecifications(): string | null {
  if (!specificationRows.value.length) {
    return '请至少填写一条档案信息'
  }
  for (const row of specificationRows.value) {
    if (!row.item.trim()) {
      return '指标项不能为空'
    }
    if (!row.value.trim()) {
      return '指标值不能为空'
    }
  }
  return null
}

function addSpecificationRow() {
  specificationRows.value.push({
    id: nextIndicatorId(),
    item: '',
    unit: '',
    value: ''
  })
}

function onIndicatorSelectionChange(rows: DeviceArchiveIndicator[]) {
  selectedIndicatorIds.value = rows.map((row) => row.id)
}

async function batchRemoveIndicators() {
  if (!selectedIndicatorIds.value.length) {
    ElMessage.warning('请先勾选需要删除的指标')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedIndicatorIds.value.length} 条指标吗？`,
      '批量删除',
      { type: 'warning' }
    )
  } catch {
    return
  }
  const removeSet = new Set(selectedIndicatorIds.value)
  specificationRows.value = specificationRows.value.filter((row) => !removeSet.has(row.id))
  selectedIndicatorIds.value = []
}

function removeSpecificationRow(row: DeviceArchiveIndicator) {
  specificationRows.value = specificationRows.value.filter((r) => r.id !== row.id)
  selectedIndicatorIds.value = selectedIndicatorIds.value.filter((id) => id !== row.id)
}

function configScopeLabel(scope: DeviceArchiveConfigurableItem['scope']) {
  // 可配置项作用域文案（区块隐藏时保留）
  return scope === 'runtime' ? '运行时（大屏）' : '设备级'
}

function configScopeTagType(scope: DeviceArchiveConfigurableItem['scope']) {
  // 可配置项作用域标签类型（区块隐藏时保留）
  return scope === 'runtime' ? 'warning' : 'primary'
}

async function save() {
  if (!isEditable.value) return
  const indErr = validateSpecifications()
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
      specifications: specificationRows.value.map((r) => ({
        id: r.id,
        item: r.item.trim(),
        unit: r.unit.trim(),
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
        <div class="archive-detail-panel__title">档案信息</div>
        <p class="archive-detail-panel__hint">说明书固定参数，不随单台设备变更。</p>
        <div v-if="isEditable" class="archive-detail-ind-toolbar mb-10px">
          <BaseButton type="primary" @click="addSpecificationRow">新增</BaseButton>
          <BaseButton type="danger" class="ml-12px" @click="batchRemoveIndicators">
            批量删除
          </BaseButton>
        </div>
        <ElTable
          :data="specificationRows"
          border
          stripe
          row-key="id"
          max-height="420"
          @selection-change="onIndicatorSelectionChange"
        >
          <ElTableColumn v-if="isEditable" type="selection" width="48" />
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
              <span v-else>{{ row.unit || '—' }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="值" min-width="140">
            <template #header>
              <span><span class="archive-detail-req">*</span>值</span>
            </template>
            <template #default="{ row }">
              <ElInput v-if="isEditable" v-model="row.value" placeholder="请输入" size="small" />
              <span v-else>{{ row.value || '—' }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn v-if="isEditable" label="操作" width="88" fixed="right">
            <template #default="{ row }">
              <BaseButton type="danger" link @click="removeSpecificationRow(row)">删除</BaseButton>
            </template>
          </ElTableColumn>
        </ElTable>

        <!-- 可配置项：前端暂不展示（showConfigurableItems），保留模板与样式供后续启用 -->
        <div v-if="showConfigurableItems" class="archive-detail-config-block">
          <div class="archive-detail-panel__title">可配置项</div>
          <p class="archive-detail-panel__hint">
            设备级项可在设备信息中设定；运行时项（如转台角度）由指挥大屏实际控制。
          </p>
          <ElTable
            v-if="configurableItemRows.length"
            :data="configurableItemRows"
            border
            stripe
            row-key="id"
            max-height="280"
            class="mt-10px"
          >
            <ElTableColumn type="index" label="序号" width="64" />
            <ElTableColumn prop="label" label="配置项" min-width="130" />
            <ElTableColumn prop="unit" label="单位" width="88">
              <template #default="{ row }">{{ row.unit || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn label="作用域" width="120">
              <template #default="{ row }">
                <ElTag :type="configScopeTagType(row.scope)" size="small" effect="light">
                  {{ configScopeLabel(row.scope) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="hint" label="说明" min-width="180" show-overflow-tooltip />
            <ElTableColumn label="建议默认值" min-width="120">
              <template #default="{ row }">
                {{ row.scope === 'device' ? row.defaultValue || '—' : '—' }}
              </template>
            </ElTableColumn>
          </ElTable>
          <p v-else class="archive-detail-config-empty">当前档案暂无可配置项定义。</p>
        </div>
      </section>
    </div>
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

.archive-detail-panel__hint {
  margin: -6px 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 可配置项区块样式（前端暂不展示，保留供后续启用） */
.archive-detail-config-block {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.archive-detail-config-empty {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
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

.archive-detail-ind-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 1200px) {
  .archive-detail-panel--wide {
    min-width: 0;
  }
}
</style>
