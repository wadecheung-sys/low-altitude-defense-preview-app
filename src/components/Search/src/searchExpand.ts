import type { FormSchema } from '@/components/Form'

/**
 * inline 筛选项默认首行展示数量。
 * 筛选项超过该数量（即 4 个及以上）时自动启用展开/折叠，从第 4 项起默认收起。
 */
export const SEARCH_INLINE_FIELDS_PER_ROW = 3

export function getVisibleSearchFields(schema: FormSchema[]): FormSchema[] {
  return schema.filter((item) => item.field !== 'action' && !item.hidden)
}

export function resolveSearchExpand(options: {
  schema: FormSchema[]
  showExpand?: boolean
  expandField?: string
  autoExpand?: boolean
}): { showExpand: boolean; expandField: string } {
  const { schema, showExpand = false, expandField = '', autoExpand = true } = options
  const visibleFields = getVisibleSearchFields(schema)
  const exceedsOneRow = visibleFields.length > SEARCH_INLINE_FIELDS_PER_ROW
  const needsAutoExpand = autoExpand && exceedsOneRow
  const resolvedShowExpand = showExpand || needsAutoExpand
  const resolvedExpandField =
    expandField ||
    (needsAutoExpand ? (visibleFields[SEARCH_INLINE_FIELDS_PER_ROW]?.field ?? '') : '')

  return { showExpand: resolvedShowExpand, expandField: resolvedExpandField }
}
