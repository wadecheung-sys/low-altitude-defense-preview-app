import type { DeviceInfoItem } from '@/api/lad/device-info/types'
import type { DeviceGroupType } from './types'

/** 关联设备：监控摄像头 */
export const CAMERA_DEVICE_TYPE = '监控摄像头'

/** 主设备：侦测 / 反制类设备类型 */
export const MASTER_DEVICE_TYPES = [
  '雷达',
  '无线电侦测',
  'Remote-ID 监视',
  '无线电干扰',
  '导航诱骗',
  '激光打击',
  '高功率微波',
  '光电跟踪'
] as const

/** 周边设备：不可作为设备组主设备 */
export const PERIPHERAL_DEVICE_TYPES = ['监控摄像头', 'ADS-B 监视'] as const

export function isCameraDevice(device: Pick<DeviceInfoItem, 'deviceType'>): boolean {
  return device.deviceType === CAMERA_DEVICE_TYPE
}

export function isPeripheralDevice(device: Pick<DeviceInfoItem, 'deviceType'>): boolean {
  return (PERIPHERAL_DEVICE_TYPES as readonly string[]).includes(device.deviceType)
}

export function isMasterDevice(device: Pick<DeviceInfoItem, 'deviceType'>): boolean {
  return !isCameraDevice(device) && !isPeripheralDevice(device)
}

export function deriveGroupType(deviceType: string): DeviceGroupType {
  if (deviceType === '雷达' || deviceType === '无线电侦测' || deviceType === 'Remote-ID 监视') {
    return '探测组'
  }
  if (
    deviceType === '无线电干扰' ||
    deviceType === '导航诱骗' ||
    deviceType === '激光打击' ||
    deviceType === '高功率微波'
  ) {
    return '反制组'
  }
  if (deviceType === '光电跟踪') return '光电协同组'
  return '综合联动组'
}

export function buildLinkedChain(
  devices: Pick<DeviceInfoItem, 'id' | 'deviceName'>[],
  linkedIds: string[]
): string {
  const nameMap = new Map(devices.map((item) => [item.id, item.deviceName]))
  return linkedIds
    .map((id) => nameMap.get(id))
    .filter((name): name is string => Boolean(name))
    .join('、')
}

export function resolveMasterDevice(
  masterDevices: DeviceInfoItem[],
  deviceName: string,
  deviceCode: string
): DeviceInfoItem | null {
  const code = deviceCode.trim()
  if (code) {
    const byCode = masterDevices.find((item) => item.deviceId === code)
    if (byCode) return byCode
  }
  const name = deviceName.trim()
  if (name) {
    return masterDevices.find((item) => item.deviceName === name) ?? null
  }
  return null
}

export function buildMemberIds(masterDeviceId: string, linkedDeviceIds: string[]): string[] {
  return [masterDeviceId, ...linkedDeviceIds]
}
