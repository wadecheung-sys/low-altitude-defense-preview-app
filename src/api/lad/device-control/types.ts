/** 指令下发通道：供应商平台上报链路（原始设计） */
export type DeviceCommandChannel = 'supplier'

export interface DeviceCommandRequest {
  /** 设备信息记录 id（di-*） */
  deviceRecordId: string
  deviceCode?: string
  deviceModel?: string
  deviceName?: string
  actionKey: string
  actionLabel: string
  channel?: DeviceCommandChannel
  /** 联动模式等附加参数 */
  payload?: Record<string, unknown>
}

export interface DeviceCommandResult {
  accepted: boolean
  commandId: string
  message: string
  channel: DeviceCommandChannel
  dispatchedAt: string
}

export interface DeviceCommandLogEntry extends DeviceCommandRequest {
  id: string
  accepted: boolean
  message: string
  dispatchedAt: string
}
