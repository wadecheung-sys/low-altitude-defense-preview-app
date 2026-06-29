export type ParamValueType = 'string' | 'number' | 'boolean'

export type ParamGroup = '系统' | '地图' | '数据'

export interface SystemParam {
  id: string
  paramKey: string
  paramName: string
  group: ParamGroup
  valueType: ParamValueType
  paramValue: string | number | boolean
  remark?: string
  updatedAt: string
}

export interface SystemParamQuery {
  pageIndex?: number
  pageSize?: number
  paramName?: string
  valueType?: ParamValueType
  remark?: string
  updatedAtStart?: string
  updatedAtEnd?: string
}

export interface SystemParamListResult {
  list: SystemParam[]
  total: number
}

export interface SystemParamSavePayload {
  id?: string
  paramKey?: string
  paramName?: string
  valueType?: ParamValueType
  paramValue: string | number | boolean
  remark?: string
}

export type EventOwnership = '无人机入侵' | '设备故障'

export type EventAlarmLevel = '提示' | '重要' | '紧急'

export interface EventAttributeItem {
  id: string
  eventId: string
  eventName: string
  eventOwnership: EventOwnership
  eventType: string
  alarmEnabled: boolean
  alarmLevel: EventAlarmLevel
  priority: number
  remark?: string
  updatedAt: string
}

export interface EventAttributeQuery {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  eventOwnership?: EventOwnership
  alarmEnabled?: boolean
}

export interface EventAttributeListResult {
  list: EventAttributeItem[]
  total: number
}

export interface EventAttributeSavePayload {
  id?: string
  eventId: string
  eventName: string
  eventOwnership: EventOwnership
  eventType: string
  alarmEnabled: boolean
  alarmLevel: EventAlarmLevel
  priority: number
  remark?: string
}

export interface DictTypeItem {
  id: string
  dictCode: string
  dictName: string
  remark?: string
  itemCount: number
  updatedAt: string
}

export interface DictEntryItem {
  id: string
  dictTypeId: string
  label: string
  value: string
  sort: number
  remark?: string
  updatedAt: string
}

export interface DictTypeQuery {
  pageIndex?: number
  pageSize?: number
  dictCode?: string
  dictName?: string
}

export interface DictTypeListResult {
  list: DictTypeItem[]
  total: number
}

export interface DictTypeSavePayload {
  id?: string
  dictCode: string
  dictName: string
  remark?: string
}

export interface DictEntryQuery {
  dictTypeId: string
  pageIndex?: number
  pageSize?: number
  label?: string
}

export interface DictEntryListResult {
  dictType: DictTypeItem | null
  list: DictEntryItem[]
  total: number
}

export interface DictEntrySavePayload {
  id?: string
  dictTypeId: string
  label: string
  value: string
  sort: number
  remark?: string
}
