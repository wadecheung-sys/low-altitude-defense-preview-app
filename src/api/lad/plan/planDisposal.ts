import type { PlanDisposalMode, PlanStrategy } from './types'

/** 自动处置：窗口内值班员可执行或跳过，超时自动执行 */
export type { PlanDisposalMode }

export const PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS = 10

/** 默认走人员值守的示例预案（高危反制须人工确认） */
const SEED_MANUAL_PLAN_IDS = new Set(['plan-002', 'plan-004', 'plan-011'])

export const planDisposalModeOptions: {
  label: string
  value: PlanDisposalMode
  desc: string
}[] = [
  {
    label: '自动处置',
    value: 'auto',
    desc: '命中后设备可按策略自动动作；可配置人工响应时间，窗口内可选择执行或暂不执行，超时自动执行'
  },
  {
    label: '人员值守',
    value: 'manual',
    desc: '命中后仅推送告警与处置建议，反制操作须值班员人工确认后才会下发'
  }
]

export function inferSeedDisposalMode(planId: string): PlanDisposalMode {
  return SEED_MANUAL_PLAN_IDS.has(planId) ? 'manual' : 'auto'
}

export function normalizePlanDisposal(
  plan: Pick<PlanStrategy, 'id' | 'disposalMode' | 'manualResponseSeconds'>
): Pick<PlanStrategy, 'disposalMode' | 'manualResponseSeconds' | 'disposalModeLabel'> {
  const disposalMode =
    plan.disposalMode === 'manual' || plan.disposalMode === 'auto'
      ? plan.disposalMode
      : inferSeedDisposalMode(plan.id)

  let manualResponseSeconds = Number(plan.manualResponseSeconds)
  if (disposalMode === 'manual') {
    manualResponseSeconds = 0
  } else if (!Number.isFinite(manualResponseSeconds) || manualResponseSeconds < 0) {
    manualResponseSeconds = PLAN_DEFAULT_MANUAL_RESPONSE_SECONDS
  }

  return {
    disposalMode,
    manualResponseSeconds,
    disposalModeLabel: formatDisposalModeLabel(disposalMode, manualResponseSeconds)
  }
}

export function formatDisposalModeLabel(
  mode: PlanDisposalMode,
  manualResponseSeconds = 0
): string {
  if (mode === 'manual') return '人员值守'
  if (manualResponseSeconds > 0) {
    return `自动处置 · ${manualResponseSeconds}s响应窗`
  }
  return '自动处置 · 立即执行'
}

export function formatDisposalModeDetail(
  mode: PlanDisposalMode,
  manualResponseSeconds = 0
): string {
  if (mode === 'manual') {
    return '人员值守：反制指令不会自动下发，须值班员在指挥平台人工确认后执行'
  }
  if (manualResponseSeconds > 0) {
    return `自动处置：触发后进入 ${manualResponseSeconds} 秒人工响应窗口，值班员可「立即执行」或「暂不执行」；超时未操作则按策略自动执行`
  }
  return '自动处置：触发后立即按策略执行'
}

export function planRequiresManualConfirm(plan: Pick<PlanStrategy, 'disposalMode'>): boolean {
  return plan.disposalMode === 'manual'
}

/** 威胁评估 / 模拟结果中的处置模式说明 */
export function formatDisposalExecNote(
  plan: Pick<PlanStrategy, 'disposalMode' | 'manualResponseSeconds'>
): string {
  if (plan.disposalMode === 'manual') {
    return '人员值守：反制须值班员人工确认，不会自动下发'
  }
  if (plan.manualResponseSeconds > 0) {
    return `自动处置：${plan.manualResponseSeconds} 秒响应窗内可执行或暂不执行，超时自动执行`
  }
  return '自动处置：触发后立即按策略执行'
}
