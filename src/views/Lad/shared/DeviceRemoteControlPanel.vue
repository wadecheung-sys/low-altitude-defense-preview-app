<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import { ElMessage, ElSwitch } from 'element-plus'
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    deviceName?: string
    deviceType?: string
    deviceCode?: string
    online?: boolean
    showModeSwitch?: boolean
    compact?: boolean
  }>(),
  {
    deviceName: '设备',
    deviceType: '',
    deviceCode: '',
    online: true,
    showModeSwitch: true,
    compact: false
  }
)

const autoMode = ref(true)
const powered = ref(true)

function demo(cmd: string) {
  ElMessage.success(
    `\u5df2\u5411\u300c${props.deviceName}\u300d\u4e0b\u53d1\u300c${cmd}\u300d\u6307\u4ee4\uff08\u6f14\u793a\uff0c\u672a\u8054\u52a8\u5b9e\u9645\u8bbe\u5907\uff09`
  )
}

function onPower(on: boolean) {
  powered.value = on
  demo(on ? '\u8fdc\u7a0b\u4e0a\u7535' : '\u8fdc\u7a0b\u4e0b\u7535')
}
</script>

<template>
  <div class="device-remote-panel" :class="{ 'is-compact': compact }">
    <div class="device-remote-panel__head">
      <span class="device-remote-panel__name">{{ deviceName }}</span>
      <span
        class="device-remote-panel__status"
        :class="online ? 'is-online' : 'is-offline'"
      >
        {{ online ? '\u5728\u7ebf' : '\u79bb\u7ebf' }}
      </span>
    </div>
    <p v-if="deviceType || deviceCode" class="device-remote-panel__meta">
      <span v-if="deviceType">{{ deviceType }}</span>
      <span v-if="deviceCode"> / {{ deviceCode }}</span>
    </p>
    <div v-if="showModeSwitch" class="device-remote-panel__mode">
      <span>工作模式</span>
      <ElSwitch
        v-model="autoMode"
        inline-prompt
        active-text="自动"
        inactive-text="手动"
        @change="(v: boolean) => demo(v ? '切换自动模式' : '切换手动模式')"
      />
    </div>
    <div class="device-remote-panel__actions">
      <BaseButton type="primary" size="small" :disabled="!powered" @click="demo('驱离')">
        驱离
      </BaseButton>
      <BaseButton type="danger" size="small" :disabled="!powered" @click="demo('迫降')">
        迫降
      </BaseButton>
      <BaseButton size="small" @click="onPower(true)">远程上电</BaseButton>
      <BaseButton size="small" @click="onPower(false)">远程下电</BaseButton>
      <BaseButton size="small" @click="demo('追踪联动')">光电联动</BaseButton>
      <BaseButton size="small" @click="demo('定向跟踪')">定向跟踪</BaseButton>
    </div>
  </div>
</template>

<style scoped lang="less">
.device-remote-panel {
  padding: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.device-remote-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.device-remote-panel__name {
  font-size: 14px;
  font-weight: 600;
}

.device-remote-panel__status {
  font-size: 12px;

  &.is-online {
    color: var(--el-color-success);
  }

  &.is-offline {
    color: var(--el-text-color-secondary);
  }
}

.device-remote-panel__meta {
  margin: 0 0 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.device-remote-panel__mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
}

.device-remote-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.device-remote-panel.is-compact .device-remote-panel__actions {
  gap: 6px;
}
</style>
