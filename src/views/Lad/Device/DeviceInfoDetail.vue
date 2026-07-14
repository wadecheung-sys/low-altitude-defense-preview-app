<script setup lang="ts">
import { getDeviceArchiveDetailApi, getDeviceArchiveListApi } from '@/api/lad/device'
import type { DeviceArchiveItem } from '@/api/lad/device'
import { getAreaRegionListApi } from '@/api/lad/area'
import type { AreaRegion } from '@/api/lad/area'
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
import type { DeviceArchiveConfigurableItem } from '@/api/lad/device/types'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import DeviceInfoGisMap from './components/DeviceInfoGisMap.vue'
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
  ElDivider,
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
const areaOptions = ref<AreaRegion[]>([])
const formRef = ref<FormInstance>()
const metricsTab = ref<'extend' | 'map' | 'archive'>('extend')
const extendedRows = ref<DeviceExtendedField[]>([])
const deviceImageUrl = ref('')
const imageInputRef = ref<HTMLInputElement>()
const selfCheckLoading = ref(false)
const selfCheckVisible = ref(false)
const selfCheckResult = ref<DeviceSelfCheckResult | null>(null)
const mapPlacing = ref(false)

const isCreateMode = computed(() => route.name === 'LadDeviceInfoAdd')
const isMonitorDetailMode = computed(() => route.name === 'LadDeviceMonitorDetail')
const isViewMode = computed(() => route.name === 'LadDeviceDetail' || isMonitorDetailMode.value)
const isEditable = computed(() => !isViewMode.value)
const recordId = computed(() => (route.params.id as string) || '')
const detailFallbackPath = computed(() =>
  isMonitorDetailMode.value ? '/lad/device/monitor' : '/lad/device/info/list'
)

const deviceConfigValues = ref<Record<string, string>>({})

const linkedArchive = computed(() => currentLinkedArchive.value)
const deviceScopeConfigItems = computed(() =>
  (linkedArchive.value?.configurableItems || []).filter((item) => item.scope === 'device')
)
const archiveSelectOptions = computed(() => {
  const selectedArchiveId = form.archiveId
  return archiveOptions.value.filter((item) => item.enabled || item.id === selectedArchiveId)
})

const selectedDeployArea = computed(() =>
  areaOptions.value.find((item) => item.id === form.deployAreaId)
)

const selectedDeployAreaName = computed(
  () => selectedDeployArea.value?.name || detail.value?.deployLocation || '—'
)

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
  deployAreaId: '',
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
  deviceType: [{ required: true, message: '请先选择基础档案以确定设备类型', trigger: 'change' }],
  deployAreaId: [{ required: true, message: '请选择部署区域', trigger: 'change' }]
}

let extendSeq = 0
function nextExtendId() {
  extendSeq += 1
  return `ext-${Date.now()}-${extendSeq}`
}

const acquisitionMethodOptions = ['采购', '赠予', '置换', '赔偿', '其他']

const fixedExtendedLabels = [
  '设备IP',
  '增加方式',
  '生产日期',
  '出厂日期',
  '启用日期',
  '使用年限（月）',
  '保管机构',
  '保管人',
  '保管人电话',
  '供应商',
  '供应商联系人',
  '供应商联系人电话',
  '软件版本'
]

function createFixedExtendedRows() {
  return fixedExtendedLabels.map((label) => ({ id: nextExtendId(), label, value: '' }))
}

const placement = reactive({
  longitude: 116.397128,
  latitude: 39.916527,
  mapX: 50,
  mapY: 50,
  controlRangeM: 500
})

const MAP_BASE_LONGITUDE = 116.397128
const MAP_BASE_LATITUDE = 39.916527
const MAP_LONGITUDE_SCALE = 0.0022
const MAP_LATITUDE_SCALE = 0.0018

function isExtendedDateField(label: string) {
  return ['生产日期', '出厂日期', '启用日期'].includes(label)
}

function isExtendedNumberField(label: string) {
  return label === '使用年限（月）'
}

function syncCoordinateFromMap() {
  placement.longitude =
    Math.round((MAP_BASE_LONGITUDE + (placement.mapX - 50) * MAP_LONGITUDE_SCALE) * 1000000) /
    1000000
  placement.latitude =
    Math.round((MAP_BASE_LATITUDE + (50 - placement.mapY) * MAP_LATITUDE_SCALE) * 1000000) / 1000000
}

function toggleMapPlacing() {
  if (!isEditable.value) return
  mapPlacing.value = !mapPlacing.value
}

function onDeployAreaChange() {
  void formRef.value?.validateField('deployAreaId')
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
    specifications: data.specifications.map((item) => ({ ...item })),
    configurableItems: data.configurableItems.map((item) => ({ ...item }))
  } satisfies DeviceLinkedArchive
}

function syncDeviceConfigDefaults(items: DeviceArchiveConfigurableItem[], preserve = true) {
  const next: Record<string, string> = preserve ? { ...deviceConfigValues.value } : {}
  items
    .filter((item) => item.scope === 'device')
    .forEach((item) => {
      if (next[item.key] === undefined) {
        next[item.key] = item.defaultValue || ''
      }
    })
  Object.keys(next).forEach((key) => {
    if (!items.some((item) => item.scope === 'device' && item.key === key)) {
      delete next[key]
    }
  })
  deviceConfigValues.value = next
}

function resolveDeployAreaId(deployLocation: string) {
  if (!deployLocation.trim()) return ''
  const match = areaOptions.value.find((item) => item.name === deployLocation.trim())
  return match?.id || ''
}

function applyDetail(data: DeviceInfoDetail) {
  detail.value = data
  currentLinkedArchive.value = data.linkedArchive
  deviceConfigValues.value = { ...(data.deviceConfigValues || {}) }
  form.deviceId = data.deviceId
  form.ipAddress = data.ipAddress
  form.deviceName = data.deviceName
  form.archiveId = data.archiveId || ''
  form.deployAreaId = resolveDeployAreaId(data.deployLocation)
  form.serialNo = data.serialNo
  form.deviceType = data.deviceType
  form.deployLocation = data.deployLocation
  form.deployAddress = data.deployAddress
  form.personInCharge = data.personInCharge
  form.contactPhone = data.contactPhone
  form.remark = data.remark
  deviceImageUrl.value = data.imageUrl || ''
  const fields = data.extendedFields
    .filter((field) => field.label.trim() !== '部署区域')
    .map((field) => ({ ...field }))
  const appendLegacyField = (label: string, value: string) => {
    if (!fields.some((field) => field.label === label)) {
      fields.push({ id: nextExtendId(), label, value })
    }
  }
  const legacyValues: Record<string, string> = {
    设备IP: data.ipAddress,
    保管人: data.personInCharge,
    保管人电话: data.contactPhone
  }
  fixedExtendedLabels.forEach((label) => appendLegacyField(label, legacyValues[label] || ''))
  extendedRows.value = fields
  placement.longitude = data.longitude
  placement.latitude = data.latitude
  placement.mapX = data.mapX
  placement.mapY = data.mapY
  placement.controlRangeM = data.controlRangeM
  if (data.linkedArchive) {
    syncDeviceConfigDefaults(data.linkedArchive.configurableItems)
  }
}

function resetCreate() {
  detail.value = null
  currentLinkedArchive.value = null
  deviceConfigValues.value = {}
  form.deviceId = ''
  form.ipAddress = ''
  form.deviceName = ''
  form.archiveId = ''
  form.deployAreaId = ''
  form.serialNo = ''
  form.deviceType = ''
  form.deployLocation = ''
  form.deployAddress = ''
  form.personInCharge = ''
  form.contactPhone = ''
  form.remark = ''
  deviceImageUrl.value = ''
  extendedRows.value = createFixedExtendedRows()
  placement.longitude = MAP_BASE_LONGITUDE
  placement.latitude = MAP_BASE_LATITUDE
  placement.mapX = 50
  placement.mapY = 50
  placement.controlRangeM = 500
  mapPlacing.value = false
}

async function loadAreaOptions() {
  const res = await getAreaRegionListApi({ pageIndex: 1, pageSize: 200 })
  areaOptions.value = res.data.list
}

async function loadArchiveOptions() {
  const res = await getDeviceArchiveListApi({ pageIndex: 1, pageSize: 200 })
  archiveOptions.value = res.data.list
}

async function syncLinkedArchive(archiveId?: string) {
  if (!archiveId) {
    currentLinkedArchive.value = null
    form.deviceType = ''
    deviceConfigValues.value = {}
    return
  }
  archiveLoading.value = true
  try {
    const res = await getDeviceArchiveDetailApi(archiveId)
    currentLinkedArchive.value = mapArchiveDetailToLinkedArchive(res.data)
    form.deviceType = res.data.deviceType
    syncDeviceConfigDefaults(res.data.configurableItems)
  } catch {
    currentLinkedArchive.value = null
    form.deviceType = ''
    deviceConfigValues.value = {}
    ElMessage.warning('基础档案加载失败')
  } finally {
    archiveLoading.value = false
  }
}

async function fetchDetail() {
  await Promise.all([loadArchiveOptions(), loadAreaOptions()])
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
  try {
    await formRef.value?.validate()
  } catch {
    if (!form.deployAreaId) metricsTab.value = 'map'
    return
  }
  saveLoading.value = true
  try {
    const archiveInfo =
      linkedArchive.value?.archiveName || detail.value?.archiveInfo || form.deviceName.trim()
    const deployLocation = selectedDeployAreaName.value === '—' ? '' : selectedDeployAreaName.value
    const res = await saveDeviceInfoApi({
      id: isCreateMode.value ? undefined : recordId.value,
      deviceId: form.deviceId || undefined,
      deviceName: form.deviceName.trim(),
      archiveInfo,
      archiveId: form.archiveId || undefined,
      deviceType: form.deviceType,
      deployLocation,
      deployAddress: deployLocation,
      ipAddress: extendedValue('设备IP') || form.ipAddress,
      serialNo: form.serialNo,
      personInCharge: extendedValue('保管人'),
      contactPhone: extendedValue('保管人电话'),
      longitude: placement.longitude,
      latitude: placement.latitude,
      mapX: placement.mapX,
      mapY: placement.mapY,
      controlRangeM: placement.controlRangeM,
      remark: form.remark,
      imageUrl: deviceImageUrl.value,
      extendedFields: extendedRows.value.map((row) => ({
        id: row.id,
        label: row.label.trim(),
        value: row.value.trim()
      })),
      deviceConfigValues: { ...deviceConfigValues.value }
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
  () => form.deployAreaId,
  (areaId) => {
    const area = areaOptions.value.find((item) => item.id === areaId)
    if (!area) return
    form.deployLocation = area.name
    form.deployAddress = area.name
  }
)

watch(
  () => form.archiveId,
  (archiveId) => {
    syncLinkedArchive(archiveId)
  }
)

watch(
  () => [placement.mapX, placement.mapY],
  () => {
    syncCoordinateFromMap()
  }
)

watch(
  () => `${String(route.name)}|${recordId.value}`,
  () => {
    metricsTab.value = 'extend'
    mapPlacing.value = false
    fetchDetail()
  }
)

watch(metricsTab, (tab) => {
  if (tab !== 'map') mapPlacing.value = false
})
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
                {{ linkedArchive.archiveName }}（{{ linkedArchive.archiveNo }}）
              </ElLink>
            </template>
            <span v-else class="text-[var(--el-text-color-secondary)]">
              {{ detail?.archiveInfo || '未关联' }}
            </span>
          </ElFormItem>
          <ElFormItem label="设备类型" prop="deviceType" required>
            <ElInput v-model="form.deviceType" placeholder="随所选档案自动确定" disabled />
          </ElFormItem>
          <ElFormItem label="厂商" required>
            <ElInput
              :model-value="linkedArchive?.vendor || ''"
              placeholder="随所选档案自动确定"
              disabled
            />
          </ElFormItem>
          <ElFormItem label="设备型号" required>
            <ElInput
              :model-value="linkedArchive?.deviceModel || ''"
              placeholder="随所选档案自动确定"
              disabled
            />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
          </ElFormItem>

          <ElDivider content-position="left">可配置项</ElDivider>
          <div class="device-detail-config-section">
            <p v-if="deviceScopeConfigItems.length" class="device-detail-config-section__hint">
              以下参数可在设备部署时设定；转台方位等运行时参数请在指挥大屏控制。
            </p>
            <div v-if="deviceScopeConfigItems.length" class="device-detail-config-grid">
              <ElFormItem
                v-for="item in deviceScopeConfigItems"
                :key="item.key"
                :label="item.unit ? `${item.label}（${item.unit}）` : item.label"
              >
                <ElInput
                  v-model="deviceConfigValues[item.key]"
                  :disabled="!isEditable"
                  :placeholder="item.hint || '请输入'"
                  clearable
                />
              </ElFormItem>
            </div>
            <p v-else-if="linkedArchive" class="device-detail-archive-empty">
              当前档案无设备级可配置项；运行时参数（如转台角度）由指挥大屏控制。
            </p>
            <p v-else class="device-detail-archive-empty"> 请先选择基础档案，再配置设备级参数。 </p>
          </div>

          <ElFormItem v-show="false" prop="deployAreaId">
            <ElInput v-model="form.deployAreaId" />
          </ElFormItem>
        </ElForm>
      </section>

      <section class="device-detail-panel device-detail-panel--wide">
        <ElTabs v-model="metricsTab" class="device-detail-metrics-tabs">
          <ElTabPane label="扩展信息" name="extend">
            <ElForm label-position="top" class="device-detail-extended-form">
              <div class="device-detail-extended-grid">
                <ElFormItem v-for="row in extendedRows" :key="row.id" :label="row.label">
                  <ElSelect
                    v-if="row.label === '增加方式'"
                    v-model="row.value"
                    :disabled="!isEditable"
                    placeholder="请选择增加方式"
                    clearable
                    class="w-100%"
                  >
                    <ElOption
                      v-for="option in acquisitionMethodOptions"
                      :key="option"
                      :label="option"
                      :value="option"
                    />
                  </ElSelect>
                  <ElDatePicker
                    v-else-if="isExtendedDateField(row.label)"
                    v-model="row.value"
                    type="date"
                    value-format="YYYY-MM-DD"
                    format="YYYY-MM-DD"
                    :disabled="!isEditable"
                    placeholder="请选择日期"
                    class="w-100%"
                  />
                  <ElInputNumber
                    v-else-if="isExtendedNumberField(row.label)"
                    :model-value="row.value ? Number(row.value) : undefined"
                    :disabled="!isEditable"
                    :min="0"
                    :max="9999"
                    controls-position="right"
                    class="w-100%"
                    placeholder="请输入月数"
                    @update:model-value="row.value = $event === undefined ? '' : String($event)"
                  />
                  <ElInput
                    v-else
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
                以下指标来自基础档案「{{
                  linkedArchive.archiveName
                }}」，为说明书固定参数，只读展示。
              </p>
              <ElTable
                :data="linkedArchive.specifications"
                border
                stripe
                row-key="id"
                max-height="360"
              >
                <ElTableColumn type="index" label="序号" width="64" />
                <ElTableColumn prop="item" label="指标项" min-width="130" />
                <ElTableColumn prop="unit" label="单位" width="100">
                  <template #default="{ row }">
                    {{ row.unit || '—' }}
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="value" label="值" min-width="180">
                  <template #default="{ row }">
                    {{ row.value || '—' }}
                  </template>
                </ElTableColumn>
              </ElTable>
            </template>
          </ElTabPane>
          <ElTabPane label="地图" name="map">
            <div class="device-detail-map-panel">
              <div class="device-detail-map-block__head">
                <div>
                  <div class="device-detail-panel__title">地图选点</div>
                  <p class="device-detail-map-block__hint">
                    须先在下拉框中选择设备所属区域，再在地图上标注部署位置。
                  </p>
                </div>
                <BaseButton v-if="isEditable" type="primary" @click="toggleMapPlacing">
                  {{ mapPlacing ? '结束选点' : '地图选点' }}
                </BaseButton>
              </div>

              <div class="device-detail-map-area">
                <ElFormItem label="部署区域" required class="device-detail-map-area__field">
                  <ElSelect
                    v-if="isEditable"
                    v-model="form.deployAreaId"
                    class="w-100%"
                    filterable
                    placeholder="请选择部署区域"
                    @change="onDeployAreaChange"
                  >
                    <ElOption
                      v-for="area in areaOptions"
                      :key="area.id"
                      :label="`${area.name}（${area.siteCode}）`"
                      :value="area.id"
                    />
                  </ElSelect>
                  <span v-else class="device-detail-map-area__readonly">
                    {{ selectedDeployAreaName }}
                  </span>
                </ElFormItem>
              </div>

              <DeviceInfoGisMap
                v-model:mapX="placement.mapX"
                v-model:mapY="placement.mapY"
                :control-range-m="placement.controlRangeM"
                :device-label="form.deviceName || '设备'"
                :readonly="!isEditable"
                :placing="mapPlacing"
              />
            </div>
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
          <ElTableColumn type="index" label="序号" width="65" align="center" />
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

.device-detail-archive-empty {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.device-detail-config-section {
  margin-top: 4px;
}

.device-detail-config-section__hint {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.device-detail-config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

@media (max-width: 760px) {
  .device-detail-config-grid {
    grid-template-columns: 1fr;
  }
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

.device-detail-map-panel {
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.device-detail-map-block__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.device-detail-map-block__hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.device-detail-map-area {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.device-detail-map-area__field {
  margin-bottom: 0;
}

.device-detail-map-area__field :deep(.el-form-item__label) {
  padding-bottom: 6px;
  font-weight: 600;
}

.device-detail-map-area__readonly {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
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

  .device-detail-map-block__head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
