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

export type DeviceArchiveIndicatorDataType = 'text' | 'number' | 'datetime' | 'select'

export interface DeviceArchiveIndicatorConfig {
  maxLength?: number
  integerDigits?: number
  decimalPlaces?: number
  includeDate?: boolean
  includeTime?: boolean
  timeFormat?: 'YYYY-MM-DD HH:mm:ss' | 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY' | 'HH:mm:ss'
  options?: string[]
}

export interface DeviceArchiveIndicator {
  id: string
  item: string
  unit: string
  dataType?: DeviceArchiveIndicatorDataType
  config?: DeviceArchiveIndicatorConfig
  /** 指标未单独维护时采用的默认值。 */
  value: string
}

export interface DeviceArchiveDetail extends DeviceArchiveItem {
  remark: string
  imageUrl: string | null
  indicators: DeviceArchiveIndicator[]
}

export type DeviceArchiveSavePayload = Pick<
  DeviceArchiveItem,
  'archiveName' | 'deviceType' | 'vendor' | 'deviceModel' | 'enabled' | 'category'
> & {
  id?: string
  archiveNo?: string
  remark?: string
  imageUrl?: string | null
  indicators: DeviceArchiveIndicator[]
}

export interface DeviceArchiveEnabledPayload {
  ids: string[]
  enabled: boolean
}
