import type { IntegrationRunStatus } from '@/api/lad/integration/types'

/** UI copy (keep Chinese here to avoid encoding issues in tsx) */
export const UI = {
  searchLinkCode: '\u7cfb\u7edf\u5bf9\u63a5',
  searchDescription: '\u63cf\u8ff0',
  searchRunStatus: '\u8fd0\u884c\u72b6\u6001',
  searchTimeRange: '\u65f6\u95f4\u8303\u56f4',
  colIndex: '\u5e8f\u53f7',
  colLinkCode: '\u7cfb\u7edf\u5bf9\u63a5',
  colDescription: '\u63cf\u8ff0',
  colRunStatus: '\u8fd0\u884c\u72b6\u6001',
  colHeartbeat: '\u5fc3\u8df3\u6d4b\u8bd5',
  colDataUpdatedAt: '\u6570\u636e\u66f4\u65b0\u65f6\u95f4',
  colAction: '\u64cd\u4f5c',
  btnSearch: '\u67e5\u8be2',
  btnReset: '\u91cd\u7f6e',
  btnView: '\u67e5\u770b',
  btnReconnect: '\u91cd\u8fde',
  btnProbeAll: '\u5168\u91cf\u5fc3\u8df3\u68c0\u6d4b',
  dialogReconnect: '\u91cd\u8fde',
  probeDone: '\u5fc3\u8df3\u68c0\u6d4b\u5b8c\u6210',
  probeAllDone: '\u5168\u91cf\u5fc3\u8df3\u68c0\u6d4b\u5b8c\u6210',
  probeAllPartial: '\u5168\u91cf\u68c0\u6d4b\u5b8c\u6210\uff0c\u5b58\u5728\u5f02\u5e38\u9879',
  dialogTitle: '\u5bf9\u63a5\u76d1\u6d4b\u8be6\u60c5',
  dialogProbe: '\u7acb\u5373\u5fc3\u8df3\u68c0\u6d4b',
  dialogClose: '\u5173\u95ed',
  sectionProbeHistory: '\u6700\u8fd1\u5fc3\u8df3\u8bb0\u5f55',
  placeholderLinkCode: '\u8bf7\u8f93\u5165\u7cfb\u7edf\u5bf9\u63a5\u6807\u8bc6',
  placeholderDescription: '\u8bf7\u8f93\u5165\u63cf\u8ff0\u5173\u952e\u8bcd'
} as const

export const runStatusOptions = [
  { label: '\u5168\u90e8', value: '' },
  { label: '\u8fd0\u884c\u4e2d', value: 'running' },
  { label: '\u5df2\u505c\u6b62', value: 'stopped' },
  { label: '\u5f02\u5e38', value: 'error' },
  { label: '\u672a\u77e5', value: 'unknown' }
]

export const runStatusLabel: Record<IntegrationRunStatus, string> = {
  running: '\u8fd0\u884c\u4e2d',
  stopped: '\u5df2\u505c\u6b62',
  error: '\u5f02\u5e38',
  unknown: '\u672a\u77e5'
}

export const runStatusTagType: Record<
  IntegrationRunStatus,
  'success' | 'warning' | 'danger' | 'info'
> = {
  running: 'success',
  stopped: 'info',
  error: 'danger',
  unknown: 'info'
}
