<script setup lang="ts">
import { postDeviceCommandApi } from '@/api/lad/device-control'
import { BaseButton } from '@/components/Button'
import { ElAlert, ElMessage, ElSwitch } from 'element-plus'
import { computed, ref } from 'vue'

export interface DeviceOperationAction {
  key: string
  label: string
  type?: 'primary' | 'danger' | 'default'
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    deviceRecordId?: string
    deviceName?: string
    deviceType?: string
    deviceModel?: string
    deviceCode?: string
    online?: boolean
    compact?: boolean
  }>(),
  {
    deviceRecordId: '',
    deviceName: '设备',
    deviceType: '',
    deviceModel: '',
    deviceCode: '',
    online: true,
    compact: false
  }
)

const autoMode = ref(true)
const powered = ref(true)
const pendingActionKey = ref('')

const panelMode = computed<'counter' | 'detect' | 'readonly' | 'pending'>(() => {
  const model = props.deviceModel
  if (model === 'FG310F' || props.deviceType === '无线电干扰') return 'counter'
  if (model === 'DY506F' || props.deviceType === '导航诱骗') return 'counter'
  if (model === 'PL671F' || model === 'RDS200' || props.deviceType === '无线电侦测' || props.deviceType === 'Remote-ID 监视') {
    return 'detect'
  }
  if (model.startsWith('TBD-') || props.deviceType === '雷达' || props.deviceType === '光电跟踪' || props.deviceType === '激光打击' || props.deviceType === '高功率微波') {
    return 'pending'
  }
  return 'readonly'
})

const actions = computed<DeviceOperationAction[]>(() => {
  if (panelMode.value === 'pending') {
    return [{ key: 'pending', label: '暂无可用操作', disabled: true }]
  }
  if (panelMode.value === 'detect') {
    return [
      { key: 'refresh', label: '刷新探测数据' },
      { key: 'report', label: '上报平台同步' }
    ]
  }
  if (props.deviceModel === 'DY506F') {
    return [
      { key: 'emit_on', label: '发射开启', type: 'primary' },
      { key: 'emit_off', label: '发射关闭' },
      { key: 'forced_land', label: '迫降', type: 'danger' },
      { key: 'no_fly', label: '禁飞', type: 'danger' },
      { key: 'expel', label: '驱离' },
      { key: 'sim_pos', label: '模拟位置' }
    ]
  }
  if (props.deviceModel === 'FG310F') {
    return [
      { key: 'link_track', label: '联动跟踪压制', type: 'primary' },
      { key: 'band_jam', label: '指定频段压制' },
      { key: 'release', label: '解除压制' },
      { key: 'reset', label: '转台复位' }
    ]
  }
  return [{ key: 'status', label: '查询设备状态' }]
})

const panelHint = computed(() => {
  if (panelMode.value === 'pending') return '该设备暂无可下发操作项。'
  if (panelMode.value === 'detect') return '探测类设备以监视为主，指令经供应商平台上报链路转发。'
  if (props.deviceModel === 'DY506F') return '导航诱骗：迫降 / 禁飞 / 驱离对应 DY506F 上位机能力。'
  if (props.deviceModel === 'FG310F') return '无线电压制：压制效果可能触发目标自动返航。'
  return '指令经平台上报链路转发。'
})

async function dispatchCommand(actionKey: string, actionLabel: string, payload?: Record<string, unknown>) {
  if (!props.deviceRecordId) {
    ElMessage.warning('缺少设备记录，无法下发指令')
    return
  }
  if (pendingActionKey.value) return

  pendingActionKey.value = actionKey
  try {
    const res = await postDeviceCommandApi({
      deviceRecordId: props.deviceRecordId,
      deviceCode: props.deviceCode,
      deviceModel: props.deviceModel,
      deviceName: props.deviceName,
      actionKey,
      actionLabel,
      channel: 'supplier',
      payload
    })
    ElMessage.success(res.data?.message || `已向「${props.deviceName}」下发「${actionLabel}」`)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '指令下发失败')
  } finally {
    pendingActionKey.value = ''
  }
}

function onAction(action: DeviceOperationAction) {
  if (action.disabled || !props.online || pendingActionKey.value) return
  if (action.key === 'emit_on') powered.value = true
  if (action.key === 'emit_off') powered.value = false
  void dispatchCommand(action.key, action.label)
}

function onAutoModeChange(enabled: boolean) {
  void dispatchCommand(enabled ? 'auto_mode_on' : 'auto_mode_off', enabled ? '切换自动联动' : '切换手动控制', {
    autoMode: enabled
  })
}
</script>

<template>
  <div class="device-remote-panel" :class="{ 'is-compact': compact }">
    <div class="device-remote-panel__head">
      <span class="device-remote-panel__name">设备操作</span>
      <span class="device-remote-panel__status" :class="online ? 'is-online' : 'is-offline'">
        {{ online ? '在线' : '离线' }}
      </span>
    </div>
    <p class="device-remote-panel__meta">
      <span v-if="deviceModel">{{ deviceModel }}</span>
      <span v-if="deviceType"> · {{ deviceType }}</span>
      <span v-if="deviceCode"> · {{ deviceCode }}</span>
    </p>
    <ElAlert :closable="false" type="info" show-icon class="device-remote-panel__hint">
      {{ panelHint }}
    </ElAlert>
    <div v-if="panelMode === 'counter'" class="device-remote-panel__mode">
      <span>联动模式</span>
      <ElSwitch
        v-model="autoMode"
        inline-prompt
        active-text="自动"
        inactive-text="手动"
        :disabled="!!pendingActionKey || !online"
        @change="onAutoModeChange"
      />
    </div>
    <div class="device-remote-panel__actions">
      <BaseButton
        v-for="action in actions"
        :key="action.key"
        :type="action.type || 'default'"
        size="small"
        :loading="pendingActionKey === action.key"
        :disabled="
          action.disabled ||
          !online ||
          (!!pendingActionKey && pendingActionKey !== action.key) ||
          (panelMode === 'counter' && !powered && action.key !== 'emit_on')
        "
        @click="onAction(action)"
      >
        {{ action.label }}
      </BaseButton>
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
  margin: 0 0 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.device-remote-panel__hint {
  margin-bottom: 10px;
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
