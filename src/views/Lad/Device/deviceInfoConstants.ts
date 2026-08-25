import { LAD_DEVICE_TYPE_OPTIONS, LAD_MONITOR_DEVICE_TYPE_OPTIONS } from '@/constants/deviceTypes'

export const DEVICE_INFO_SEARCH_COL = { span: 6 } as const

export const deviceInfoTypeOptions = LAD_DEVICE_TYPE_OPTIONS

/** 设备信息列表与详情共用的业务字段名称，避免两个页面各自演进后口径漂移。 */
export const DEVICE_INFO_FIELD_LABELS = {
  deviceId: '设备编号',
  deviceName: '设备名称',
  archiveInfo: '基础档案',
  deviceType: '设备类型',
  deployLocation: '部署区域',
  ipAddress: '设备IP',
  personInCharge: '保管人'
} as const

export const deviceIconOptions = [
  { label: '干扰器', value: 'jammer' },
  { label: '雷达', value: 'radar' },
  { label: '光电', value: 'eo' },
  { label: '反制', value: 'counter' }
]

export { LAD_MONITOR_DEVICE_TYPE_OPTIONS as deviceMonitorTypeOptions }
