<script setup lang="ts">
import { postDeviceCommandApi } from '@/api/lad/device-control'
import { BaseButton } from '@/components/Button'
import { getConfirmedDeviceProtocol } from '@/constants/deviceProtocols'
import { ElAlert, ElMessage, ElTag } from 'element-plus'
import { computed, ref } from 'vue'

export interface DeviceOperationAction {
  key: string
  label: string
  type?: 'primary' | 'danger' | 'default'
  disabled?: boolean
  protocolCode?: string
  payload?: Record<string, unknown>
  localOnly?: boolean
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

const pendingActionKey = ref('')

const protocolProfile = computed(() => getConfirmedDeviceProtocol(props.deviceModel))

const panelMode = computed<
  'counter' | 'detect' | 'rid' | 'radar' | 'eo' | 'strike' | 'hpm' | 'sound_light' | 'readonly'
>(() => {
  const model = props.deviceModel
  if (model === 'FG310F' || props.deviceType === '无线电干扰') return 'counter'
  if (model === 'DY506F' || props.deviceType === '导航诱骗') return 'counter'
  if (model === 'RDS200' || props.deviceType === 'Remote-ID 监视') return 'rid'
  if (
    model === 'PL671F' ||
    model === 'EXD55-LS' ||
    props.deviceType === '无线电侦测' ||
    props.deviceType === 'ADS-B 监视'
  ) {
    return 'detect'
  }
  if (model === 'RADAR-081' || props.deviceType === '雷达') return 'radar'
  if (model === 'TBD-EO' || props.deviceType === '光电跟踪') return 'eo'
  if (model === 'TBD-LSR' || props.deviceType === '激光打击') return 'strike'
  if (model === 'TBD-HPM' || props.deviceType === '高功率微波') return 'hpm'
  if (model === 'TBD-SLA' || props.deviceType === '声光驱离') return 'sound_light'
  return 'readonly'
})

const actions = computed<DeviceOperationAction[]>(() => {
  if (panelMode.value === 'radar') {
    return [
      { key: 'radar_search', label: '搜索模式', type: 'primary' },
      { key: 'radar_track', label: '跟踪模式' },
      { key: 'radar_search_track', label: '搜跟模式' },
      { key: 'radar_receive', label: '仅接收' },
      { key: 'radar_silent', label: '雷达寂静', type: 'danger' }
    ]
  }
  if (panelMode.value === 'eo') {
    return [
      { key: 'track_auto', label: '自动跟踪', type: 'primary' },
      { key: 'track_manual', label: '手动跟踪' },
      { key: 'reset_turret', label: '转台复位' }
    ]
  }
  if (panelMode.value === 'strike') {
    return [
      { key: 'aim_target', label: '瞄准目标', type: 'primary' },
      { key: 'laser_ready', label: '出光准备' },
      { key: 'laser_stop', label: '停止出光', type: 'danger' }
    ]
  }
  if (panelMode.value === 'hpm') {
    return [
      { key: 'hpm_work_mode', label: '切换工作模式', type: 'primary' },
      { key: 'servo_unlock', label: '伺服解锁' },
      { key: 'hpm_ready', label: '发射准备' }
    ]
  }
  if (panelMode.value === 'sound_light') {
    return [
      { key: 'sla_on', label: '启动声光警示', type: 'primary' },
      { key: 'sla_off', label: '停止警示' }
    ]
  }
  if (panelMode.value === 'detect') {
    return [
      { key: 'refresh', label: '刷新探测数据' },
      { key: 'report', label: '上报平台同步' }
    ]
  }
  if (panelMode.value === 'rid') {
    return [{ key: 'local_refresh', label: '刷新监测数据', localOnly: true }]
  }
  if (props.deviceModel === 'DY506F') {
    return [
      {
        key: 'spoof_position',
        label: '诱骗位置设置',
        type: 'primary',
        protocolCode: '0x2001',
        payload: { msgType: 0x2001, dbLon: 120.089436, dbLat: 30.341896, dbAlt: 36 }
      },
      {
        key: 'constellation_on',
        label: '四系统发射',
        protocolCode: '0x2003',
        payload: {
          msgType: 0x2003,
          iSwitchGPS: 1,
          iSwitchBDS: 1,
          iSwitchGLO: 1,
          iSwitchGAL: 1
        }
      },
      {
        key: 'constellation_off',
        label: '全部停止',
        protocolCode: '0x2003',
        payload: {
          msgType: 0x2003,
          iSwitchGPS: 0,
          iSwitchBDS: 0,
          iSwitchGLO: 0,
          iSwitchGAL: 0
        }
      },
      {
        key: 'expel',
        label: '驱离发射',
        protocolCode: '0x2102',
        payload: { msgType: 0x2102 }
      },
      {
        key: 'no_fly_land',
        label: '禁飞/降落',
        type: 'danger',
        protocolCode: '0x2106',
        payload: { msgType: 0x2106 }
      },
      {
        key: 'navigation_defense',
        label: '导航防御',
        protocolCode: '0x2108',
        payload: { msgType: 0x2108 }
      },
      {
        key: 'initial_speed',
        label: '模拟初速度',
        protocolCode: '0x200E',
        payload: { msgType: 0x200e, fInitSpeedVal: 10, fInitSpeedHead: 180 }
      },
      {
        key: 'circle_motion',
        label: '模拟圆周运动',
        protocolCode: '0x2012',
        payload: { msgType: 0x2012, fCirRadius: 100, fCirCycle: 200, iCirRotDir: 0 }
      }
    ]
  }
  if (props.deviceModel === 'FG310F') {
    return [
      {
        key: 'turn_left',
        label: '转台左转',
        protocolCode: '0x2001',
        payload: { msgType: 0x2001, type: 0 }
      },
      {
        key: 'turn_right',
        label: '转台右转',
        protocolCode: '0x2001',
        payload: { msgType: 0x2001, type: 1 }
      },
      {
        key: 'turn_stop',
        label: '转台停止',
        protocolCode: '0x2001',
        payload: { msgType: 0x2001, type: 4 }
      },
      {
        key: 'turn_angle',
        label: '指定水平角',
        protocolCode: '0x2004',
        payload: { msgType: 0x2004, type: 0, angle: 18475 }
      },
      {
        key: 'band_on',
        label: '频段 2 开启',
        type: 'primary',
        protocolCode: '0x3001',
        payload: { msgType: 0x3001, type: 1, freq: 2 }
      },
      {
        key: 'band_off',
        label: '频段 2 关闭',
        protocolCode: '0x3001',
        payload: { msgType: 0x3001, type: 0, freq: 2 }
      },
      {
        key: 'all_band_off',
        label: '全部频段关闭',
        type: 'danger',
        protocolCode: '0x3002',
        payload: { msgType: 0x3002, type: 0 }
      },
      {
        key: 'query_bands',
        label: '查询频段状态',
        protocolCode: '0x3003',
        payload: { msgType: 0x3003 }
      }
    ]
  }
  return [{ key: 'status', label: '查询设备状态' }]
})

const panelHint = computed(() => {
  if (panelMode.value === 'radar')
    return '按 0x8A 系统控制报语义下发，控制周期 100ms；搜索/跟踪及收发状态由 0x8D、0x8E 状态报回送确认。'
  if (panelMode.value === 'eo') return '光电转台支持自动/手动跟踪切换，实时角度同步至监测数据。'
  if (panelMode.value === 'strike') return '激光打击需完成安全联锁复核后方可出光，请谨慎操作。'
  if (panelMode.value === 'hpm') return '高功率微波设备需确认伺服状态与工作模式后再执行发射准备。'
  if (panelMode.value === 'sound_light') return '声光警示用于近距驱离，请确认警戒区域内无无关人员。'
  if (panelMode.value === 'detect') return '探测类设备以监视为主，指令经供应商平台上报链路转发。'
  if (panelMode.value === 'rid')
    return 'RID 协议的 0x1100/0x1102 均由设备主动上报且平台无需应答；操作台仅刷新本地显示。'
  if (props.deviceModel === 'DY506F')
    return '506 设备使用 TCP 六字节帧头与 JSON 帧体；控制项已按 0x2001/0x2003/0x200E/0x2012 及固定式发射命令映射。'
  if (props.deviceModel === 'FG310F')
    return '310 设备使用 HTTP POST/PUT JSON；转台角度按真实角度 100 倍下发，频段先由 0x3003 查询并按数组下标控制。'
  return '指令经平台上报链路转发。'
})

async function dispatchCommand(
  actionKey: string,
  actionLabel: string,
  payload?: Record<string, unknown>
) {
  if (!props.deviceRecordId && !props.deviceCode) {
    ElMessage.warning('缺少设备标识，无法下发指令')
    return
  }
  if (pendingActionKey.value) return

  pendingActionKey.value = actionKey
  try {
    const res = await postDeviceCommandApi({
      deviceRecordId: props.deviceRecordId || props.deviceCode,
      deviceCode: props.deviceCode,
      deviceModel: props.deviceModel,
      deviceName: props.deviceName,
      actionKey,
      actionLabel,
      channel: 'supplier',
      payload
    })
    const message = res.data?.message || `已向「${props.deviceName}」下发「${actionLabel}」`
    if (res.data?.accepted === false) {
      ElMessage.warning(message)
    } else {
      ElMessage.success(message)
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '指令下发失败')
  } finally {
    pendingActionKey.value = ''
  }
}

function onAction(action: DeviceOperationAction) {
  if (action.disabled || !props.online || pendingActionKey.value) return
  if (action.localOnly) {
    ElMessage.success('监测数据已刷新；RID 上报消息无需平台应答')
    return
  }
  void dispatchCommand(action.key, action.label, action.payload)
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
    <div v-if="protocolProfile" class="device-remote-panel__protocol">
      <p>{{ protocolProfile.transport }} · {{ protocolProfile.connectionRole }}</p>
      <div class="device-remote-panel__protocol-tags">
        <ElTag
          v-for="message in protocolProfile.messages"
          :key="message.code"
          size="small"
          effect="plain"
        >
          {{ message.code }} {{ message.label }}
        </ElTag>
      </div>
    </div>
    <div class="device-remote-panel__actions">
      <BaseButton
        v-for="action in actions"
        :key="action.key"
        :type="action.type || 'default'"
        size="small"
        :loading="pendingActionKey === action.key"
        :disabled="
          action.disabled || !online || (!!pendingActionKey && pendingActionKey !== action.key)
        "
        @click="onAction(action)"
      >
        {{ action.label }}
        <small v-if="action.protocolCode" class="device-remote-panel__action-code">
          {{ action.protocolCode }}
        </small>
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

.device-remote-panel__protocol {
  margin-bottom: 10px;
  font-size: 13px;

  p {
    margin: 0 0 8px;
    color: var(--el-text-color-secondary);
  }
}

.device-remote-panel__protocol-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.device-remote-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.device-remote-panel.is-compact .device-remote-panel__actions {
  gap: 6px;
}

.device-remote-panel__action-code {
  margin-left: 4px;
  opacity: 0.72;
}
</style>
