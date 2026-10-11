import type { DeviceClass } from './types'

export const DEVICE_CLASS_OPTIONS = [
  { label: '侦测类设备', value: 'detection' },
  { label: '反制类设备', value: 'countermeasure' }
] as const

export function deviceClassLabel(value: DeviceClass): string {
  return DEVICE_CLASS_OPTIONS.find((option) => option.value === value)?.label || '未配置'
}

export function isValidDeviceClass(value: unknown): value is DeviceClass {
  return value === 'detection' || value === 'countermeasure'
}

/** 仅用于已有设备的原型示例，不代表经过验证的安全时长。 */
export const DEVICE_DEMO_MAX_DISPOSAL_SECONDS = 30

export const DEVICE_MAX_DISPOSAL_VALIDATION_MESSAGE = '单次最大处置时长须为大于 0 的整数秒'

/** 只用于初始化旧示例档案的类别，页面与保存校验以档案显式类别为准。 */
const COUNTERMEASURE_DEVICE_TYPES = new Set([
  '强光',
  '强光驱离',
  '无线电干扰',
  '导航诱骗',
  '高功率微波',
  '激光打击'
])

export function defaultDeviceClassForType(deviceType: string): DeviceClass {
  return COUNTERMEASURE_DEVICE_TYPES.has(deviceType) ? 'countermeasure' : 'detection'
}

export function isValidMaxDisposalSeconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

/** 仅保存单台设备配置；实际设备计时与停止由设备控制服务负责。 */
export function validateDeviceMaxDisposalSeconds(
  deviceClass: DeviceClass,
  value: unknown
): number | undefined {
  if (deviceClass === 'detection') return undefined
  if (!isValidDeviceClass(deviceClass)) throw new Error('基础档案未配置有效的设备类别')
  if (!isValidMaxDisposalSeconds(value)) {
    throw new Error(DEVICE_MAX_DISPOSAL_VALIDATION_MESSAGE)
  }
  return value
}
