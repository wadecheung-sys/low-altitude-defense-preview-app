import type { DeviceGroupItem } from '@/api/lad/device-group/types'
import type { DeviceInfoItem } from '@/api/lad/device-info/types'
import type { DeviceMonitorItem } from './types'

export interface DeviceMonitorVideoChannel {
  id: string
  label: string
  deviceName: string
  deviceCode: string
  deployLocation: string
  lastHeartbeat: string
  online: boolean
}

export function buildMonitorVideoChannels(
  monitor: DeviceMonitorItem,
  linkage: DeviceGroupItem | null | undefined,
  deviceCatalog: DeviceInfoItem[]
): DeviceMonitorVideoChannel[] {
  if (!linkage?.linkedDeviceIds.length) return []

  const catalogMap = new Map(deviceCatalog.map((item) => [item.id, item]))
  const channels: DeviceMonitorVideoChannel[] = []

  linkage.linkedDeviceIds.forEach((cameraId) => {
    const camera = catalogMap.get(cameraId)
    if (!camera) return
    channels.push({
      id: camera.id,
      label: camera.deviceName,
      deviceName: camera.deviceName,
      deviceCode: camera.deviceId,
      deployLocation: camera.deployLocation || monitor.deployLocation || '—',
      lastHeartbeat: camera.lastHeartbeat || monitor.lastHeartbeat,
      online: monitor.onlineStatus !== '离线'
    })
  })

  return channels
}

export function findLinkageByMasterDeviceId(
  groups: DeviceGroupItem[],
  masterDeviceId: string
): DeviceGroupItem | null {
  return groups.find((item) => item.masterDeviceId === masterDeviceId && item.enabled) ?? null
}
