const DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 存储规范：`永久` 或 `YYYY-MM-DD HH:mm:ss` */
export function normalizeValidUntil(value: string): string {
  if (!value || value === '永久') return '永久'
  if (DATETIME_RE.test(value)) return value
  if (DATE_RE.test(value)) return `${value} 00:00:00`
  const datePart = value.slice(0, 10)
  if (DATE_RE.test(datePart)) return `${datePart} 00:00:00`
  return value.slice(0, 19)
}

/** 列表/详情展示：永久 或 YYYY-MM-DD HH:mm:ss */
export function formatValidUntilDisplay(value: string): string {
  if (!value || value === '永久') return '永久'
  return normalizeValidUntil(value)
}

export function toValidUntilMs(value: string): number | null {
  if (!value || value === '永久') return null
  const normalized = normalizeValidUntil(value)
  const ms = new Date(normalized.replace(/-/g, '/')).getTime()
  return Number.isFinite(ms) ? ms : null
}

/**
 * 有效时间筛选（精确到秒）：
 * - 仅起：失效时间 ≥ 起（含永久）
 * - 仅止：失效时间 ≤ 止（含永久）
 * - 起止均有：失效落在闭区间 [起, 止]（不含永久）
 */
export function matchValidUntilRange(
  validUntil: string,
  start?: string,
  end?: string
): boolean {
  if (!start && !end) return true

  const isPermanent = validUntil === '永久'

  if (start && !end) {
    if (isPermanent) return true
    const rowMs = toValidUntilMs(validUntil)
    const startMs = toValidUntilMs(start)
    return rowMs !== null && startMs !== null && rowMs >= startMs
  }

  if (!start && end) {
    if (isPermanent) return true
    const rowMs = toValidUntilMs(validUntil)
    const endMs = toValidUntilMs(end)
    return rowMs !== null && endMs !== null && rowMs <= endMs
  }

  if (isPermanent) return false

  const rowMs = toValidUntilMs(validUntil)
  if (rowMs === null) return false

  const startMs = toValidUntilMs(start!)
  if (startMs !== null && rowMs < startMs) return false

  const endMs = toValidUntilMs(end!)
  if (endMs !== null && rowMs > endMs) return false

  return true
}
