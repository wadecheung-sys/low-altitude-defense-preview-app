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
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag
} from 'element-plus'
import { reactive, ref } from 'vue'

defineOptions({ name: 'LadSystemSoundAlarm' })

type AlarmLevel = string
type AlarmAudioMode = '无' | '蜂鸣' | '连续蜂鸣' | '汽笛' | '语音警示'
type AlarmLightMode = '无' | '闪烁' | '连续' | '频闪'

interface AlarmAudioRow {
  id: string
  level: AlarmLevel
  tagColor: string
  audioMode: AlarmAudioMode
  lightMode: AlarmLightMode
}

const rows = ref<AlarmAudioRow[]>([
  {
    id: 'za-low',
    level: '低',
    tagColor: '#67c23a',
    audioMode: '无',
    lightMode: '闪烁'
  },
  {
    id: 'za-middle',
    level: '中',
    tagColor: '#e6a23c',
    audioMode: '蜂鸣',
    lightMode: '闪烁'
  },
  {
    id: 'za-high',
    level: '高',
    tagColor: '#f56c6c',
    audioMode: '汽笛',
    lightMode: '频闪'
  },
  {
    id: 'za-none',
    level: '无',
    tagColor: '#909399',
    audioMode: '无',
    lightMode: '无'
  }
])

const globalForm = reactive({
  masterSwitch: true,
  defaultAudioMode: '蜂鸣' as AlarmAudioMode,
  defaultLightMode: '闪烁' as AlarmLightMode
})

const audioModeOptions: AlarmAudioMode[] = ['无', '蜂鸣', '连续蜂鸣', '汽笛', '语音警示']
const lightModeOptions: AlarmLightMode[] = ['无', '闪烁', '连续', '频闪']

const editVisible = ref(false)
const createVisible = ref(false)
const selectedRows = ref<AlarmAudioRow[]>([])
const createForm = reactive({
  level: '',
  tagColor: '#409eff',
  audioMode: '蜂鸣' as AlarmAudioMode,
  lightMode: '闪烁' as AlarmLightMode
})
const editForm = reactive({
  id: '',
  level: '低' as AlarmLevel,
  tagColor: '#67c23a',
  audioMode: '无' as AlarmAudioMode,
  lightMode: '无' as AlarmLightMode
})

function levelTagType(level: AlarmLevel): 'info' | 'success' | 'warning' | 'danger' | 'primary' {
  if (level === '无') return 'info'
  if (level === '低') return 'success'
  if (level === '中') return 'warning'
  if (level === '高') return 'danger'
  return 'primary'
}

function openCreate() {
  createForm.level = ''
  createForm.tagColor = '#409eff'
  createForm.audioMode = '蜂鸣'
  createForm.lightMode = '闪烁'
  createVisible.value = true
}

function submitCreate() {
  const level = createForm.level.trim()
  if (!level) {
    ElMessage.warning('请输入告警级别')
    return
  }
  if (rows.value.some((item) => item.level === level)) {
    ElMessage.warning(`告警级别“${level}”已存在`)
    return
  }
  rows.value.push({
    id: `za-${Date.now()}`,
    level,
    tagColor: createForm.tagColor,
    audioMode: createForm.audioMode,
    lightMode: createForm.lightMode
  })
  createVisible.value = false
  ElMessage.success(`已新增“${level}”告警级别`)
}

async function deleteRows(targets: AlarmAudioRow[] = selectedRows.value) {
  if (!targets.length) {
    ElMessage.warning('请先勾选需要删除的告警级别')
    return
  }
  const linkedRows = targets.filter((item) => ['低', '中', '高'].includes(item.level))
  if (linkedRows.length) {
    ElMessage.error(
      `删除失败：“${linkedRows.map((item) => item.level).join('、')}”级告警已关联具体数据，请取消当前数据在其他模块的关联状态。`
    )
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的告警级别“${targets.map((item) => item.level).join('、')}”吗？`,
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

function save() {
  ElMessage.success('声光报警配置已保存（演示）')
}

function openEdit(row: AlarmAudioRow) {
  editForm.id = row.id
  editForm.level = row.level
  editForm.tagColor = row.tagColor
  editForm.audioMode = row.audioMode
  editForm.lightMode = row.lightMode
  editVisible.value = true
}

function submitEdit() {
  const current = rows.value.find((item) => item.id === editForm.id)
  if (!current) return
  current.tagColor = editForm.tagColor
  current.audioMode = editForm.audioMode
  current.lightMode = editForm.lightMode
  editVisible.value = false
  ElMessage.success(`已更新${current.level}级告警配置`)
}

function testAlarm(row: AlarmAudioRow) {
  ElMessage.info(
    `已向“${row.level}”级别下发联调指令（音频：${row.audioMode}，灯光：${row.lightMode}）`
  )
}
</script>

<template>
  <ContentWrap title="声光报警">
    <ElForm :model="globalForm" inline class="threat-sound-alarm__global">
      <ElFormItem label="声光总开关">
        <ElSwitch v-model="globalForm.masterSwitch" />
      </ElFormItem>
      <ElFormItem label="默认告警音频">
        <ElSelect v-model="globalForm.defaultAudioMode" style="width: 160px">
          <ElOption v-for="item in audioModeOptions" :key="item" :label="item" :value="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="默认灯光模式">
        <ElSelect v-model="globalForm.defaultLightMode" style="width: 160px">
          <ElOption v-for="item in lightModeOptions" :key="item" :label="item" :value="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <BaseButton type="primary" @click="save">保存配置</BaseButton>
      </ElFormItem>
    </ElForm>

    <div class="threat-sound-alarm__toolbar">
      <BaseButton type="primary" @click="openCreate">新增告警级别</BaseButton>
      <BaseButton type="danger" @click="deleteRows()">删除</BaseButton>
    </div>

    <ElTable :data="rows" border stripe @selection-change="selectedRows = $event">
      <ElTableColumn type="selection" width="52" />
      <ElTableColumn prop="level" label="告警级别" width="120">
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
          <ElSelect v-model="row.audioMode" size="small" style="width: 140px">
            <ElOption v-for="item in audioModeOptions" :key="item" :label="item" :value="item" />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="灯光" min-width="140">
        <template #default="{ row }">
          <ElSelect v-model="row.lightMode" size="small" style="width: 120px">
            <ElOption v-for="item in lightModeOptions" :key="item" :label="item" :value="item" />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <BaseButton link type="primary" @click="openEdit(row)">编辑</BaseButton>
          <BaseButton link type="primary" @click="testAlarm(row)">试鸣</BaseButton>
          <BaseButton link type="danger" @click="deleteRows([row])">删除</BaseButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="createVisible" title="新增告警级别" width="420px">
      <ElForm :model="createForm" label-width="88px">
        <ElFormItem label="告警级别" required>
          <ElInput
            v-model="createForm.level"
            maxlength="10"
            placeholder="请输入告警级别"
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
          <ElSelect v-model="createForm.audioMode" class="w-100%">
            <ElOption v-for="item in audioModeOptions" :key="item" :label="item" :value="item" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="灯光">
          <ElSelect v-model="createForm.lightMode" class="w-100%">
            <ElOption v-for="item in lightModeOptions" :key="item" :label="item" :value="item" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <BaseButton @click="createVisible = false">取消</BaseButton>
        <BaseButton type="primary" @click="submitCreate">确定新增</BaseButton>
      </template>
    </ElDialog>

    <ElDialog v-model="editVisible" title="编辑告警配置" width="420px">
      <ElForm label-width="88px">
        <ElFormItem label="告警级别">
          <span>{{ editForm.level }}</span>
        </ElFormItem>
        <ElFormItem label="标签颜色">
          <div class="threat-sound-alarm__editor">
            <ElColorPicker v-model="editForm.tagColor" />
            <span class="threat-sound-alarm__color-value">{{ editForm.tagColor }}</span>
          </div>
        </ElFormItem>
        <ElFormItem label="报警音频">
          <ElSelect v-model="editForm.audioMode" class="w-100%">
            <ElOption v-for="item in audioModeOptions" :key="item" :label="item" :value="item" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="灯光">
          <ElSelect v-model="editForm.lightMode" class="w-100%">
            <ElOption v-for="item in lightModeOptions" :key="item" :label="item" :value="item" />
          </ElSelect>
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
.threat-sound-alarm__global {
  margin-bottom: 12px;
}

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
</style>
