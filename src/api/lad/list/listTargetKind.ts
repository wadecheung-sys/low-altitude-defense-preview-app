import type { BlackWhiteListItem, ListType } from './types'

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

/** 补齐目标类型及黑飞关联字段 */
export function enrichBlackWhiteListItem(row: BlackWhiteListItem): BlackWhiteListItem {
  return normalizeBlackWhiteTargetFields(row) as BlackWhiteListItem
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
