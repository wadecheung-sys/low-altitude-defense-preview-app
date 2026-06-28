<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import {
  ElColorPicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload
} from 'element-plus'
import { reactive, ref } from 'vue'

defineOptions({ name: 'LadSystemSoundAlarm' })

type ThreatLevel = '低危' | '中危' | '高危' | '无危'
type AlarmAudioMode = '无' | '蜂鸣.wav' | '连续蜂鸣.wav' | '汽笛.wav' | '语音警示.wav'

const PROTECTED_LEVELS: ThreatLevel[] = ['低危', '中危', '高危']

interface AlarmAudioRow {
  id: string
  level: ThreatLevel
  tagColor: string
  audioMode: AlarmAudioMode
  lightBlink: boolean
}

const rows = ref<AlarmAudioRow[]>([
  {
    id: 'za-low',
    level: '低危',
    tagColor: '#67c23a',
    audioMode: '无',
    lightBlink: true
  },
  {
    id: 'za-middle',
    level: '中危',
    tagColor: '#e6a23c',
    audioMode: '蜂鸣.wav',
    lightBlink: true
  },
  {
    id: 'za-high',
    level: '高危',
    tagColor: '#f56c6c',
    audioMode: '汽笛.wav',
    lightBlink: true
  },
  {
    id: 'za-none',
    level: '无危',
    tagColor: '#909399',
    audioMode: '无',
    lightBlink: false
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
  lightBlink: true
})
const editForm = reactive({
  id: '',
  level: '低危' as ThreatLevel,
  tagColor: '#67c23a',
  audioMode: '无' as AlarmAudioMode,
  lightBlink: false
})

function levelTagType(level: ThreatLevel): 'info' | 'success' | 'warning' | 'danger' | 'primary' {
  if (level === '无危') return 'info'
  if (level === '低危') return 'success'
  if (level === '中危') return 'warning'
  if (level === '高危') return 'danger'
  return 'primary'
}

function openCreate() {
  createForm.level = ''
  createForm.tagColor = '#409eff'
  createForm.audioMode = '无'
  createForm.lightBlink = true
  createVisible.value = true
}

function applyUploadedAudio(target: { audioMode: AlarmAudioMode }, file: { name?: string }) {
  const name = file.name?.trim()
  target.audioMode = (name || '自定义告警音频.wav') as AlarmAudioMode
  ElMessage.success(`已选择音频文件：${target.audioMode}`)
  return false
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
    lightBlink: createForm.lightBlink
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
  editForm.lightBlink = row.lightBlink
  editVisible.value = true
}

function submitEdit() {
  const current = rows.value.find((item) => item.id === editForm.id)
  if (!current) return
  current.tagColor = editForm.tagColor
  current.audioMode = editForm.audioMode
  current.lightBlink = editForm.lightBlink
  editVisible.value = false
  ElMessage.success(`已更新「${current.level}」声光报警配置`)
}

function testAlarm(row: AlarmAudioRow) {
  ElMessage.info(
    `已向「${row.level}」下发联调指令（音频：${row.audioMode}，灯光闪烁：${row.lightBlink ? '开' : '关'}）`
  )
}
</script>

<template>
  <ContentWrap title="声光报警">
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
      <ElTableColumn label="报警音频" min-width="160">
        <template #default="{ row }">
          <span class="threat-sound-alarm__plain-value">{{ row.audioMode }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="灯光闪烁" min-width="120" align="center">
        <template #default="{ row }">
          <ElTag :type="row.lightBlink ? 'success' : 'info'">
            {{ row.lightBlink ? '开' : '关' }}
          </ElTag>
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

    <ElDialog v-model="createVisible" title="新增威胁等级" width="420px">
      <ElForm :model="createForm" label-width="88px">
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
            <span>{{ createForm.audioMode }}</span>
            <ElUpload
              v-bind="uploadProps"
              accept=".mp3,.wav,.aac"
              :before-upload="(file) => applyUploadedAudio(createForm, file)"
            >
              <BaseButton type="primary">上传</BaseButton>
            </ElUpload>
          </div>
        </ElFormItem>
        <ElFormItem label="灯光闪烁">
          <ElSwitch v-model="createForm.lightBlink" active-text="开" inactive-text="关" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <BaseButton @click="createVisible = false">取消</BaseButton>
        <BaseButton type="primary" @click="submitCreate">确定新增</BaseButton>
      </template>
    </ElDialog>

    <ElDialog v-model="editVisible" title="编辑告警配置" width="420px">
      <ElForm label-width="88px">
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
            <span>{{ editForm.audioMode }}</span>
            <ElUpload
              v-bind="uploadProps"
              accept=".mp3,.wav,.aac"
              :before-upload="(file) => applyUploadedAudio(editForm, file)"
            >
              <BaseButton type="primary">上传</BaseButton>
            </ElUpload>
          </div>
        </ElFormItem>
        <ElFormItem label="灯光闪烁">
          <ElSwitch v-model="editForm.lightBlink" active-text="开" inactive-text="关" />
        </ElFormItem>
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
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}
</style>
