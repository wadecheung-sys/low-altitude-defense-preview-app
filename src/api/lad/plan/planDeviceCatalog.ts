/** 预案执行能力目录：按设备组类型约束可选功能 */

export interface PlanDeviceFunctionOption {
  label: string
  value: string
  deviceAction: string
}

const detectionFunctions: PlanDeviceFunctionOption[] = [
  { label: '雷达目标跟踪', value: 'radar_track', deviceAction: '跟踪' },
  { label: '光电目标锁定', value: 'eo_track_lock', deviceAction: '跟踪' },
  { label: '连续监测上报', value: 'eo_monitor_report', deviceAction: '跟踪' }
]

const counterFunctions: PlanDeviceFunctionOption[] = [
  { label: '频段压制驱离', value: 'jam_band_expel', deviceAction: '驱离' },
  { label: '导航诱骗驱离', value: 'jam_nav_spoof', deviceAction: '驱离' },
  { label: '全向干扰', value: 'jam_omni', deviceAction: '驱离' },
  { label: '迫降反制', value: 'counter_forced_land', deviceAction: '迫降' },
  { label: '网络断链', value: 'counter_net_cut', deviceAction: '迫降' },
  { label: '精确激光打击', value: 'laser_precision_strike', deviceAction: '激光打击' },
  { label: '跟踪后激光打击', value: 'laser_track_strike', deviceAction: '激光打击' },
  { label: '区域微波覆盖', value: 'hpm_area_cover', deviceAction: '高功率微波' },
  { label: '蜂群集束打击', value: 'hpm_swarm_burst', deviceAction: '高功率微波' }
]

const electroOpticalFunctions: PlanDeviceFunctionOption[] = [
  { label: '光电目标锁定', value: 'eo_track_lock', deviceAction: '跟踪' },
  { label: '连续监测上报', value: 'eo_monitor_report', deviceAction: '跟踪' },
  { label: '声光警示', value: 'alarm_sound_light', deviceAction: '告警' }
]

const linkedFunctions: PlanDeviceFunctionOption[] = [
  { label: '值班广播推送', value: 'alarm_dispatch_notify', deviceAction: '告警' },
  { label: '声光警示', value: 'alarm_sound_light', deviceAction: '告警' },
  { label: '连续监测上报', value: 'eo_monitor_report', deviceAction: '跟踪' }
]

export const planDeviceGroupTypeFunctionMap: Record<string, PlanDeviceFunctionOption[]> = {
  探测组: detectionFunctions,
  反制组: counterFunctions,
  光电协同组: electroOpticalFunctions,
  综合联动组: linkedFunctions
}

export function listFunctionsByDeviceGroupType(
  deviceGroupType: string
): PlanDeviceFunctionOption[] {
  return planDeviceGroupTypeFunctionMap[deviceGroupType] || []
}

export function resolveDeviceFunction(
  deviceGroupType: string,
  functionValue: string
): PlanDeviceFunctionOption | undefined {
  return listFunctionsByDeviceGroupType(deviceGroupType).find((f) => f.value === functionValue)
}

export function functionLabel(deviceGroupType: string, functionValue: string): string {
  return resolveDeviceFunction(deviceGroupType, functionValue)?.label || functionValue
}
