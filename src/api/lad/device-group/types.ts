export type DeviceGroupType = '探测组' | '反制组' | '光电协同组' | '综合联动组'

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
  groupName?: string
  groupType?: string
  enabled?: boolean
}

export interface DeviceGroupListResult {
  list: DeviceGroupItem[]
  total: number
}

export type DeviceGroupSavePayload = Omit<DeviceGroupItem, 'id' | 'updatedAt'> & {
  id?: string
}
