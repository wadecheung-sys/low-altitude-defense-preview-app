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
  /** 是否默认展开筛选项；false = 默认收起（本项目列表页约定） */
  expandDefault?: boolean
  /** 超过一行（默认 >4 个筛选项）时自动启用展开/折叠 */
  autoExpand?: boolean
  inline?: boolean
  removeNoValueItem?: boolean
  model?: Recordable
  searchLoading?: boolean
  resetLoading?: boolean
}
