export { DEVICE_ARCHIVE_PLACEHOLDER } from '@/api/lad/device/archiveStore'

export const deviceArchiveTypeOptions = [
  { label: '雷达', value: '雷达' },
  { label: '无线电侦测', value: '无线电侦测' },
  { label: '无线电干扰', value: '无线电干扰' },
  { label: '导航诱骗', value: '导航诱骗' },
  { label: '激光打击', value: '激光打击' },
  { label: '高功率微波', value: '高功率微波' },
  { label: '光电跟踪', value: '光电跟踪' }
]

export const deviceArchiveVendorOptions = [{ label: '同方威视', value: '同方威视' }]

export const deviceArchiveStatusOptions = [
  { label: '生效', value: 'enabled' },
  { label: '未生效', value: 'disabled' }
]

/** 有左侧树时筛选项每行 3 列 */
export const DEVICE_ARCHIVE_SEARCH_COL = { span: 8 } as const
