/** 档案树分类（左侧树） */
export type DeviceArchiveCategory = 'all' | 'radar' | 'radio' | 'counter' | 'eo'

/** 列表记录 */
export interface DeviceArchiveItem {
  id: string
  archiveNo: string
  archiveName: string
  deviceType: string
  vendor: string
  deviceModel: string
  enabled: boolean
  category: Exclude<DeviceArchiveCategory, 'all'>
  updatedAt: string
}

export interface DeviceArchiveQuery {
  pageIndex?: number
  pageSize?: number
  category?: DeviceArchiveCategory
  archiveNo?: string
  archiveName?: string
  deviceType?: string
  vendor?: string
  deviceModel?: string
  status?: 'enabled' | 'disabled'
}

export interface DeviceArchiveListResult {
  list: DeviceArchiveItem[]
  total: number
}

export interface DeviceArchiveIndicator {
  id: string
  item: string
  unit: string
  value: string
}

/** 可配置项作用域：device=设备部署时可设定；runtime=指挥大屏运行时控制 */
export type DeviceConfigItemScope = 'device' | 'runtime'

export interface DeviceArchiveConfigurableItem {
  id: string
  key: string
  label: string
  unit: string
  scope: DeviceConfigItemScope
  /** 能力范围或说明 */
  hint?: string
  /** 设备级可配置项在档案中的建议默认值 */
  defaultValue?: string
}

export interface DeviceArchiveDetail extends DeviceArchiveItem {
  remark: string
  imageUrl: string | null
  /** 设备规格（说明书固定参数，不可随单台设备变更） */
  specifications: DeviceArchiveIndicator[]
  /** 可配置项定义（区分设备级与运行时） */
  configurableItems: DeviceArchiveConfigurableItem[]
}

export type DeviceArchiveSavePayload = Pick<
  DeviceArchiveItem,
  'archiveName' | 'deviceType' | 'vendor' | 'deviceModel' | 'enabled' | 'category'
> & {
  id?: string
  archiveNo?: string
  remark?: string
  imageUrl?: string | null
  specifications: DeviceArchiveIndicator[]
}

export interface DeviceArchiveEnabledPayload {
  ids: string[]
  enabled: boolean
}
