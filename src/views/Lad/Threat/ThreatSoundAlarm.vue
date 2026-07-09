<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  ElColorPicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag,
  ElUpload
} from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { normalizeThreatLevel, THREAT_LEVEL_OPTIONS } from '@/api/lad/threat/threatLevelUtils'
import { LAD_DICT_THREAT_LEVEL, threatLevelTagType } from '../shared/ladDictHelpers'
import { useLadDictOptions } from '../shared/useLadDictOptions'
import { buildThreatLevelFormOptions } from './threatConstants'

defineOptions({ name: 'LadSystemSoundAlarm' })

type VisualAlarmMode = '闪烁' | '常亮'
type AudioDurationMode = '单次' | '循环'

const VISUAL_MODE_OPTIONS: { label: string; value: VisualAlarmMode }[] = [
  { label: '闪烁', value: '闪烁' },
  { label: '常亮', value: '常亮' }
]

const AUDIO_DURATION_OPTIONS: { label: string; value: AudioDurationMode }[] = [
  { label: '单次', value: '单次' },
  { label: '循环', value: '循环' }
]

const DEFAULT_TAG_COLORS: Record<string, string> = {
  高危: '#f56c6c',
  中危: '#e6a23c',
  低危: '#67c23a',
  无危: '#909399'
}

interface SoundAlarmRow {
  id: string
  level: string
  tagColor: string
  audioEnabled: boolean
  uiFlashEnabled: boolean
}

interface GlobalAlarmConfig {
  audioFileName: string
  audioDurationMode: AudioDurationMode
  visualMode: VisualAlarmMode
}

const uploadProps = {
  action: '#',
  autoUpload: false,
  showFileList: false
}

const globalConfig = reactive<GlobalAlarmConfig>({
  audioFileName: '蜂鸣.wav',
  audioDurationMode: '循环',
  visualMode: '闪烁'
})

const alarmRows = ref<SoundAlarmRow[]>([
  {
    id: 'za-low',
    level: '低危',
    tagColor: '#67c23a',
    audioEnabled: false,
    uiFlashEnabled: false
  },
  {
    id: 'za-middle',
    level: '中危',
    tagColor: '#e6a23c',
    audioEnabled: true,
    uiFlashEnabled: true
  },
  {
    id: 'za-high',
    level: '高危',
    tagColor: '#f56c6c',
    audioEnabled: true,
    uiFlashEnabled: true
  },
  {
    id: 'za-none',
    level: '无危',
    tagColor: '#909399',
    audioEnabled: false,
    uiFlashEnabled: false
  }
])

const selectedIds = ref<string[]>([])
const editVisible = ref(false)
const createVisible = ref(false)

const createForm = reactive({
  level: '',
  tagColor: '#409eff',
  audioEnabled: true,
  uiFlashEnabled: true
})

const editForm = reactive({
  id: '',
  level: '',
  tagColor: '#67c23a',
  audioEnabled: false,
  uiFlashEnabled: false
})

const { entries: threatLevelEntries, reload: reloadThreatLevels } = useLadDictOptions(
  LAD_DICT_THREAT_LEVEL,
  true
)

const threatLevelOptions = computed(() => {
  const fromDict = buildThreatLevelFormOptions(threatLevelEntries.value)
  return fromDict.length ? fromDict : THREAT_LEVEL_OPTIONS
})

const configuredLevelSet = computed(
  () => new Set(alarmRows.value.map((item) => normalizeThreatLevel(item.level)))
)

/** 字段管理中存在、且尚未配置告警的威胁等级 */
const availableThreatLevelOptions = computed(() =>
  threatLevelOptions.value.filter(
    (item) => !configuredLevelSet.value.has(normalizeThreatLevel(item.value))
  )
)

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const list = alarmRows.value
    return { list, total: list.length }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

onMounted(() => {
  void reloadThreatLevels()
})

watch(createVisible, (visible) => {
  if (visible) {
    syncCreateFormLevel()
  }
})

function syncCreateFormLevel() {
  const options = availableThreatLevelOptions.value
  const currentValid = options.some((item) => item.value === createForm.level)
  if (!currentValid) {
    createForm.level = options[0]?.value ?? ''
  }
  if (createForm.level) {
    createForm.tagColor = DEFAULT_TAG_COLORS[createForm.level] || createForm.tagColor
  }
}

function switchLabel(enabled: boolean) {
  return enabled ? '开' : '关'
}

function onSelectionChange(rows: SoundAlarmRow[]) {
  selectedIds.value = rows.map((row) => row.id)
}

function hasGlobalAudio() {
  return Boolean(globalConfig.audioFileName.trim())
}

function applyUploadedAudio(file: { name?: string }) {
  const name = file.name?.trim()
  globalConfig.audioFileName = name || '自定义告警音频.wav'
  ElMessage.success(`已选择音频文件：${globalConfig.audioFileName}`)
  return false
}

function clearGlobalAudio() {
  globalConfig.audioFileName = ''
  ElMessage.success('已清除告警音频')
}

function testGlobalAlarm() {
  if (!hasGlobalAudio()) {
    ElMessage.warning('请先上传告警音频')
    return
  }
  ElMessage.info(
    `试鸣：${globalConfig.audioFileName}（持续时间：${globalConfig.audioDurationMode}，告警视觉形式：${globalConfig.visualMode}）`
  )
}

async function openCreate() {
  await reloadThreatLevels()
  createForm.audioEnabled = true
  createForm.uiFlashEnabled = true
  syncCreateFormLevel()
  createVisible.value = true
}

function onCreateLevelChange(level: string) {
  createForm.tagColor = DEFAULT_TAG_COLORS[level] || createForm.tagColor
}

function submitCreate() {
  const level = createForm.level.trim()
  if (!level) {
    ElMessage.warning('请选择尚未配置告警的威胁等级')
    return
  }
  if (
    !availableThreatLevelOptions.value.some(
      (item) => normalizeThreatLevel(item.value) === normalizeThreatLevel(level)
    )
  ) {
    ElMessage.warning('所选威胁等级已配置告警，请重新选择')
    return
  }
  if (
    alarmRows.value.some(
      (item) => normalizeThreatLevel(item.level) === normalizeThreatLevel(level)
    )
  ) {
    ElMessage.warning(`威胁等级「${level}」已存在，不可重复添加`)
    return
  }
  alarmRows.value.push({
    id: `za-${Date.now()}`,
    level,
    tagColor: createForm.tagColor,
    audioEnabled: createForm.audioEnabled,
    uiFlashEnabled: createForm.uiFlashEnabled
  })
  createVisible.value = false
  createForm.level = ''
  selectedIds.value = selectedIds.value.filter((id) => alarmRows.value.some((row) => row.id === id))
  ElMessage.success(`已新增「${level}」威胁等级`)
  getList()
}

async function batchRemove() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先勾选威胁等级配置')
    return
  }
  const targets = alarmRows.value.filter((row) => selectedIds.value.includes(row.id))
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${targets.length} 条威胁等级配置吗？`,
      '批量删除',
      { type: 'warning' }
    )
  } catch {
    return
  }
  const idSet = new Set(selectedIds.value)
  alarmRows.value = alarmRows.value.filter((row) => !idSet.has(row.id))
  selectedIds.value = []
  ElMessage.success('已删除')
  getList()
}

async function removeRow(row: SoundAlarmRow) {
  try {
    await ElMessageBox.confirm(`确认删除威胁等级「${row.level}」吗？`, '删除', {
      type: 'warning'
    })
  } catch {
    return
  }
  alarmRows.value = alarmRows.value.filter((item) => item.id !== row.id)
  selectedIds.value = selectedIds.value.filter((id) => id !== row.id)
  ElMessage.success('已删除')
  getList()
}

function openEdit(row: SoundAlarmRow) {
  editForm.id = row.id
  editForm.level = row.level
  editForm.tagColor = row.tagColor
  editForm.audioEnabled = row.audioEnabled
  editForm.uiFlashEnabled = row.uiFlashEnabled
  editVisible.value = true
}

function submitEdit() {
  const current = alarmRows.value.find((item) => item.id === editForm.id)
  if (!current) return
  current.tagColor = editForm.tagColor
  current.audioEnabled = editForm.audioEnabled
  current.uiFlashEnabled = editForm.uiFlashEnabled
  editVisible.value = false
  ElMessage.success(`已更新「${current.level}」声光报警配置`)
  getList()
}

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'selection',
    search: { hidden: true },
    form: { hidden: true },
    table: { type: 'selection' }
  },
  {
    field: 'index',
    label: '序号',
    type: 'index',
    search: { hidden: true },
    form: { hidden: true },
    table: { width: 68, align: 'center' }
  },
  {
    field: 'level',
    label: '威胁等级',
    search: { hidden: true },
    form: { hidden: true },
    table: {
      minWidth: 140,
      align: 'center',
      slots: {
        default: ({ row }: { row: SoundAlarmRow }) => (
          <ElTag type={threatLevelTagType(row.level)} size="small" effect="light">
            {row.level}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'tagColor',
    label: '标签颜色',
    search: { hidden: true },
    form: { hidden: true },
    table: {
      minWidth: 140,
      align: 'center',
      slots: {
        default: ({ row }: { row: SoundAlarmRow }) => (
          <span
            class="threat-sound-alarm__color-chip"
            style={{ backgroundColor: row.tagColor }}
          ></span>
        )
      }
    }
  },
  {
    field: 'audioEnabled',
    label: '告警音频',
    search: { hidden: true },
    form: { hidden: true },
    table: {
      minWidth: 140,
      align: 'center',
      slots: {
        default: ({ row }: { row: SoundAlarmRow }) => (
          <ElTag type={row.audioEnabled ? 'success' : 'info'} size="small" effect="light">
            {switchLabel(row.audioEnabled)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'uiFlashEnabled',
    label: '界面闪烁',
    search: { hidden: true },
    form: { hidden: true },
    table: {
      minWidth: 140,
      align: 'center',
      slots: {
        default: ({ row }: { row: SoundAlarmRow }) => (
          <ElTag type={row.uiFlashEnabled ? 'success' : 'info'} size="small" effect="light">
            {switchLabel(row.uiFlashEnabled)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'action',
    label: '操作',
    search: { hidden: true },
    form: { hidden: true },
    table: {
      minWidth: 180,
      align: 'center',
      fixed: 'right',
      slots: {
        default: ({ row }: { row: SoundAlarmRow }) => (
          <>
            <BaseButton type="primary" onClick={() => openEdit(row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" class="ml-8px" onClick={() => removeRow(row)}>
              删除
            </BaseButton>
          </>
        )
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)
</script>

<template>
  <ContentWrap>
    <section class="threat-sound-alarm__config">
      <div class="threat-sound-alarm__config-title">报警配置</div>
      <div class="threat-sound-alarm__config-grid">
        <div class="threat-sound-alarm__config-item">
          <div class="threat-sound-alarm__config-label">告警音频</div>
          <div class="threat-sound-alarm__config-body">
            <div class="threat-sound-alarm__audio-row">
              <span
                class="threat-sound-alarm__file-name"
                :class="{ 'is-empty': !hasGlobalAudio() }"
              >
                {{ hasGlobalAudio() ? globalConfig.audioFileName : '未上传音频文件' }}
              </span>
              <div class="threat-sound-alarm__upload-actions">
                <ElUpload
                  v-bind="uploadProps"
                  accept=".mp3,.wav,.aac"
                  :before-upload="applyUploadedAudio"
                >
                  <BaseButton type="primary">上传</BaseButton>
                </ElUpload>
                <BaseButton :disabled="!hasGlobalAudio()" @click="clearGlobalAudio">清除</BaseButton>
                <BaseButton :disabled="!hasGlobalAudio()" @click="testGlobalAlarm">试鸣</BaseButton>
              </div>
            </div>
            <div class="threat-sound-alarm__config-field">
              <span class="threat-sound-alarm__config-field-label">持续时间</span>
              <ElSelect
                v-model="globalConfig.audioDurationMode"
                class="threat-sound-alarm__duration-select"
              >
                <ElOption
                  v-for="opt in AUDIO_DURATION_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </div>
          </div>
        </div>
        <div class="threat-sound-alarm__config-item">
          <div class="threat-sound-alarm__config-label">告警视觉形式</div>
          <div class="threat-sound-alarm__config-body threat-sound-alarm__config-body--visual">
            <ElSelect v-model="globalConfig.visualMode" class="threat-sound-alarm__visual-select">
              <ElOption
                v-for="opt in VISUAL_MODE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </div>
        </div>
      </div>
    </section>

    <div class="mb-10px">
      <BaseButton type="primary" @click="openCreate">新增威胁等级</BaseButton>
      <BaseButton type="danger" class="ml-8px" @click="batchRemove">批量删除</BaseButton>
    </div>

    <Table
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
      @selection-change="onSelectionChange"
    />

    <ElDialog v-model="createVisible" title="新增威胁等级" width="480px">
      <ElForm label-width="100px" class="threat-sound-alarm__form">
        <ElFormItem label="威胁等级" required>
          <ElSelect
            v-model="createForm.level"
            class="w-full"
            clearable
            :placeholder="
              availableThreatLevelOptions.length
                ? '请选择威胁等级'
                : '暂无未配置的威胁等级'
            "
            :disabled="!availableThreatLevelOptions.length"
            @change="onCreateLevelChange"
          >
            <ElOption
              v-for="opt in availableThreatLevelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
          <p v-if="!availableThreatLevelOptions.length" class="threat-sound-alarm__form-hint">
            字段管理中的威胁等级均已配置告警；删除列表项后可再次新增。
          </p>
        </ElFormItem>
        <ElFormItem label="标签颜色">
          <div class="threat-sound-alarm__editor">
            <ElColorPicker v-model="createForm.tagColor" />
            <span class="threat-sound-alarm__color-value">{{ createForm.tagColor }}</span>
          </div>
        </ElFormItem>
        <ElFormItem label="告警音频">
          <ElSwitch v-model="createForm.audioEnabled" active-text="开" inactive-text="关" />
        </ElFormItem>
        <ElFormItem label="界面闪烁">
          <ElSwitch v-model="createForm.uiFlashEnabled" active-text="开" inactive-text="关" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <BaseButton
          type="primary"
          :disabled="!createForm.level || !availableThreatLevelOptions.length"
          @click="submitCreate"
        >
          确定
        </BaseButton>
        <BaseButton @click="createVisible = false">取消</BaseButton>
      </template>
    </ElDialog>

    <ElDialog v-model="editVisible" title="编辑告警配置" width="480px">
      <ElForm label-width="100px" class="threat-sound-alarm__form">
        <ElFormItem label="威胁等级">
          <ElTag :type="threatLevelTagType(editForm.level)" size="small" effect="light">
            {{ editForm.level }}
          </ElTag>
        </ElFormItem>
        <ElFormItem label="标签颜色">
          <div class="threat-sound-alarm__editor">
            <ElColorPicker v-model="editForm.tagColor" />
            <span class="threat-sound-alarm__color-value">{{ editForm.tagColor }}</span>
          </div>
        </ElFormItem>
        <ElFormItem label="告警音频">
          <ElSwitch v-model="editForm.audioEnabled" active-text="开" inactive-text="关" />
        </ElFormItem>
        <ElFormItem label="界面闪烁">
          <ElSwitch v-model="editForm.uiFlashEnabled" active-text="开" inactive-text="关" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <BaseButton type="primary" @click="submitEdit">确定</BaseButton>
        <BaseButton @click="editVisible = false">取消</BaseButton>
      </template>
    </ElDialog>
  </ContentWrap>
</template>

<style scoped lang="less">
.threat-sound-alarm__config {
  padding: 14px 16px 16px;
  margin-bottom: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.threat-sound-alarm__config-title {
  margin-bottom: 14px;
  padding-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.threat-sound-alarm__config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 16px;
}

.threat-sound-alarm__config-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.threat-sound-alarm__config-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.threat-sound-alarm__config-body {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: 0;
}

.threat-sound-alarm__config-body--visual {
  align-items: flex-start;
}

.threat-sound-alarm__config-field {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.threat-sound-alarm__config-field-label {
  flex-shrink: 0;
  width: 64px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.threat-sound-alarm__duration-select,
.threat-sound-alarm__visual-select {
  width: 100%;
  max-width: 280px;
}

:deep(.threat-sound-alarm__color-chip) {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
}

.threat-sound-alarm__editor {
  display: flex;
  align-items: center;
  gap: 12px;
}

.threat-sound-alarm__color-value {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.threat-sound-alarm__audio-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.threat-sound-alarm__file-name {
  flex: 1 1 auto;
  min-width: 0;
  padding: 6px 10px;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;

  &.is-empty {
    color: var(--el-text-color-secondary);
  }
}

.threat-sound-alarm__upload-actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
}

.threat-sound-alarm__form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.threat-sound-alarm__form-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .threat-sound-alarm__config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
