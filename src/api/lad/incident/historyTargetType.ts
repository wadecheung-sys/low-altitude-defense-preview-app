import type { HistoryTargetType } from './types'

export const HISTORY_TARGET_TYPE_OPTIONS: { label: string; value: HistoryTargetType }[] = [
  { label: '黑飞无人机', value: '黑飞无人机' },
  { label: '合作式无人机', value: '合作式无人机' },
  { label: '躁扰信号-飞鸟', value: '躁扰信号-飞鸟' }
]

/** 演示用躁扰飞鸟样本：列表第 8 条（he-10008） */
export const BIRD_NUISANCE_DEMO_EVENT_ID = 'he-10008'

/** 根据识别码与核查状态推断目标类型（不含目标结果关键词，避免误判） */
export function resolveHistoryTargetType(input: {
  historyTargetType?: HistoryTargetType
  uavSn: string
  manualConfirmStatus: string
}): HistoryTargetType {
  if (input.historyTargetType) return input.historyTargetType
  if (
    input.manualConfirmStatus === '躁扰告警' ||
    input.manualConfirmStatus === '人工-躁扰告警'
  ) {
    return '躁扰信号-飞鸟'
  }
  if (input.uavSn === '未解析') {
    return '黑飞无人机'
  }
  return '合作式无人机'
}

export function historyTargetTypeTagType(
  value: HistoryTargetType
): 'danger' | 'warning' | 'info' {
  const map: Record<HistoryTargetType, 'danger' | 'warning' | 'info'> = {
    黑飞无人机: 'danger',
    合作式无人机: 'warning',
    '躁扰信号-飞鸟': 'info'
  }
  return map[value]
}
