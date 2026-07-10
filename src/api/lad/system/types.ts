export type EventOwnership =
  | '目标发现'
  | '威胁识别'
  | '威胁评估'
  | '处置执行'
  | '目标结果'
  | '设备状态'

export type EventAlarmLevel = '提示' | '重要' | '紧急'

/** 「设备状态」归属下的事件类型 */
export type DeviceStatusEventType = '上线' | '离线'

/** 事件属性「事件类型」（与归纳文档一致，按归属分组） */
export type EventAttributeEventType =
  | '独立发现'
  | '多源融合'
  | '无危'
  | '低危'
  | '中危'
  | '高危'
  | '人工处置'
  | '自动处置'
  | '驱离/自离'
  | '迫降'
  | '打击'
  | DeviceStatusEventType

export interface EventAttributeItem {
  id: string
  eventId: string
  /** 业务展示用事件名称（可自定义） */
  eventName: string
  eventOwnership: EventOwnership
  eventType: EventAttributeEventType
  alarmEnabled: boolean
  alarmLevel: EventAlarmLevel
  priority: number
  messagePrompt: string
  remark?: string
  updatedAt: string
}

export interface EventAttributeQuery {
  pageIndex?: number
  pageSize?: number
  eventId?: string
  eventName?: string
  eventOwnership?: EventOwnership
  eventType?: EventAttributeEventType
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
  eventType: EventAttributeEventType
  alarmEnabled: boolean
  alarmLevel: EventAlarmLevel
  priority: number
  messagePrompt: string
  remark?: string
}

export type ParamValueType = 'string' | 'number' | 'boolean'

export type ParamGroup = '系统' | '地图' | '存储' | '管制' | '安全' | '模拟' | '告警'

export interface SystemParam {
  id: string
  paramKey: string
  paramName: string
  group: ParamGroup
  valueType: ParamValueType
  /** 数值类模拟参数可为 null，表示留空不触发 */
  paramValue: string | number | boolean | null
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
  paramValue: string | number | boolean | null
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
