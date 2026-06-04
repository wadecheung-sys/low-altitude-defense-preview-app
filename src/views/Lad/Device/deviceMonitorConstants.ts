import { deviceInfoTypeOptions } from './deviceInfoConstants'

/** 与 list-page-core / 设备信息列表一致 */
export const DEVICE_MONITOR_SEARCH_COL = { span: 6 } as const

export const deviceMonitorTypeOptions = deviceInfoTypeOptions

export const onlineStatusOptions = [
  { label: '全部', value: '' },
  { label: '正常', value: '正常' },
  { label: '离线', value: '离线' },
  { label: '异常', value: '异常' }
]
