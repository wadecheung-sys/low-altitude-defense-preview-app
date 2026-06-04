import type { DeviceInfoKind } from '../device-info/types'

/** 设备运行监控页展示的运行状态 */
export type DeviceOnlineStatus = '正常' | '离线' | '异常'

export interface DeviceMonitorMetrics {
  /** 今日探测/跟踪次数 */
  detectCount: number
  /** 今日告警次数 */
  alertCount: number
  /** 今日成功处置次数 */
  handleCount: number
}

export interface DeviceMonitorItem {
  id: string
  deviceId: string
  deviceName: string
  deviceType: DeviceInfoKind | string
  deployLocation: string
  ipAddress: string
  serialNo: string
  onlineStatus: DeviceOnlineStatus
  /** 连续运行时长展示 HH:mm:ss */
  runtimeText: string
  metrics: DeviceMonitorMetrics
  manufacturer: string
  deviceModel: string
  personInCharge: string
  lastHeartbeat: string
  hasAlert: boolean
  imageUrl: string | null
}

export interface DeviceMonitorQuery {
  pageIndex?: number
  pageSize?: number
  deviceName?: string
  deviceType?: string
  deployLocation?: string
  onlineStatus?: DeviceOnlineStatus | ''
}

export interface DeviceMonitorListResult {
  list: DeviceMonitorItem[]
  total: number
}
