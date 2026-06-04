export type ParamValueType = 'string' | 'number' | 'boolean'

export type ParamGroup = '系统' | '告警' | '地图' | '数据'

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
  keyword?: string
  group?: ParamGroup
  valueType?: ParamValueType
}

export interface SystemParamListResult {
  list: SystemParam[]
  total: number
}

export interface SystemParamSavePayload {
  id: string
  paramValue: string | number | boolean
}

export interface DictTypeItem {
  id: string
  dictCode: string
  dictName: string
  status: 'enabled' | 'disabled'
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
  status: 'enabled' | 'disabled'
  remark?: string
  updatedAt: string
}

export interface DictTypeQuery {
  pageIndex?: number
  pageSize?: number
  dictCode?: string
  dictName?: string
  status?: 'enabled' | 'disabled' | ''
}

export interface DictTypeListResult {
  list: DictTypeItem[]
  total: number
}

export interface DictTypeSavePayload {
  id?: string
  dictCode: string
  dictName: string
  status: 'enabled' | 'disabled'
  remark?: string
}

export interface DictEntryQuery {
  dictTypeId: string
  pageIndex?: number
  pageSize?: number
  label?: string
  status?: 'enabled' | 'disabled' | ''
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
  status: 'enabled' | 'disabled'
  remark?: string
}
