export type DeviceGroupType = '探测组' | '反制组' | '光电协同组' | '综合联动组'

/** 设备组管理：协同编组 */
export interface DeviceGroupItem {
  id: string
  groupCode: string
  groupName: string
  groupType: DeviceGroupType
  description: string
  memberIds: string[]
  enabled: boolean
  updatedAt: string
}

export interface DeviceGroupQuery {
  pageIndex?: number
  pageSize?: number
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

export type DeviceGroupSavePayload = Omit<DeviceGroupItem, 'id' | 'updatedAt' | 'groupCode'> & {
  id?: string
  groupCode?: string
}

/** 设备关联：主设备 ↔ 监控摄像头 */
export interface DeviceLinkageItem {
  id: string
  masterDeviceId: string
  deviceName: string
  deviceCode: string
  deviceType: string
  deployArea: string
  linkedDeviceIds: string[]
  linkedChain: string
  enabled: boolean
  updatedAt: string
}

export interface DeviceLinkageQuery {
  pageIndex?: number
  pageSize?: number
  deployArea?: string
  deviceType?: string
  deviceName?: string
  deviceCode?: string
  enabled?: boolean
}

export interface DeviceLinkageListResult {
  list: DeviceLinkageItem[]
  total: number
}

export interface DeviceLinkageSavePayload {
  id?: string
  masterDeviceId: string
  deviceName: string
  deviceCode: string
  deviceType: string
  deployArea: string
  linkedDeviceIds: string[]
  linkedChain: string
  enabled?: boolean
}
