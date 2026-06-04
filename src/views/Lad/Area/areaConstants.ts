import type { AreaRegionType } from '@/api/lad/area/types'

export interface AreaRegionTypeMeta {
  label: string
  defaultClipPriority: number
  defaultColor: string
  defaultAlarm: boolean
  tagType: 'danger' | 'warning' | 'success' | 'info' | ''
}

export const AREA_REGION_TYPE_META: Record<AreaRegionType, AreaRegionTypeMeta> = {
  warning: {
    label: '预警区',
    defaultClipPriority: 30,
    defaultColor: 'rgba(103, 194, 58, 0.45)',
    defaultAlarm: true,
    tagType: 'success'
  },
  alert: {
    label: '警戒区',
    defaultClipPriority: 50,
    defaultColor: 'rgba(230, 162, 60, 0.45)',
    defaultAlarm: true,
    tagType: 'warning'
  },
  dispose: {
    label: '识别处置区',
    defaultClipPriority: 70,
    defaultColor: 'rgba(64, 158, 255, 0.42)',
    defaultAlarm: true,
    tagType: 'info'
  },
  nofly: {
    label: '禁飞区',
    defaultClipPriority: 80,
    defaultColor: 'rgba(245, 108, 108, 0.5)',
    defaultAlarm: true,
    tagType: 'danger'
  },
  mask: {
    label: '报警屏蔽区',
    defaultClipPriority: 20,
    defaultColor: 'rgba(144, 147, 153, 0.4)',
    defaultAlarm: false,
    tagType: 'info'
  },
  nuclear: {
    label: '核岛',
    defaultClipPriority: 90,
    defaultColor: 'rgba(245, 108, 108, 0.62)',
    defaultAlarm: true,
    tagType: 'danger'
  },
  pool: {
    label: '乏燃料水池',
    defaultClipPriority: 85,
    defaultColor: 'rgba(230, 162, 60, 0.55)',
    defaultAlarm: true,
    tagType: 'warning'
  },
  testflight: {
    label: '试飞区',
    defaultClipPriority: 15,
    defaultColor: 'rgba(144, 147, 153, 0.38)',
    defaultAlarm: false,
    tagType: ''
  },
  other: {
    label: '其他',
    defaultClipPriority: 40,
    defaultColor: 'rgba(103, 194, 58, 0.35)',
    defaultAlarm: true,
    tagType: ''
  }
}

export const AREA_REGION_TYPE_OPTIONS = (
  Object.entries(AREA_REGION_TYPE_META) as [AreaRegionType, AreaRegionTypeMeta][]
).map(([value, meta]) => ({
  label: meta.label,
  value
}))

export const AREA_SEARCH_COL = { span: 6 } as const

export const CLIP_PRIORITY_MIN = 1
export const CLIP_PRIORITY_MAX = 99

export function defaultColorForType(type: AreaRegionType): string {
  return AREA_REGION_TYPE_META[type].defaultColor
}

export function defaultClipPriorityForType(type: AreaRegionType): number {
  return AREA_REGION_TYPE_META[type].defaultClipPriority
}

export function defaultAlarmForType(type: AreaRegionType): boolean {
  return AREA_REGION_TYPE_META[type].defaultAlarm
}

export function regionTypeLabel(type: AreaRegionType): string {
  return AREA_REGION_TYPE_META[type]?.label ?? type
}
