<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import {
  ElColorPicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag
} from 'element-plus'
import { reactive, ref } from 'vue'

defineOptions({ name: 'LadSystemSoundAlarm' })

type AlarmLevel = '低' | '中' | '高'
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
const editForm = reactive({
  id: '',
  level: '低' as AlarmLevel,
  tagColor: '#67c23a'
})

function levelTagType(level: AlarmLevel) {
  if (level === '低') return 'success'
  if (level === '中') return 'warning'
  return 'danger'
}

function save() {
  ElMessage.success('声光报警配置已保存（演示）')
}

function openEdit(row: AlarmAudioRow) {
  editForm.id = row.id
  editForm.level = row.level
  editForm.tagColor = row.tagColor
  editVisible.value = true
}

function submitEdit() {
  const current = rows.value.find((item) => item.id === editForm.id)
  if (!current) return
  current.tagColor = editForm.tagColor
  editVisible.value = false
  ElMessage.success(`已更新${current.level}级告警标签颜色`)
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

    <ElTable :data="rows" border stripe>
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
      <ElTableColumn label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <BaseButton link type="primary" @click="openEdit(row)">编辑</BaseButton>
          <BaseButton link type="primary" @click="testAlarm(row)">试鸣</BaseButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="editVisible" title="编辑标签颜色" width="420px">
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
