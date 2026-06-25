import type { AreaRegion } from '@/api/lad/area'
import type { AreaRegionType } from '@/api/lad/area/types'
import { AREA_REGION_TYPE_OPTIONS, regionTypeLabel } from '../Area/areaConstants'

export interface PlanAreaCascaderOption {
  label: string
  value: string
  children?: PlanAreaCascaderOption[]
}

export function normalizePlanAreaIds(value?: string): string[] {
  if (!value || value === '全部') return []
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ]
}

export function buildPlanAreaCascaderOptions(areas: AreaRegion[]): PlanAreaCascaderOption[] {
  const areaGroups = areas.reduce(
    (acc, item) => {
      ;(acc[item.regionType] ||= []).push(item)
      return acc
    },
    {} as Partial<Record<AreaRegionType, AreaRegion[]>>
  )

  return AREA_REGION_TYPE_OPTIONS.map((option) => {
    const children = (areaGroups[option.value] || [])
      .slice()
      .sort((a, b) => a.siteCode.localeCompare(b.siteCode) || a.name.localeCompare(b.name))
      .map((item) => ({
        label: item.name,
        value: item.id
      }))

    return {
      label: option.label,
      value: option.value,
      children
    }
  }).filter((item) => item.children?.length)
}

export function createPlanAreaLabelMap(areas: AreaRegion[]): Record<string, string> {
  return Object.fromEntries(
    areas.map((item) => [item.id, `${regionTypeLabel(item.regionType)} / ${item.name}`])
  )
}

export function formatPlanAreaLabel(
  value: string | undefined,
  areaLabelMap: Record<string, string>
): string {
  if (!value || value === '全部') return '全部'
  return normalizePlanAreaIds(value)
    .map((id) => areaLabelMap[id] || id)
    .join('、')
}
