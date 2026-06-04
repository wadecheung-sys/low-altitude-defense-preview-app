<script setup lang="ts">
import {
  deleteAreaRegionApi,
  getAreaRegionDetailApi,
  getAreaRegionListApi,
  saveAreaRegionApi
} from '@/api/lad/area'
import { cloneShapes } from '@/api/lad/area/areaStore'
import type { AreaRegion, AreaRegionType, AreaShape, AreaShapeType } from '@/api/lad/area/types'
import { buildAreaPaintItems, type RegionShapeRef } from './areaShapeGeometry'
import AreaGisMap from './components/AreaGisMap.vue'
import { BaseButton } from '@/components/Button'
import { ContentDetailWrap } from '@/components/ContentDetailWrap'
import {
  AREA_REGION_TYPE_OPTIONS,
  CLIP_PRIORITY_MAX,
  CLIP_PRIORITY_MIN,
  defaultAlarmForType,
  defaultClipPriorityForType,
  defaultColorForType
} from './areaConstants'
import {
  ElColorPicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch
} from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@/components/Icon'

defineOptions({ name: 'LadAreaEdit' })

const route = useRoute()
const { push, go } = useRouter()

const loading = ref(false)
const saveLoading = ref(false)
const allRegions = ref<AreaRegion[]>([])
const recordId = ref('')
const drawTool = ref<AreaShapeType | null>(null)
const gisMapRef = ref<InstanceType<typeof AreaGisMap>>()

const isCreateMode = computed(() => route.name === 'LadAreaAdd')
const pageTitle = computed(() => (isCreateMode.value ? '新增区域' : '编辑区域'))

const form = ref({
  name: '',
  regionType: 'warning' as AreaRegionType,
  clipPriority: 40,
  alarmEnabled: true,
  color: defaultColorForType('warning'),
  shapes: [] as AreaShape[]
})

const paintRegionRefs = computed<RegionShapeRef[]>(() => {
  const refs: RegionShapeRef[] = allRegions.value
    .filter((r) => r.id !== recordId.value)
    .map((r) => ({
      regionId: r.id,
      regionType: r.regionType,
      clipPriority: r.clipPriority,
      color: r.color,
      shapes: r.shapes
    }))

  const draftId = recordId.value || '__draft__'
  if (form.value.shapes.length || isCreateMode.value) {
    refs.push({
      regionId: draftId,
      regionType: form.value.regionType,
      clipPriority: form.value.clipPriority,
      color: form.value.color,
      shapes: form.value.shapes
    })
  }
  return refs
})

const canvasPaintItems = computed(() =>
  buildAreaPaintItems(paintRegionRefs.value, {
    highlightRegionId: recordId.value || '__draft__'
  })
)

async function loadAllRegions() {
  const res = await getAreaRegionListApi({ pageIndex: 1, pageSize: 500 })
  allRegions.value = res.data.list
}

function resetFormForNew(type: AreaRegionType = 'warning') {
  recordId.value = ''
  form.value = {
    name: '',
    regionType: type,
    clipPriority: defaultClipPriorityForType(type),
    alarmEnabled: defaultAlarmForType(type),
    color: defaultColorForType(type),
    shapes: []
  }
}

function applyDetail(data: AreaRegion) {
  recordId.value = data.id
  form.value = {
    name: data.name,
    regionType: data.regionType,
    clipPriority: data.clipPriority,
    alarmEnabled: data.alarmEnabled,
    color: data.color,
    shapes: cloneShapes(data.shapes)
  }
}

async function loadPage() {
  drawTool.value = null
  loading.value = true
  try {
    await loadAllRegions()
    if (isCreateMode.value) {
      resetFormForNew('warning')
      return
    }
    const id = route.params.id as string
    const res = await getAreaRegionDetailApi(id)
    applyDetail(res.data)
  } catch {
    ElMessage.error('区域不存在或已删除')
    push('/lad/area/list')
  } finally {
    loading.value = false
  }
}

function onRegionTypeChange(type: AreaRegionType) {
  if (isCreateMode.value) {
    form.value.clipPriority = defaultClipPriorityForType(type)
    form.value.alarmEnabled = defaultAlarmForType(type)
    form.value.color = defaultColorForType(type)
  }
}

function setTool(tool: AreaShapeType) {
  drawTool.value = drawTool.value === tool ? null : tool
}

function finishPolygonDraw() {
  gisMapRef.value?.finishPolygon()
  drawTool.value = null
}

function onShapesUpdate(shapes: AreaShape[]) {
  form.value.shapes = shapes
}

function clearShapes() {
  form.value.shapes = []
}

function goList() {
  push('/lad/area/list')
}

async function saveRegion() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入区域名称')
    return
  }
  if (!form.value.shapes.length) {
    ElMessage.warning('请至少绘制一个范围图形')
    return
  }
  saveLoading.value = true
  try {
    const res = await saveAreaRegionApi({
      id: recordId.value || undefined,
      name: form.value.name.trim(),
      regionType: form.value.regionType,
      clipPriority: form.value.clipPriority,
      alarmEnabled: form.value.alarmEnabled,
      color: form.value.color,
      shapes: cloneShapes(form.value.shapes)
    })
    ElMessage.success(isCreateMode.value ? '新增成功' : '保存成功')
    if (isCreateMode.value) {
      await push(`/lad/area/edit/${res.data.id}`)
    } else {
      applyDetail(res.data)
      await loadAllRegions()
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saveLoading.value = false
  }
}

async function removeCurrent() {
  if (!recordId.value) {
    goList()
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除区域「${form.value.name}」吗？`, '删除确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteAreaRegionApi(recordId.value)
  ElMessage.success('已删除')
  goList()
}

onMounted(loadPage)

watch(
  () => `${String(route.name)}|${route.params.id}`,
  () => {
    loadPage()
  }
)
</script>

<template>
  <ContentDetailWrap v-loading="loading" :title="pageTitle">
    <template #header>
      <BaseButton type="primary" :loading="saveLoading" @click="saveRegion">保存</BaseButton>
      <BaseButton v-if="!isCreateMode" type="danger" @click="removeCurrent">删除</BaseButton>
      <BaseButton @click="go(-1)">返回</BaseButton>
    </template>

    <div class="area-edit-layout">
      <aside class="area-edit-sidebar">
        <div class="area-edit-panel__title">区域配置</div>
        <p class="area-edit-tip">配置名称、类型、优先级与颜色，并在右侧地图绘制范围。</p>
        <ElForm label-position="top" class="area-edit-form">
          <ElFormItem label="区域名称" required>
            <ElInput v-model="form.name" placeholder="请输入区域名称" clearable />
          </ElFormItem>
          <ElFormItem label="区域类型" required>
            <ElSelect
              v-model="form.regionType"
              class="w-100%"
              filterable
              @change="onRegionTypeChange(form.regionType)"
            >
              <ElOption
                v-for="o in AREA_REGION_TYPE_OPTIONS"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="区域优先级" required>
            <ElInputNumber
              v-model="form.clipPriority"
              :min="CLIP_PRIORITY_MIN"
              :max="CLIP_PRIORITY_MAX"
              class="w-100%"
            />
            <p class="area-field-tip">
              数值越大越优先保留；重叠时低优先级区域会被镂空扣除。
            </p>
          </ElFormItem>
          <ElFormItem label="区域颜色">
            <ElColorPicker v-model="form.color" show-alpha color-format="rgb" />
          </ElFormItem>
          <ElFormItem label="参与告警">
            <ElSwitch v-model="form.alarmEnabled" active-text="是" inactive-text="否" />
          </ElFormItem>
          <ElFormItem label="范围绘制">
            <div class="area-draw-toolbar" role="toolbar" aria-label="范围绘制工具">
              <button
                type="button"
                class="area-draw-tool"
                :class="{ 'is-active': drawTool === 'rect' }"
                @click="setTool('rect')"
              >
                <Icon icon="vi-ep:crop" :size="20" class="area-draw-tool__icon" />
                <span class="area-draw-tool__label">矩形</span>
              </button>
              <button
                type="button"
                class="area-draw-tool"
                :class="{ 'is-active': drawTool === 'circle' }"
                @click="setTool('circle')"
              >
                <Icon icon="vi-ant-design:aim-outlined" :size="20" class="area-draw-tool__icon" />
                <span class="area-draw-tool__label">圆形</span>
              </button>
              <button
                type="button"
                class="area-draw-tool"
                :class="{ 'is-active': drawTool === 'polygon' }"
                @click="setTool('polygon')"
              >
                <Icon icon="vi-ep:edit-pen" :size="20" class="area-draw-tool__icon" />
                <span class="area-draw-tool__label">多边形</span>
              </button>
            </div>
          </ElFormItem>
          <div v-if="drawTool === 'polygon'" class="area-polygon-actions mb-12px">
            <BaseButton type="primary" size="small" @click="finishPolygonDraw">完成绘制</BaseButton>
            <BaseButton size="small" @click="gisMapRef?.cancelPolygon()">取消</BaseButton>
          </div>
          <div class="area-edit-actions">
            <BaseButton @click="clearShapes">清空图形</BaseButton>
          </div>
        </ElForm>
      </aside>

      <section class="area-edit-map-pane">
        <div class="area-edit-map-head">
          <span class="area-edit-panel__title">范围绘制</span>
          <span class="area-edit-map-desc">灰色区域为其他已保存范围，当前编辑范围高亮显示</span>
        </div>
        <AreaGisMap
          ref="gisMapRef"
          :paint-items="canvasPaintItems"
          :shapes="form.shapes"
          :active-color="form.color"
          :tool="drawTool"
          @update:shapes="onShapesUpdate"
        />
      </section>
    </div>
  </ContentDetailWrap>
</template>

<style scoped lang="less">
.area-edit-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: calc(100vh - 220px);
}

.area-edit-sidebar {
  flex: 0 0 320px;
  width: 320px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.area-edit-map-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.area-edit-panel__title {
  font-size: 14px;
  font-weight: 600;
}

.area-edit-tip {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.area-edit-map-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.area-edit-map-desc {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.area-edit-map-pane :deep(.area-gis-map) {
  flex: 1;
  width: 100%;
  min-height: 520px;
}

.area-field-tip {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.area-draw-toolbar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
}

.area-draw-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 64px;
  padding: 10px 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
  }
}

.area-draw-tool__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.area-draw-tool__label {
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
}

.area-polygon-actions {
  display: flex;
  gap: 8px;
}

.area-edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.area-edit-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

@media (max-width: 1100px) {
  .area-edit-layout {
    flex-direction: column;
  }

  .area-edit-sidebar {
    flex: none;
    width: 100%;
  }
}
</style>
