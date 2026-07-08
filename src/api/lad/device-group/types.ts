export type DeviceGroupType = '探测组' | '反制组' | '光电协同组' | '综合联动组'

/** 设备组 / 联动配置：主设备（侦测反制）→ 关联监控摄像头 */
export interface DeviceGroupItem {
  id: string
  /** 主设备信息 id */
  masterDeviceId: string
  deviceName: string
  deviceCode: string
  deviceType: string
  deployArea: string
  linkedDeviceIds: string[]
  linkedChain: string
  enabled: boolean
  updatedAt: string
  /** 预案模块兼容 */
  groupName: string
  groupCode: string
  groupType: DeviceGroupType
  memberIds: string[]
  description: string
}

export interface DeviceGroupQuery {
  pageIndex?: number
  pageSize?: number
  deployArea?: string
  deviceType?: string
  deviceName?: string
  deviceCode?: string
  groupCode?: string
  groupName?: string
  groupType?: string
  description?: string
  enabled?: boolean
}

export interface DeviceGroupListResult {
  list: DeviceGroupItem[]
  total: number
}

export interface DeviceGroupSavePayload {
  id?: string
  masterDeviceId: string
  deviceName: string
  deviceCode: string
  deviceType: string
  deployArea: string
  linkedDeviceIds: string[]
  linkedChain: string
  enabled?: boolean
  description?: string
  groupCode?: string
}
