import type { FormSchema } from '@/components/Form'

/**
 * inline 表单项 min-width 约 229.5px（见 Form.vue），常规宽度下一行约容纳 4 个筛选项。
 * 用作「超过一行需展开/折叠」的默认判定阈值。
 */
export const SEARCH_INLINE_FIELDS_PER_ROW = 4

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
