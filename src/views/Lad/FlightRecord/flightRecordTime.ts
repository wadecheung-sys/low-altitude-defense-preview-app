export function parseDatetimeMs(value: string) {
  const ms = Date.parse(value.replace(/-/g, '/'))
  return Number.isFinite(ms) ? ms : 0
}

export function formatDatetime(ms: number) {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatTimeOnly(ms: number) {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

export function dayBoundsFromDate(date: string) {
  return {
    dayStartMs: parseDatetimeMs(`${date} 00:00:00`),
    dayEndMs: parseDatetimeMs(`${date} 23:59:59`)
  }
}

export function resolveSegmentProgress(startAt: string, endAt: string, currentMs: number) {
  const startMs = parseDatetimeMs(startAt)
  let endMs = parseDatetimeMs(endAt)
  if (endMs <= startMs) {
    endMs = startMs + 60_000
  }
  const ratio = (currentMs - startMs) / (endMs - startMs)
  return Math.max(0, Math.min(100, ratio * 100))
}

export function resolveSegmentBounds(startAt: string, endAt: string, minDurationMs = 60_000) {
  const startMs = parseDatetimeMs(startAt)
  let endMs = parseDatetimeMs(endAt)
  if (endMs <= startMs) {
    endMs = startMs + minDurationMs
  }
  return { startMs, endMs }
}
