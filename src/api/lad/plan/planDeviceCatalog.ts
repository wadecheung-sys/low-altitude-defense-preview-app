/** 预案反制动作目录：按设备组类型约束可选动作 */

export interface PlanDeviceFunctionOption {
  label: string
  value: string
  deviceAction: string
}

const detectionFunctions: PlanDeviceFunctionOption[] = [
  { label: '雷达持续跟踪', value: 'radar_track', deviceAction: '持续跟踪' },
  { label: '多源融合上报', value: 'fusion_monitor_report', deviceAction: '融合上报' },
  { label: '目标轨迹锁定', value: 'track_lock', deviceAction: '目标锁定' }
]

const counterFunctions: PlanDeviceFunctionOption[] = [
  { label: '无线电干扰', value: 'radio_jamming', deviceAction: '无线电干扰' },
  { label: '导航诱骗', value: 'navigation_spoofing', deviceAction: '导航诱骗' },
  { label: '协议接管', value: 'protocol_takeover', deviceAction: '协议接管' },
  { label: '链路阻断', value: 'link_disruption', deviceAction: '链路阻断' },
  { label: '迫降处置', value: 'forced_landing', deviceAction: '迫降' },
  { label: '激光打击', value: 'laser_strike', deviceAction: '激光打击' },
  { label: '高功率微波压制', value: 'hpm_suppression', deviceAction: '高功率微波压制' },
  { label: '声光驱离', value: 'sound_light_expulsion', deviceAction: '声光驱离' }
]

const electroOpticalFunctions: PlanDeviceFunctionOption[] = [
  { label: '光电目标锁定', value: 'eo_track_lock', deviceAction: '目标锁定' },
  { label: '视频取证跟踪', value: 'eo_evidence_tracking', deviceAction: '取证跟踪' },
  { label: '声光警示', value: 'alarm_sound_light', deviceAction: '声光警示' }
]

const linkedFunctions: PlanDeviceFunctionOption[] = [
  { label: '预警广播', value: 'alarm_dispatch_notify', deviceAction: '预警广播' },
  { label: '声光警示', value: 'alarm_sound_light', deviceAction: '声光警示' },
  { label: '联动上报', value: 'linked_report', deviceAction: '联动上报' }
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
