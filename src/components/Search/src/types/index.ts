import { FormSchema } from '@/components/Form'

export interface SearchProps {
  schema?: FormSchema[]
  isCol?: boolean
  labelWidth?: string | number
  layout?: 'inline' | 'bottom'
  buttonPosition?: 'left' | 'right' | 'center'
  showSearch?: boolean
  showReset?: boolean
  showExpand?: boolean
  expandField?: string
  /** WEB 端超过该行数的筛选项时自动折叠（与 is-col 联用）；0 表示仅按 expandField */
  expandRows?: number
  expandDefault?: boolean
  inline?: boolean
  removeNoValueItem?: boolean
  model?: Recordable
  searchLoading?: boolean
  resetLoading?: boolean
}
