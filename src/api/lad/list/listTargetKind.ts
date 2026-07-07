import type { BlackWhiteListItem, ListType } from './types'

/** 黑白名单模块实际管理的名单类型 */
export type ManagedListType = '黑名单' | '白名单'

/** 黑白名单模块固定目标类型 */
export const COOPERATIVE_DRONE_KIND = '合作式无人机' as const

export const MANAGED_LIST_TYPE_OPTIONS: { label: string; value: ManagedListType }[] = [
  { label: '黑名单', value: '黑名单' },
  { label: '白名单', value: '白名单' }
]

/** 黑白名单列表/表单「目标类型」（不含躁扰信号-飞鸟） */
export type BlackWhiteTargetKind = '黑飞无人机' | '合作式无人机'

/** 查询筛选用，含躁扰信号-飞鸟（名单数据中不会出现该类型） */
export type BlackWhiteTargetKindFilter = BlackWhiteTargetKind | '躁扰信号-飞鸟'

export const BLACK_WHITE_TARGET_KIND_OPTIONS: { label: string; value: BlackWhiteTargetKind }[] = [
  { label: '黑飞无人机', value: '黑飞无人机' },
  { label: '合作式无人机', value: '合作式无人机' }
]

export const BLACK_WHITE_TARGET_KIND_SEARCH_OPTIONS: {
  label: string
  value: BlackWhiteTargetKindFilter
}[] = [
  ...BLACK_WHITE_TARGET_KIND_OPTIONS,
  { label: '躁扰信号-飞鸟', value: '躁扰信号-飞鸟' }
]

export function resolveBlackWhiteTargetKind(sn?: string): BlackWhiteTargetKind {
  const text = sn?.trim()
  if (!text || text === '未解析') return '黑飞无人机'
  return '合作式无人机'
}

export function historyTargetTypeTagType(
  value?: BlackWhiteTargetKind
): 'danger' | 'warning' {
  return value === '黑飞无人机' ? 'danger' : 'warning'
}

/** 列表/详情展示用，兼容旧数据缺字段 */
export function displayBlackWhiteTargetKind(
  row: Pick<BlackWhiteListItem, 'historyTargetType' | 'sn'>
): BlackWhiteTargetKind {
  return row.historyTargetType ?? resolveBlackWhiteTargetKind(row.sn)
}

export function hasResolvableSn(sn?: string): boolean {
  const text = sn?.trim()
  return Boolean(text && text !== '未解析')
}

/** 是否为黑白名单模块可管理的合作式设备（具备识别码且已配置黑/白名单） */
export function isManagedBlackWhiteListItem(
  row: Pick<BlackWhiteListItem, 'historyTargetType' | 'sn' | 'listType'>
): boolean {
  if (!hasResolvableSn(row.sn)) return false
  return row.listType === '黑名单' || row.listType === '白名单'
}

/** 名单模块列表/详情展示：仅黑/白，不展示未知 */
export function displayManagedListType(listType: ListType): ManagedListType {
  return listType === '白名单' ? '白名单' : '黑名单'
}

/** 名单模块识别码展示：不出现「未解析」 */
export function displayResolvableSn(sn?: string): string {
  const text = sn?.trim()
  if (!text || text === '未解析') return '—'
  return text
}

/** 规范化为名单模块可展示/可管理的合作式记录；不可管理则返回 null */
export function enrichManagedBlackWhiteListItem(row: BlackWhiteListItem): BlackWhiteListItem | null {
  if (!isManagedBlackWhiteListItem(row)) return null
  return {
    ...row,
    historyTargetType: COOPERATIVE_DRONE_KIND,
    sn: row.sn.trim(),
    listType: displayManagedListType(row.listType)
  }
}

/** 补齐目标类型及黑飞关联字段（历史同步等场景仍可能产生未知/黑飞数据） */
export function enrichBlackWhiteListItem(row: BlackWhiteListItem): BlackWhiteListItem {
  return normalizeBlackWhiteTargetFields(row) as BlackWhiteListItem
}

/** 表单保存：仅合作式无人机，且必须配置黑/白名单 */
export function normalizeCooperativeBlackWhiteFields<
  T extends {
    historyTargetType?: BlackWhiteTargetKind
    sn?: string
    listType?: ListType
  }
>(row: T): T & { historyTargetType: '合作式无人机'; sn: string; listType: ManagedListType } {
  const sn = row.sn?.trim() || ''
  return {
    ...row,
    historyTargetType: '合作式无人机',
    sn,
    listType: row.listType === '白名单' ? '白名单' : '黑名单'
  }
}

/** 黑飞：识别码未解析、名单类型固定为未知 */
export function normalizeBlackWhiteTargetFields<
  T extends {
    historyTargetType?: BlackWhiteTargetKind
    sn?: string
    listType?: ListType
  }
>(row: T): T & { historyTargetType: BlackWhiteTargetKind; sn: string; listType: ListType } {
  const kind = row.historyTargetType ?? resolveBlackWhiteTargetKind(row.sn)
  if (kind === '黑飞无人机') {
    return {
      ...row,
      historyTargetType: '黑飞无人机',
      sn: '未解析',
      listType: '未知'
    }
  }
  return {
    ...row,
    historyTargetType: '合作式无人机',
    sn: row.sn?.trim() || '未解析',
    listType: row.listType ?? '未知'
  }
}
