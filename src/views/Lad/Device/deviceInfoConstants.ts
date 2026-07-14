import { LAD_DEVICE_TYPE_OPTIONS, LAD_MONITOR_DEVICE_TYPE_OPTIONS } from '@/constants/deviceTypes'

export const DEVICE_INFO_SEARCH_COL = { span: 6 } as const

export const deviceInfoTypeOptions = LAD_DEVICE_TYPE_OPTIONS

export const deviceIconOptions = [
  { label: '干扰器', value: 'jammer' },
  { label: '雷达', value: 'radar' },
  { label: '光电', value: 'eo' },
  { label: '反制', value: 'counter' }
]

export { LAD_MONITOR_DEVICE_TYPE_OPTIONS as deviceMonitorTypeOptions }
