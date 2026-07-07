import type { AreaRegionType } from '@/api/lad/area/types'
import type { ManualConfirmStatus, VerificationMethod } from '@/api/lad/incident/types'
import type { DictEntryItem } from '@/api/lad/system/types'
import { regionTypeLabel } from '../Area/areaConstants'

export const LAD_DICT_AREA_REGION_TYPE = 'area_region_type'
export const LAD_DICT_THREAT_LEVEL = 'threat_level'
export const LAD_DICT_COUNTERMEASURE_ACTION = 'countermeasure_action'

export function dictEntriesToOptions(entries: DictEntryItem[], withAll = false) {
  const opts = entries.map((e) => ({ label: e.label, value: e.value }))
  if (withAll) return [{ label: '全部', value: '全部' }, ...opts]
  return opts
}

export function dictEntryLabel(entries: DictEntryItem[], value?: string): string {
  if (!value) return ''
  return entries.find((entry) => entry.value === value)?.label || value
}

/** 区域类型展示：优先字典项，回退区域管理内置元数据 */
export function areaRegionTypeDisplay(code: string, entries?: DictEntryItem[]): string {
  if (!code || code === '全部') return '全部'
  const hit = entries?.find((e) => e.value === code)
  if (hit) return hit.label
  try {
    return regionTypeLabel(code as AreaRegionType)
  } catch {
    return code
  }
}

export const THREAT_LEVEL_TAG_TYPE: Record<string, 'danger' | 'warning' | 'success' | 'info' | ''> =
  {
    全部: 'info',
    高危: 'danger',
    中危: 'warning',
    低危: 'success',
    无危: 'info',
    高: 'danger',
    中: 'warning',
    低: 'success',
    无: 'info',
    未知: 'info'
  }

import {
  coerceThreatLevelLabel as coerceThreatLevelLabelFromApi,
  normalizeThreatLevel
} from '@/api/lad/threat/threatLevelUtils'

export { THREAT_LEVEL_OPTIONS } from '@/api/lad/threat/threatLevelUtils'

/** 将字典 value / 旧数据统一为中文威胁等级 */
export function coerceThreatLevelLabel(level?: string): string | undefined {
  return coerceThreatLevelLabelFromApi(level)
}

/** 列表/详情展示用威胁等级文案（兼容旧数据与字典 value） */
export function threatLevelDisplay(level?: string): string {
  if (level === '全部') return '全部'
  return normalizeThreatLevel(level)
}

/** 列表展示：停用规则显示「无危」，启用规则展示存储/迁移后的真实等级 */
export function threatLevelForRule(rule: { threatLevel?: string; enabled?: boolean }): string {
  if (rule.enabled === false) return '无危'
  if (rule.threatLevel === '全部') return '全部'
  return threatLevelDisplay(rule.threatLevel)
}

/** 与黑白名单「名单类型」列一致：Element Plus 浅色小标签（size=small, effect=light） */
export function threatLevelTagType(level?: string): 'danger' | 'warning' | 'success' | 'info' | '' {
  return THREAT_LEVEL_TAG_TYPE[threatLevelDisplay(level)] || 'info'
}

export function threatLevelTagTypeForRule(rule: {
  threatLevel?: string
  enabled?: boolean
}): 'danger' | 'warning' | 'success' | 'info' | '' {
  return threatLevelTagType(threatLevelForRule(rule))
}

export function listTypeTagType(type?: string): 'danger' | 'success' | 'info' {
  if (type === '黑名单') return 'danger'
  if (type === '白名单') return 'success'
  return 'info'
}

export const VERIFICATION_METHOD_OPTIONS: Array<{ label: VerificationMethod; value: VerificationMethod }> =
  [
    { label: '自动识别', value: '自动识别' },
    { label: '人工核查', value: '人工核查' }
  ]

export function verificationMethodOf(status?: ManualConfirmStatus): VerificationMethod {
  return status?.startsWith('人工-') ? '人工核查' : '自动识别'
}

export function verificationMethodTagType(
  method: VerificationMethod
): 'primary' | 'info' {
  return method === '人工核查' ? 'primary' : 'info'
}

/** 反制设备展示：仅保留设备名称，去掉 (自动)/(人工)/(待命) 等后缀 */
export function countermeasureDeviceDisplay(value?: string): string {
  const text = String(value ?? '').trim()
  if (!text || text === '--') return text || '--'
  return text.replace(/\s*\([^)]*\)\s*$/u, '').trim() || text
}

export {
  HANDLING_STATUS_OPTIONS,
  normalizeHandlingStatus as handlingStatusDisplay,
  isHandlingEnded,
  isHandlingInProgress,
  handlingStatusTagType
} from '@/api/lad/incident/handlingStatusUtils'
