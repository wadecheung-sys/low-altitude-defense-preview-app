export { DEVICE_ARCHIVE_PLACEHOLDER } from '@/api/lad/device/archiveStore'
export { LAD_DEVICE_TYPE_OPTIONS as deviceArchiveTypeOptions } from '@/constants/deviceTypes'

export const deviceArchiveVendorOptions = [
  { label: '凡双科技', value: '凡双科技' },
  { label: '亿思德科技', value: '亿思德科技' },
  { label: '华诺智感', value: '华诺智感' },
  { label: '视界光电', value: '视界光电' },
  { label: '锐光防务', value: '锐光防务' },
  { label: '磐石电子', value: '磐石电子' },
  { label: '海康威视', value: '海康威视' },
  { label: '大华', value: '大华' },
  { label: '通用', value: '通用' }
]

export const deviceArchiveStatusOptions = [
  { label: '生效', value: 'enabled' },
  { label: '未生效', value: 'disabled' }
]

/** 有左侧树时筛选项每行 3 列 */
export const DEVICE_ARCHIVE_SEARCH_COL = { span: 8 } as const
