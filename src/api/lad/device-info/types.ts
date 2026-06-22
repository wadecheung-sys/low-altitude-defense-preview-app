import type { DeviceArchiveIndicator } from '../device/types'

/** 设备类型（筛选项 / 列表展示） */
export type DeviceInfoKind =
  | '雷达'
  | '无线电侦测'
  | '无线电干扰'
  | '导航诱骗'
  | '激光打击'
  | '高功率微波'
  | '光电跟踪'

export interface DeviceInfoItem {
  id: string
  deviceId: string
  deviceName: string
  archiveInfo: string
  archiveId?: string
  deviceType: DeviceInfoKind | string
  deployLocation: string
  ipAddress: string
  serialNo: string
  lastHeartbeat: string
  personInCharge: string
  updatedAt: string
}

export interface DeviceInfoQuery {
  pageIndex?: number
  pageSize?: number
  deviceId?: string
  deviceName?: string
  deviceType?: string
  deployLocation?: string
  ipAddress?: string
  serialNo?: string
  lastHeartbeatStart?: string
  lastHeartbeatEnd?: string
  personInCharge?: string
}

export interface DeviceInfoListResult {
  list: DeviceInfoItem[]
  total: number
}

/** 设备部署与 GIS 扩展信息 */
export interface DeviceInfoDeployment {
  /** 设备实拍图；为空时由界面展示雷达语义占位符 */
  imageUrl: string
  /** 详细部署地址（补充 deployLocation） */
  deployAddress: string
  longitude: number
  latitude: number
  /** 示意地图平面坐标 0–100% */
  mapX: number
  mapY: number
  deviceIcon: string
  /** 管制范围（米） */
  controlRangeM: number
  contactPhone: string
}

/** 本设备扩展信息（非 IP/序列号等核心台账字段） */
export interface DeviceExtendedField {
  id: string
  /** 信息项名称 */
  label: string
  value: string
}

/** 关联设备档案摘要（档案指标只读来源） */
export interface DeviceLinkedArchive {
  id: string
  archiveNo: string
  archiveName: string
  deviceType: string
  vendor: string
  deviceModel: string
  imageUrl: string | null
  indicators: DeviceArchiveIndicator[]
}

export interface DeviceInfoDetail extends DeviceInfoItem, DeviceInfoDeployment {
  remark: string
  linkedArchive: DeviceLinkedArchive | null
  extendedFields: DeviceExtendedField[]
  /** 是否支持设备自检 */
  supportsSelfCheck?: boolean
}

export type {
  DeviceSelfCheckItem,
  DeviceSelfCheckItemStatus,
  DeviceSelfCheckOverall,
  DeviceSelfCheckResult
} from './deviceSelfCheck'

export interface DeviceInfoSavePayload {
  id?: string
  deviceId?: string
  deviceName: string
  archiveInfo: string
  archiveId?: string
  deviceType: string
  deployLocation: string
  deployAddress?: string
  ipAddress: string
  serialNo: string
  personInCharge: string
  contactPhone?: string
  longitude?: number
  latitude?: number
  mapX?: number
  mapY?: number
  deviceIcon?: string
  imageUrl?: string
  controlRangeM?: number
  remark?: string
  extendedFields?: DeviceExtendedField[]
  /** 当前设备基于基础档案填写的实际指标值。 */
  archiveIndicatorValues?: Record<string, string>
}
