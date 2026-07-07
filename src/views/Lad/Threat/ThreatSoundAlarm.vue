<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import {
  ElAlert,
  ElColorPicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload
} from 'element-plus'
import { reactive, ref } from 'vue'

defineOptions({ name: 'LadSystemSoundAlarm' })

type ThreatLevel = '低危' | '中危' | '高危' | '无危'
type AlarmAudioMode = '无' | '蜂鸣.wav' | '连续蜂鸣.wav' | '汽笛.wav' | '语音警示.wav' | string
type AudioPlayMode = '无' | '单次' | '循环' | '最大持续时间'
type UiPromptMode = '无' | '闪烁' | '常亮' | '最大持续时间'

const PROTECTED_LEVELS: ThreatLevel[] = ['低危', '中危', '高危']

const AUDIO_PLAY_MODE_OPTIONS: { label: string; value: AudioPlayMode }[] = [
  { label: '无', value: '无' },
  { label: '单次', value: '单次' },
  { label: '循环', value: '循环' },
  { label: '最大持续时间', value: '最大持续时间' }
]

const UI_PROMPT_MODE_OPTIONS: { label: string; value: UiPromptMode }[] = [
  { label: '无', value: '无' },
  { label: '闪烁', value: '闪烁' },
  { label: '常亮', value: '常亮' },
  { label: '最大持续时间', value: '最大持续时间' }
]

const DURATION_PRESETS = [60, 120, 300, 600, 900, 1800]

interface AlarmAudioRow {
  id: string
  level: ThreatLevel
  tagColor: string
  audioMode: AlarmAudioMode
  audioPlayMode: AudioPlayMode
  audioMaxDurationSec: number
  uiPromptMode: UiPromptMode
  uiMaxDurationSec: number
}

const rows = ref<AlarmAudioRow[]>([
  {
    id: 'za-low',
    level: '低危',
    tagColor: '#67c23a',
    audioMode: '无',
    audioPlayMode: '单次',
    audioMaxDurationSec: 600,
    uiPromptMode: '无',
    uiMaxDurationSec: 600
  },
  {
    id: 'za-middle',
    level: '中危',
    tagColor: '#e6a23c',
    audioMode: '蜂鸣.wav',
    audioPlayMode: '最大持续时间',
    audioMaxDurationSec: 600,
    uiPromptMode: '闪烁',
    uiMaxDurationSec: 600
  },
  {
    id: 'za-high',
    level: '高危',
    tagColor: '#f56c6c',
    audioMode: '汽笛.wav',
    audioPlayMode: '循环',
    audioMaxDurationSec: 600,
    uiPromptMode: '闪烁',
    uiMaxDurationSec: 600
  },
  {
    id: 'za-none',
    level: '无危',
    tagColor: '#909399',
    audioMode: '无',
    audioPlayMode: '无',
    audioMaxDurationSec: 600,
    uiPromptMode: '无',
    uiMaxDurationSec: 600
  }
])

const uploadProps = {
  action: '#',
  autoUpload: false,
  showFileList: false
}

const editVisible = ref(false)
const createVisible = ref(false)
const selectedRows = ref<AlarmAudioRow[]>([])
const createForm = reactive({
  level: '',
  tagColor: '#409eff',
  audioMode: '无' as AlarmAudioMode,
  audioPlayMode: '循环' as AudioPlayMode,
  audioMaxDurationSec: 600,
  uiPromptMode: '无' as UiPromptMode,
  uiMaxDurationSec: 600
})
const editForm = reactive({
  id: '',
  level: '低危' as ThreatLevel,
  tagColor: '#67c23a',
  audioMode: '无' as AlarmAudioMode,
  audioPlayMode: '循环' as AudioPlayMode,
  audioMaxDurationSec: 600,
  uiPromptMode: '无' as UiPromptMode,
  uiMaxDurationSec: 600
})

function levelTagType(level: ThreatLevel): 'info' | 'success' | 'warning' | 'danger' | 'primary' {
  if (level === '无危') return 'info'
  if (level === '低危') return 'success'
  if (level === '中危') return 'warning'
  if (level === '高危') return 'danger'
  return 'primary'
}

function hasAudio(mode: AlarmAudioMode) {
  return mode !== '无' && Boolean(mode)
}

function formatAudioPolicy(row: Pick<AlarmAudioRow, 'audioPlayMode' | 'audioMaxDurationSec'>) {
  if (row.audioPlayMode === '无') return '无'
  if (row.audioPlayMode === '最大持续时间') {
    return `最大持续时间 ${row.audioMaxDurationSec}秒`
  }
  return row.audioPlayMode
}

function formatUiFlash(row: Pick<AlarmAudioRow, 'uiPromptMode' | 'uiMaxDurationSec'>) {
  if (row.uiPromptMode === '无') return '无'
  if (row.uiPromptMode === '最大持续时间') {
    return `最大持续时间 ${row.uiMaxDurationSec}秒`
  }
  return row.uiPromptMode
}

function openCreate() {
  createForm.level = ''
  createForm.tagColor = '#409eff'
  createForm.audioMode = '无'
  createForm.audioPlayMode = '循环'
  createForm.audioMaxDurationSec = 600
  createForm.uiPromptMode = '无'
  createForm.uiMaxDurationSec = 600
  createVisible.value = true
}

function applyUploadedAudio(target: { audioMode: AlarmAudioMode }, file: { name?: string }) {
  const name = file.name?.trim()
  target.audioMode = (name || '自定义告警音频.wav') as AlarmAudioMode
  ElMessage.success(`已选择音频文件：${target.audioMode}`)
  return false
}

function clearAudio(target: { audioMode: AlarmAudioMode }) {
  target.audioMode = '无'
  ElMessage.success('已清空报警音频')
}

function submitCreate() {
  const level = createForm.level.trim()
  if (!level) {
    ElMessage.warning('请输入威胁等级')
    return
  }
  if (rows.value.some((item) => item.level === level)) {
    ElMessage.warning(`威胁等级“${level}”已存在`)
    return
  }
  rows.value.push({
    id: `za-${Date.now()}`,
    level: level as ThreatLevel,
    tagColor: createForm.tagColor,
    audioMode: createForm.audioMode,
    audioPlayMode: createForm.audioPlayMode,
    audioMaxDurationSec: createForm.audioMaxDurationSec,
    uiPromptMode: createForm.uiPromptMode,
    uiMaxDurationSec: createForm.uiMaxDurationSec
  })
  createVisible.value = false
  ElMessage.success(`已新增“${level}”威胁等级`)
}

async function deleteRows(targets: AlarmAudioRow[] = selectedRows.value) {
  if (!targets.length) {
    ElMessage.warning('请先勾选需要删除的威胁等级')
    return
  }
  const linkedRows = targets.filter((item) => PROTECTED_LEVELS.includes(item.level))
  if (linkedRows.length) {
    ElMessage.error(
      `删除失败：“${linkedRows.map((item) => item.level).join('、')}”已关联具体数据，请取消当前数据在其他模块的关联状态。`
    )
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的威胁等级“${targets.map((item) => item.level).join('、')}”吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  const ids = new Set(targets.map((item) => item.id))
  rows.value = rows.value.filter((item) => !ids.has(item.id))
  selectedRows.value = []
  ElMessage.success('删除成功')
}

function openEdit(row: AlarmAudioRow) {
  editForm.id = row.id
  editForm.level = row.level
  editForm.tagColor = row.tagColor
  editForm.audioMode = row.audioMode
  editForm.audioPlayMode = row.audioPlayMode
  editForm.audioMaxDurationSec = row.audioMaxDurationSec
  editForm.uiPromptMode = row.uiPromptMode
  editForm.uiMaxDurationSec = row.uiMaxDurationSec
  editVisible.value = true
}

function submitEdit() {
  const current = rows.value.find((item) => item.id === editForm.id)
  if (!current) return
  current.tagColor = editForm.tagColor
  current.audioMode = editForm.audioMode
  current.audioPlayMode = editForm.audioPlayMode
  current.audioMaxDurationSec = editForm.audioMaxDurationSec
  current.uiPromptMode = editForm.uiPromptMode
  current.uiMaxDurationSec = editForm.uiMaxDurationSec
  editVisible.value = false
  ElMessage.success(`已更新「${current.level}」声光报警配置`)
}

function testAlarm(row: AlarmAudioRow) {
  ElMessage.info(
    `已向「${row.level}」下发联调指令（音频：${row.audioMode} / ${formatAudioPolicy(row)}，界面：${formatUiFlash(row)}）`
  )
}
</script>

<template>
  <ContentWrap>
    <ElAlert
      class="threat-sound-alarm__page-tip"
      type="info"
      :closable="false"
      show-icon
    >
      <p class="threat-sound-alarm__page-tip-text">
        系统持续监测最高级别报警状态，并展示对应的告警提示反馈，直到对应级别的告警状态消失。
      </p>
      <p class="threat-sound-alarm__page-tip-text">
        当前最高级别告警下，若存在同级别不同来源状态（如不同无人机），可尝试再次触发告警动态。
      </p>
    </ElAlert>

    <div class="threat-sound-alarm__toolbar">
      <BaseButton type="primary" @click="openCreate">新增威胁等级</BaseButton>
      <BaseButton type="danger" @click="deleteRows()">批量删除</BaseButton>
    </div>

    <ElTable :data="rows" border stripe @selection-change="selectedRows = $event">
      <ElTableColumn type="selection" width="52" />
      <ElTableColumn type="index" label="序号" width="65" align="center" />
      <ElTableColumn prop="level" label="威胁等级" width="120">
        <template #default="{ row }">
          <ElTag :type="levelTagType(row.level)">{{ row.level }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="标签颜色" width="120" align="center">
        <template #default="{ row }">
          <span
            class="threat-sound-alarm__color-chip"
            :style="{ backgroundColor: row.tagColor }"
          ></span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="报警音频" min-width="140">
        <template #default="{ row }">
          <span class="threat-sound-alarm__plain-value">{{ row.audioMode }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="音频提示原则" min-width="140">
        <template #default="{ row }">
          <span class="threat-sound-alarm__plain-value">{{ formatAudioPolicy(row) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="界面闪烁" min-width="140" align="center">
        <template #default="{ row }">
          <span class="threat-sound-alarm__plain-value">{{ formatUiFlash(row) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <BaseButton type="primary" @click="openEdit(row)">编辑</BaseButton>
          <BaseButton type="primary" class="ml-8px" @click="testAlarm(row)">试鸣</BaseButton>
          <BaseButton type="danger" class="ml-8px" @click="deleteRows([row])">删除</BaseButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="createVisible" title="新增威胁等级" width="520px">
      <ElForm :model="createForm" label-width="100px" class="threat-sound-alarm__form">
        <ElFormItem label="威胁等级" required>
          <ElInput
            v-model="createForm.level"
            maxlength="10"
            placeholder="请输入威胁等级"
            clearable
          />
        </ElFormItem>
        <ElFormItem label="标签颜色">
          <div class="threat-sound-alarm__editor">
            <ElColorPicker v-model="createForm.tagColor" />
            <span class="threat-sound-alarm__color-value">{{ createForm.tagColor }}</span>
          </div>
        </ElFormItem>
        <ElFormItem label="报警音频">
          <div class="threat-sound-alarm__upload">
            <span class="threat-sound-alarm__file-name">{{ createForm.audioMode }}</span>
            <div class="threat-sound-alarm__upload-actions">
              <ElUpload
                v-bind="uploadProps"
                accept=".mp3,.wav,.aac"
                :before-upload="(file) => applyUploadedAudio(createForm, file)"
              >
                <BaseButton type="primary">上传</BaseButton>
              </ElUpload>
              <BaseButton
                :disabled="!hasAudio(createForm.audioMode)"
                @click="clearAudio(createForm)"
              >
                清空
              </BaseButton>
            </div>
          </div>
        </ElFormItem>
        <div class="threat-sound-alarm__policy-block">
          <div class="threat-sound-alarm__policy-title">提示原则 · 报警音频</div>
          <p class="threat-sound-alarm__policy-hint">
            可先设定播放原则，上传音频后按所选方式播放（无 / 单次 / 循环 / 最大持续时间）。
          </p>
          <ElFormItem label="播放方式">
            <ElSelect v-model="createForm.audioPlayMode" class="w-full">
              <ElOption
                v-for="opt in AUDIO_PLAY_MODE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            v-if="createForm.audioPlayMode === '最大持续时间'"
            label="最大时长"
          >
            <ElInputNumber
              v-model="createForm.audioMaxDurationSec"
              :min="1"
              :max="3600"
              :step="60"
              controls-position="right"
              class="threat-sound-alarm__duration-input"
            />
            <span class="threat-sound-alarm__unit">秒</span>
            <div class="threat-sound-alarm__duration-presets">
              <BaseButton
                v-for="sec in DURATION_PRESETS"
                :key="sec"
                link
                type="primary"
                @click="createForm.audioMaxDurationSec = sec"
              >
                {{ sec }}s
              </BaseButton>
            </div>
          </ElFormItem>
        </div>
        <div class="threat-sound-alarm__policy-block">
          <div class="threat-sound-alarm__policy-title">提示原则 · 界面闪烁</div>
          <p class="threat-sound-alarm__policy-hint">
            配置界面提示方式：无、闪烁、常亮，或限定最大持续时间。
          </p>
          <ElFormItem label="显示方式">
            <ElSelect v-model="createForm.uiPromptMode" class="w-full">
              <ElOption
                v-for="opt in UI_PROMPT_MODE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="createForm.uiPromptMode === '最大持续时间'" label="最大时长">
            <ElInputNumber
              v-model="createForm.uiMaxDurationSec"
              :min="1"
              :max="3600"
              :step="60"
              controls-position="right"
              class="threat-sound-alarm__duration-input"
            />
            <span class="threat-sound-alarm__unit">秒</span>
            <div class="threat-sound-alarm__duration-presets">
              <BaseButton
                v-for="sec in DURATION_PRESETS"
                :key="sec"
                link
                type="primary"
                @click="createForm.uiMaxDurationSec = sec"
              >
                {{ sec }}s
              </BaseButton>
            </div>
          </ElFormItem>
        </div>
      </ElForm>
      <template #footer>
        <BaseButton @click="createVisible = false">取消</BaseButton>
        <BaseButton type="primary" @click="submitCreate">确定新增</BaseButton>
      </template>
    </ElDialog>

    <ElDialog v-model="editVisible" title="编辑告警配置" width="520px">
      <ElForm label-width="100px" class="threat-sound-alarm__form">
        <ElFormItem label="威胁等级">
          <span>{{ editForm.level }}</span>
        </ElFormItem>
        <ElFormItem label="标签颜色">
          <div class="threat-sound-alarm__editor">
            <ElColorPicker v-model="editForm.tagColor" />
            <span class="threat-sound-alarm__color-value">{{ editForm.tagColor }}</span>
          </div>
        </ElFormItem>
        <ElFormItem label="报警音频">
          <div class="threat-sound-alarm__upload">
            <span class="threat-sound-alarm__file-name">{{ editForm.audioMode }}</span>
            <div class="threat-sound-alarm__upload-actions">
              <ElUpload
                v-bind="uploadProps"
                accept=".mp3,.wav,.aac"
                :before-upload="(file) => applyUploadedAudio(editForm, file)"
              >
                <BaseButton type="primary">上传</BaseButton>
              </ElUpload>
              <BaseButton
                :disabled="!hasAudio(editForm.audioMode)"
                @click="clearAudio(editForm)"
              >
                清空
              </BaseButton>
            </div>
          </div>
        </ElFormItem>
        <div class="threat-sound-alarm__policy-block">
          <div class="threat-sound-alarm__policy-title">提示原则 · 报警音频</div>
          <p class="threat-sound-alarm__policy-hint">
            可先设定播放原则，上传音频后按所选方式播放（无 / 单次 / 循环 / 最大持续时间）。
          </p>
          <ElFormItem label="播放方式">
            <ElSelect v-model="editForm.audioPlayMode" class="w-full">
              <ElOption
                v-for="opt in AUDIO_PLAY_MODE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="editForm.audioPlayMode === '最大持续时间'" label="最大时长">
            <ElInputNumber
              v-model="editForm.audioMaxDurationSec"
              :min="1"
              :max="3600"
              :step="60"
              controls-position="right"
              class="threat-sound-alarm__duration-input"
            />
            <span class="threat-sound-alarm__unit">秒</span>
            <div class="threat-sound-alarm__duration-presets">
              <BaseButton
                v-for="sec in DURATION_PRESETS"
                :key="sec"
                link
                type="primary"
                @click="editForm.audioMaxDurationSec = sec"
              >
                {{ sec }}s
              </BaseButton>
            </div>
          </ElFormItem>
        </div>
        <div class="threat-sound-alarm__policy-block">
          <div class="threat-sound-alarm__policy-title">提示原则 · 界面闪烁</div>
          <p class="threat-sound-alarm__policy-hint">
            配置界面提示方式：无、闪烁、常亮，或限定最大持续时间。
          </p>
          <ElFormItem label="显示方式">
            <ElSelect v-model="editForm.uiPromptMode" class="w-full">
              <ElOption
                v-for="opt in UI_PROMPT_MODE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="editForm.uiPromptMode === '最大持续时间'" label="最大时长">
            <ElInputNumber
              v-model="editForm.uiMaxDurationSec"
              :min="1"
              :max="3600"
              :step="60"
              controls-position="right"
              class="threat-sound-alarm__duration-input"
            />
            <span class="threat-sound-alarm__unit">秒</span>
            <div class="threat-sound-alarm__duration-presets">
              <BaseButton
                v-for="sec in DURATION_PRESETS"
                :key="sec"
                link
                type="primary"
                @click="editForm.uiMaxDurationSec = sec"
              >
                {{ sec }}s
              </BaseButton>
            </div>
          </ElFormItem>
        </div>
      </ElForm>
      <template #footer>
        <BaseButton @click="editVisible = false">取消</BaseButton>
        <BaseButton type="primary" @click="submitEdit">确定</BaseButton>
      </template>
    </ElDialog>
  </ContentWrap>
</template>

<style scoped lang="less">
.threat-sound-alarm__toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  margin-top: 12px;
}

.threat-sound-alarm__page-tip {
  margin-bottom: 0;
}

.threat-sound-alarm__page-tip-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);

  & + & {
    margin-top: 6px;
  }
}

.threat-sound-alarm__color-chip {
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

.threat-sound-alarm__plain-value {
  color: var(--el-text-color-regular);
}

.threat-sound-alarm__upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.threat-sound-alarm__file-name {
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.threat-sound-alarm__upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.threat-sound-alarm__form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.threat-sound-alarm__policy-block {
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.threat-sound-alarm__policy-block :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.threat-sound-alarm__policy-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.threat-sound-alarm__policy-hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.threat-sound-alarm__duration-input {
  width: 140px;
}

.threat-sound-alarm__unit {
  margin-left: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.threat-sound-alarm__duration-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  width: 100%;
  margin-top: 8px;
}
</style>
