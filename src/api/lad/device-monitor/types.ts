import type { DeviceInfoKind, DeviceLinkedArchive } from '../device-info/types'

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

export type DeviceRuntimeMetricLevel = 'normal' | 'running' | 'warning' | 'fault' | 'unknown'

export interface DeviceRuntimeMetric {
  key: string
  label: string
  value: string | number
  unit?: string
  level?: DeviceRuntimeMetricLevel
}

export interface RadarRuntimeTrack {
  messageType: '0x8B' | '0x8C'
  messageName: '搜索航迹报' | '跟踪航迹报'
  targetId: number
  targetType: '鸟类' | '无人机' | '不明'
  longitude: number
  latitude: number
  altitudeM: number
  rangeM: number
  azimuthMil: number
  elevationMil: number
  speedMps: number
  intensity: number
  pointKind: '真实点' | '外推点'
}

export interface RadarRuntimeProtocol {
  transport: string
  endpoint: string
  reportRateHz: number
  sourceAddress: string
  destinationAddress: string
  lastMessageType: '0x8B' | '0x8C' | '0x8D' | '0x8E'
  checksumValid: boolean
  track: RadarRuntimeTrack
  health: Array<{ label: string; normal: boolean; detail: string }>
}

/** 设备运行监控弹层使用的实时状态快照 */
export interface DeviceRuntimeSnapshot {
  deviceId: string
  model: string
  connectionStatus: DeviceOnlineStatus
  workStatus: string
  workMode?: string
  updatedAt: string
  metrics: DeviceRuntimeMetric[]
  radar?: RadarRuntimeProtocol
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
  /** 与设备信息页一致的档案摘要文案 */
  archiveInfo: string
  /** 设备信息页关联的基础档案（含指标当前值） */
  linkedArchive: DeviceLinkedArchive | null
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
