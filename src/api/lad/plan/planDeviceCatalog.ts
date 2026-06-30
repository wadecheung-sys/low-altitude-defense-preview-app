/** 预案设备组动作目录；反制组动作来自字典 countermeasure_action */

import type { DictEntryItem } from '@/api/lad/system/types'
import { queryDictEntriesByCode } from '@/api/lad/system/dictStore'

export const COUNTERMEASURE_ACTION_DICT_CODE = 'countermeasure_action'

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

const planDeviceGroupTypeFunctionMap: Record<string, PlanDeviceFunctionOption[]> = {
  探测组: detectionFunctions,
  光电协同组: electroOpticalFunctions,
  综合联动组: linkedFunctions
}

const legacyCountermeasureLabels: Record<string, string> = {
  hpm_suppression: '微波打击',
  forced_landing: '迫降',
  link_disruption: '链路阻断',
  protocol_takeover: '协议接管'
}

export function dictEntriesToPlanFunctionOptions(
  entries: DictEntryItem[]
): PlanDeviceFunctionOption[] {
  return entries.map((entry) => ({
    label: entry.label,
    value: entry.value,
    deviceAction: entry.label
  }))
}

export function listCountermeasureActions(
  countermeasureEntries?: DictEntryItem[]
): PlanDeviceFunctionOption[] {
  const entries = countermeasureEntries?.length
    ? countermeasureEntries
    : queryDictEntriesByCode(COUNTERMEASURE_ACTION_DICT_CODE)
  return dictEntriesToPlanFunctionOptions(entries)
}

export function listFunctionsByDeviceGroupType(
  deviceGroupType: string,
  countermeasureEntries?: DictEntryItem[]
): PlanDeviceFunctionOption[] {
  if (deviceGroupType === '反制组') {
    return listCountermeasureActions(countermeasureEntries)
  }
  return planDeviceGroupTypeFunctionMap[deviceGroupType] || []
}

export function resolveCountermeasureFunction(
  functionValue: string,
  countermeasureEntries?: DictEntryItem[]
): PlanDeviceFunctionOption | undefined {
  return listCountermeasureActions(countermeasureEntries).find((item) => item.value === functionValue)
}

export function resolveDeviceFunction(
  deviceGroupType: string,
  functionValue: string,
  countermeasureEntries?: DictEntryItem[]
): PlanDeviceFunctionOption | undefined {
  const counterHit = resolveCountermeasureFunction(functionValue, countermeasureEntries)
  if (counterHit) return counterHit
  if (deviceGroupType === '反制组') {
    return undefined
  }
  return listFunctionsByDeviceGroupType(deviceGroupType, countermeasureEntries).find(
    (f) => f.value === functionValue
  )
}

export function countermeasureActionLabel(functionValue: string): string {
  const hit = queryDictEntriesByCode(COUNTERMEASURE_ACTION_DICT_CODE).find(
    (entry) => entry.value === functionValue
  )
  if (hit) return hit.label
  return legacyCountermeasureLabels[functionValue] || functionValue
}

export function functionLabel(_deviceGroupType: string, functionValue: string): string {
  return countermeasureActionLabel(functionValue)
}
