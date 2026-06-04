<script setup lang="ts">
import { getDeviceArchiveDetailApi, saveDeviceArchiveApi } from '@/api/lad/device'
import type {
  DeviceArchiveCategory,
  DeviceArchiveDetail,
  DeviceArchiveIndicator
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
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
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
const enabledState = ref(true)
const recordCategory = ref<Exclude<DeviceArchiveCategory, 'all'>>('eo')

const isCreateMode = computed(() => route.name === 'LadDeviceArchiveAdd')
const isViewMode = computed(() => route.name === 'LadDeviceArchiveDetail')
const isEditable = computed(() => !isViewMode.value)

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
  form.vendor = '同方威视'
  form.deviceModel = ''
  form.remark = ''
  enabledState.value = true
  recordCategory.value = 'radar'
  imageUrl.value = DEVICE_ARCHIVE_PLACEHOLDER
  indicatorRows.value = [
    { id: nextIndicatorId(), item: '设备重量', unit: 'kg', value: '55' },
    { id: nextIndicatorId(), item: '额定电压', unit: 'V', value: '220' }
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
    if (!row.item.trim() || !row.value.trim()) {
      return '指标项与值不能为空'
    }
  }
  return null
}

function addIndicatorRow() {
  indicatorRows.value.push({ id: nextIndicatorId(), item: '', unit: '', value: '' })
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
            v-if="imageUrl"
            :src="imageUrl"
            fit="contain"
            class="archive-detail-image__img"
          />
          <span v-else class="archive-detail-image__placeholder">暂无档案图像</span>
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
            <template #default="{ row }">
              <ElInput v-if="isEditable" v-model="row.unit" placeholder="可选" size="small" />
              <span v-else>{{ row.unit }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="值" min-width="100">
            <template #header>
              <span><span class="archive-detail-req">*</span>值</span>
            </template>
            <template #default="{ row }">
              <ElInput v-if="isEditable" v-model="row.value" placeholder="请输入" size="small" />
              <span v-else>{{ row.value }}</span>
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
  </ContentDetailWrap>
</template>

<style scoped lang="less">
.archive-detail-grid {
  display: grid;
  grid-template-columns: 280px minmax(260px, 1fr) minmax(340px, 1.25fr);
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
  min-width: 0;
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

.archive-detail-image__placeholder {
  color: var(--el-text-color-secondary);
  font-size: 13px;
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
</style>
