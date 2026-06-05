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
import DeviceRemoteControlPanel from '@/views/Lad/shared/DeviceRemoteControlPanel.vue'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import { DEVICE_ARCHIVE_PLACEHOLDER } from './constants'
import { deviceInfoTypeOptions } from './deviceInfoConstants'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ElAlert,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElImage,
  ElInput,
  ElLink,
  ElMessage,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTag
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
const metricsTab = ref<'archive' | 'extend'>('archive')
const extendedRows = ref<DeviceExtendedField[]>([])
const selfCheckLoading = ref(false)
const selfCheckVisible = ref(false)
const selfCheckResult = ref<DeviceSelfCheckResult | null>(null)

const isCreateMode = computed(() => route.name === 'LadDeviceInfoAdd')
const isViewMode = computed(() => route.name === 'LadDeviceDetail')
const isEditable = computed(() => !isViewMode.value)
const recordId = computed(() => (route.params.id as string) || '')

const linkedArchive = computed(() => currentLinkedArchive.value)
const deviceImageUrl = computed(() => linkedArchive.value?.imageUrl || DEVICE_ARCHIVE_PLACEHOLDER)
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
  lastHeartbeat: '',
  deployLocation: '',
  deployAddress: '',
  personInCharge: '',
  contactPhone: '',
  remark: ''
})

const rules: FormRules = {
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  deployLocation: [{ required: true, message: '请输入部署位置', trigger: 'blur' }],
  deployAddress: [{ required: true, message: '请填写详细部署地址', trigger: 'blur' }],
  ipAddress: [{ required: true, message: '请输入 IP 地址', trigger: 'blur' }],
  serialNo: [{ required: true, message: '请输入序列号', trigger: 'blur' }],
  personInCharge: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}

let extendSeq = 0
function nextExtendId() {
  extendSeq += 1
  return `ext-${Date.now()}-${extendSeq}`
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

function applyDetail(data: DeviceInfoDetail) {
  detail.value = data
  currentLinkedArchive.value = data.linkedArchive
  form.deviceId = data.deviceId
  form.ipAddress = data.ipAddress
  form.deviceName = data.deviceName
  form.archiveId = data.archiveId || ''
  form.serialNo = data.serialNo
  form.deviceType = data.deviceType
  form.lastHeartbeat = data.lastHeartbeat
  form.deployLocation = data.deployLocation
  form.deployAddress = data.deployAddress
  form.personInCharge = data.personInCharge
  form.contactPhone = data.contactPhone
  form.remark = data.remark
  extendedRows.value = data.extendedFields.map((field) => ({ ...field }))
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
  form.lastHeartbeat = ''
  form.deployLocation = ''
  form.deployAddress = ''
  form.personInCharge = ''
  form.contactPhone = ''
  form.remark = ''
  extendedRows.value = [
    { id: nextExtendId(), label: '安装方位', value: '' },
    { id: nextExtendId(), label: '现场编号', value: '' }
  ]
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
  archiveLoading.value = true
  try {
    const res = await getDeviceArchiveDetailApi(archiveId)
    currentLinkedArchive.value = mapArchiveDetailToLinkedArchive(res.data)
  } catch {
    currentLinkedArchive.value = null
    ElMessage.warning('关联档案加载失败')
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
    push('/lad/device/info/list')
  } finally {
    loading.value = false
  }
}

function validateExtended(): string | null {
  for (const row of extendedRows.value) {
    if (!row.label.trim() || !row.value.trim()) {
      return '扩展信息的条目名称与内容不能为空'
    }
  }
  return null
}

function addExtendedRow() {
  extendedRows.value.push({ id: nextExtendId(), label: '', value: '' })
}

function removeExtendedRow(row: DeviceExtendedField) {
  extendedRows.value = extendedRows.value.filter((item) => item.id !== row.id)
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
  const extErr = validateExtended()
  if (extErr) {
    ElMessage.warning(extErr)
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
      linkedArchive.value?.archiveName ||
      detail.value?.archiveInfo ||
      form.deployLocation.trim() ||
      form.deviceName.trim()
    const res = await saveDeviceInfoApi({
      id: isCreateMode.value ? undefined : recordId.value,
      deviceId: form.deviceId || undefined,
      deviceName: form.deviceName.trim(),
      archiveInfo,
      archiveId: form.archiveId || undefined,
      deviceType: form.deviceType,
      deployLocation: form.deployLocation.trim(),
      deployAddress: form.deployAddress.trim(),
      ipAddress: form.ipAddress.trim(),
      serialNo: form.serialNo.trim(),
      personInCharge: form.personInCharge.trim(),
      contactPhone: form.contactPhone.trim(),
      remark: form.remark,
      extendedFields: extendedRows.value.map((row) => ({
        id: row.id,
        label: row.label.trim(),
        value: row.value.trim()
      }))
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
    metricsTab.value = 'archive'
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
        <div class="device-detail-panel__title">设备图像</div>
        <div class="device-detail-image">
          <ElImage :src="deviceImageUrl" fit="contain" class="device-detail-image__img" />
        </div>
        <p v-if="linkedArchive" class="device-detail-image__hint">
          取自关联档案“{{ linkedArchive.archiveName }}”
        </p>
        <p v-else class="device-detail-image__hint">关联档案后可展示档案图像</p>
      </section>

      <section class="device-detail-panel">
        <div class="device-detail-panel__title">基本信息</div>
        <p class="device-detail-panel__hint">
          设备台账核心字段（含 IP、序列号等），与扩展信息区分。
        </p>
        <ElForm
          ref="formRef"
          label-position="top"
          :model="form"
          :rules="rules"
          class="device-detail-form"
          :disabled="!isEditable"
        >
          <ElFormItem label="设备 ID">
            <ElInput
              v-model="form.deviceId"
              :placeholder="isCreateMode ? '保存后自动生成' : ''"
              disabled
            />
          </ElFormItem>
          <ElFormItem label="设备名称" prop="deviceName" required>
            <ElInput v-model="form.deviceName" placeholder="请输入设备名称" clearable />
          </ElFormItem>
          <ElFormItem label="IP 地址" prop="ipAddress" required>
            <ElInput v-model="form.ipAddress" placeholder="请输入 IP 地址" clearable />
          </ElFormItem>
          <ElFormItem label="序列号" prop="serialNo" required>
            <ElInput v-model="form.serialNo" placeholder="请输入序列号" clearable />
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
          <ElFormItem label="关联档案">
            <ElSelect
              v-if="isEditable"
              v-model="form.archiveId"
              class="w-100%"
              clearable
              filterable
              :loading="archiveLoading"
              placeholder="请选择设备档案"
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
          <ElFormItem v-if="!isCreateMode" label="最后心跳">
            <ElInput v-model="form.lastHeartbeat" disabled />
          </ElFormItem>
          <ElFormItem label="部署位置" prop="deployLocation" required>
            <ElInput v-model="form.deployLocation" placeholder="如：楼顶 A 区" clearable />
          </ElFormItem>
          <ElFormItem label="详细地址" prop="deployAddress" required>
            <ElInput
              v-model="form.deployAddress"
              type="textarea"
              :rows="2"
              placeholder="楼栋、楼层、方位等"
            />
          </ElFormItem>
          <ElFormItem label="负责人" prop="personInCharge" required>
            <ElInput v-model="form.personInCharge" placeholder="请输入负责人" clearable />
          </ElFormItem>
          <ElFormItem label="联系方式">
            <ElInput v-model="form.contactPhone" placeholder="请输入联系电话" clearable />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
          </ElFormItem>
        </ElForm>
      </section>

      <section class="device-detail-panel device-detail-panel--wide">
        <ElTabs v-model="metricsTab" class="device-detail-metrics-tabs">
          <ElTabPane label="档案指标" name="archive">
            <p v-if="!linkedArchive" class="device-detail-metrics-empty">
              未关联设备档案，暂无档案指标。请在台账中绑定档案后查看。
            </p>
            <template v-else>
              <p class="device-detail-metrics-tip">
                以下指标来自关联档案“{{
                  linkedArchive.archiveName
                }}”，随档案维护更新，本页不直接编辑。
              </p>
              <ElTable :data="linkedArchive.indicators" border stripe row-key="id" max-height="360">
                <ElTableColumn type="index" label="序号" width="64" />
                <ElTableColumn prop="item" label="指标项" min-width="130" />
                <ElTableColumn prop="unit" label="单位" width="100" />
                <ElTableColumn prop="value" label="值" min-width="120" />
              </ElTable>
            </template>
          </ElTabPane>
          <ElTabPane label="扩展信息" name="extend">
            <p class="device-detail-metrics-tip">
              本设备特有补充信息（不含 IP、序列号等基本信息字段），可单独维护。
            </p>
            <div v-if="isEditable" class="device-detail-ind-toolbar mb-10px">
              <BaseButton type="primary" @click="addExtendedRow">新增信息项</BaseButton>
            </div>
            <ElTable :data="extendedRows" border stripe row-key="id" max-height="360">
              <ElTableColumn type="index" label="序号" width="64" />
              <ElTableColumn label="信息项" min-width="140">
                <template #header>
                  <span><span class="device-detail-req">*</span>信息项</span>
                </template>
                <template #default="{ row }">
                  <ElInput
                    v-if="isEditable"
                    v-model="row.label"
                    placeholder="如：安装方位"
                    size="small"
                  />
                  <span v-else>{{ row.label }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="内容" min-width="180">
                <template #header>
                  <span><span class="device-detail-req">*</span>内容</span>
                </template>
                <template #default="{ row }">
                  <ElInput
                    v-if="isEditable"
                    v-model="row.value"
                    placeholder="请输入内容"
                    size="small"
                  />
                  <span v-else>{{ row.value }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn v-if="isEditable" label="操作" width="88" fixed="right">
                <template #default="{ row }">
                  <BaseButton type="danger" link @click="removeExtendedRow(row)">删除</BaseButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElTabPane>
        </ElTabs>
      </section>

      <section v-if="isViewMode" class="device-detail-panel device-detail-panel--remote">
        <div class="device-detail-panel__title">远程操控</div>
        <DeviceRemoteControlPanel
          :device-name="form.deviceName"
          :device-type="form.deviceType"
          :device-code="form.serialNo"
          :online="!!form.lastHeartbeat"
        />
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

.device-detail-panel__hint {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.device-detail-panel--wide {
  min-width: 0;
}

.device-detail-panel--remote {
  grid-column: 1 / -1;
}

.device-detail-image {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  height: min(32vh, 300px);
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
}

.device-detail-image__img {
  width: 100%;
  max-height: 100%;
}

.device-detail-image__hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  text-align: center;
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
</style>
