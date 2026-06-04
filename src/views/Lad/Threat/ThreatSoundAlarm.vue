<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import {
  ElForm,
  ElFormItem,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn
} from 'element-plus'
import { reactive, ref } from 'vue'

defineOptions({ name: 'LadSystemSoundAlarm' })

interface ZoneAlarmRow {
  id: string
  zoneName: string
  zoneType: string
  soundEnabled: boolean
  lightEnabled: boolean
  level: string
  pattern: string
}

const rows = ref<ZoneAlarmRow[]>([
  {
    id: 'za-1',
    zoneName: '一级预警区',
    zoneType: '预警区',
    soundEnabled: true,
    lightEnabled: true,
    level: '高',
    pattern: '连续声光'
  },
  {
    id: 'za-2',
    zoneName: '二级警戒区',
    zoneType: '警戒区',
    soundEnabled: true,
    lightEnabled: false,
    level: '中',
    pattern: '间歇蜂鸣'
  },
  {
    id: 'za-3',
    zoneName: '禁飞区',
    zoneType: '禁飞区',
    soundEnabled: true,
    lightEnabled: true,
    level: '高',
    pattern: '急促告警'
  },
  {
    id: 'za-4',
    zoneName: '核岛核心区',
    zoneType: '核岛',
    soundEnabled: true,
    lightEnabled: true,
    level: '极高',
    pattern: '三级联动'
  }
])

const globalForm = reactive({
  masterSwitch: true,
  defaultPattern: '标准声光'
})

const patternOptions = ['标准声光', '连续声光', '间歇蜂鸣', '急促告警', '静默闪光']

function save() {
  ElMessage.success('声光报警配置已保存（演示）')
}

function testAlarm(row: ZoneAlarmRow) {
  ElMessage.info(`已向「${row.zoneName}」下发试鸣指令（演示）`)
}
</script>

<template>
  <ContentWrap title="声光报警">
    <ElForm :model="globalForm" inline class="threat-sound-alarm__global">
      <ElFormItem label="声光总开关">
        <ElSwitch v-model="globalForm.masterSwitch" />
      </ElFormItem>
      <ElFormItem label="默认告警模式">
        <ElSelect v-model="globalForm.defaultPattern" style="width: 160px">
          <ElOption v-for="p in patternOptions" :key="p" :label="p" :value="p" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <BaseButton type="primary" @click="save">保存配置</BaseButton>
      </ElFormItem>
    </ElForm>
    <p class="threat-sound-alarm__hint">
      按防护分区配置声光报警方式，与威胁评估规则联动触发（演示）。
    </p>
    <ElTable :data="rows" border stripe>
      <ElTableColumn prop="zoneName" label="防护分区" min-width="140" />
      <ElTableColumn prop="zoneType" label="区域类型" width="110" />
      <ElTableColumn label="声音" width="80">
        <template #default="{ row }">
          <ElSwitch v-model="row.soundEnabled" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="灯光" width="80">
        <template #default="{ row }">
          <ElSwitch v-model="row.lightEnabled" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn prop="level" label="告警级别" width="100" />
      <ElTableColumn label="告警模式" min-width="140">
        <template #default="{ row }">
          <ElSelect v-model="row.pattern" size="small" style="width: 130px">
            <ElOption v-for="p in patternOptions" :key="p" :label="p" :value="p" />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <BaseButton link type="primary" @click="testAlarm(row)">试鸣</BaseButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </ContentWrap>
</template>

<style scoped lang="less">
.threat-sound-alarm__global {
  margin-bottom: 8px;
}

.threat-sound-alarm__hint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
