import type { HandlingStatus } from './types'

export const HANDLING_STATUS_OPTIONS: Array<{ label: HandlingStatus; value: HandlingStatus }> = [
  { label: '进行中', value: '进行中' },
  { label: '已结束', value: '已结束' }
]

const ENDED_VALUES = new Set(['已结束', '已处置', '已关闭'])

/** 将历史数据中的旧状态归一为「进行中 / 已结束」 */
export function normalizeHandlingStatus(status?: string | null): HandlingStatus {
  if (status && ENDED_VALUES.has(status)) return '已结束'
  return '进行中'
}

export function isHandlingEnded(status?: string | null): boolean {
  return normalizeHandlingStatus(status) === '已结束'
}

export function isHandlingInProgress(status?: string | null): boolean {
  return !isHandlingEnded(status)
}

export function handlingStatusTagType(status?: string | null): 'warning' | 'info' {
  return isHandlingEnded(status) ? 'info' : 'warning'
}
