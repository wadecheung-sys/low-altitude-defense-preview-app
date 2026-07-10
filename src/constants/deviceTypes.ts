/**
 * 设备类型单一事实来源
 * 字典 device_type、设备档案/设备信息筛选项、设备关联与运行监控均引用此处
 */

export interface LadDeviceTypeEntry {
  /** 业务展示名（档案、台账、筛选项 value） */
  label: string
  /** 字典编码 device_type 的 value */
  dictValue: string
  /** 是否在设备运行监控中作为独立设备展示 */
  monitorVisible?: boolean
  /** 是否可作为设备关联主设备 */
  masterEligible?: boolean
}

export const LAD_DEVICE_TYPE_ENTRIES: LadDeviceTypeEntry[] = [
  { label: '雷达', dictValue: 'radar' },
  { label: '无线电侦测', dictValue: 'radio_detect' },
  { label: 'Remote-ID 监视', dictValue: 'remote_id' },
  { label: 'ADS-B 监视', dictValue: 'adsb', monitorVisible: false, masterEligible: false },
  { label: '无线电干扰', dictValue: 'radio_jamming' },
  { label: '导航诱骗', dictValue: 'navigation_spoofing' },
  { label: '激光打击', dictValue: 'laser_strike' },
  { label: '高功率微波', dictValue: 'hpm' },
  { label: '光电跟踪', dictValue: 'eo_track' },
  { label: '声光驱离', dictValue: 'sound_light_expulsion' },
  { label: '监控摄像机', dictValue: 'camera', monitorVisible: false, masterEligible: false }
]

export const LAD_DEVICE_TYPE_LABELS = LAD_DEVICE_TYPE_ENTRIES.map((entry) => entry.label)

export type LadDeviceTypeLabel = (typeof LAD_DEVICE_TYPE_LABELS)[number]

export const LAD_DEVICE_TYPE_DICT_CODE = 'device_type'

export const LAD_CAMERA_DEVICE_TYPE = '监控摄像机' as const

export function toDeviceTypeSelectOptions(
  entries: readonly LadDeviceTypeEntry[] = LAD_DEVICE_TYPE_ENTRIES
) {
  return entries.map((entry) => ({ label: entry.label, value: entry.label }))
}

/** 设备档案 / 设备信息筛选项 */
export const LAD_DEVICE_TYPE_OPTIONS = toDeviceTypeSelectOptions()

/** 设备运行监控筛选项（不含周边类设备） */
export const LAD_MONITOR_DEVICE_TYPE_OPTIONS = toDeviceTypeSelectOptions(
  LAD_DEVICE_TYPE_ENTRIES.filter((entry) => entry.monitorVisible !== false)
)

/** 运行监控排除的设备类型 */
export const LAD_MONITOR_EXCLUDED_DEVICE_TYPES = LAD_DEVICE_TYPE_ENTRIES.filter(
  (entry) => entry.monitorVisible === false
).map((entry) => entry.label)

/** 设备关联可选主设备类型 */
export const LAD_MASTER_DEVICE_TYPES = LAD_DEVICE_TYPE_ENTRIES.filter(
  (entry) => entry.masterEligible !== false
).map((entry) => entry.label)

/** 周边设备类型（不可作为主设备） */
export const LAD_PERIPHERAL_DEVICE_TYPES = LAD_DEVICE_TYPE_ENTRIES.filter(
  (entry) => entry.masterEligible === false
).map((entry) => entry.label)

export function isCameraDeviceType(deviceType: string): boolean {
  return deviceType === LAD_CAMERA_DEVICE_TYPE
}

export function isPeripheralDeviceType(deviceType: string): boolean {
  return LAD_PERIPHERAL_DEVICE_TYPES.includes(deviceType)
}

export function isMasterDeviceType(deviceType: string): boolean {
  return !isPeripheralDeviceType(deviceType)
}

export function deviceTypeDictValue(label: string): string | undefined {
  return LAD_DEVICE_TYPE_ENTRIES.find((entry) => entry.label === label)?.dictValue
}

export function deviceTypeLabelFromDictValue(value: string): string | undefined {
  return LAD_DEVICE_TYPE_ENTRIES.find((entry) => entry.dictValue === value)?.label
}
