export const PLAN_DEFAULT_PRIORITY = 500

export function normalizePlanPriority(value: unknown): number {
  const priority = Number(value)
  if (!Number.isFinite(priority)) return PLAN_DEFAULT_PRIORITY
  return Math.min(999, Math.max(0, Math.trunc(priority)))
}
