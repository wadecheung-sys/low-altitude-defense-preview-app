/** 原型默认值；真实设备接入时应按设备安全要求配置。 */
export const PLAN_DEFAULT_MAX_DISPOSAL_SECONDS = 30

export const PLAN_MAX_DISPOSAL_VALIDATION_MESSAGE = '单次最大处置时长须为大于 0 的整数秒'

export function isValidMaxDisposalSeconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

/** 兼容尚未配置安全时长的旧预案；保存时须另行严格校验。 */
export function normalizeMaxDisposalSeconds(value: unknown): number {
  return isValidMaxDisposalSeconds(value) ? value : PLAN_DEFAULT_MAX_DISPOSAL_SECONDS
}

export function formatMaxDisposalDetail(seconds: number): string {
  return `自反制设备的反制功能开启起，单次最多持续 ${seconds} 秒；到时若仍未关闭，自动关闭反制功能。提前关闭则本次计时结束，自动处置与人工值守均适用。`
}
