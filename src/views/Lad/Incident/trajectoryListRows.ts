import type { HistoryEventDetail, TrajectoryPoint } from '@/api/lad/incident/types'

export interface TrajectoryListRow {
  seq: number
  targetId: string
  time: string
  altitude: number
  longitude: string
  latitude: string
  distance: number
  speed: number
  azimuth: number
  pitch: number
}

export type TrajectorySnapshot = Omit<TrajectoryListRow, 'seq'>

const LNG_BASE = 113.39
const LAT_BASE = 23.09
const LNG_SCALE = 0.05
const LAT_SCALE = 0.04
const METER_PER_X = LNG_SCALE * 102_000
const METER_PER_Y = LAT_SCALE * 111_000

function formatDateTime(ms: number) {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function normalizeAzimuth(value: number) {
  return Math.round(((value % 360) + 360) % 360)
}

function resolveDurationMs(discoveredAt: string, endedAt: string) {
  const beginMs = Date.parse(discoveredAt.replace(/-/g, '/'))
  const endMs = Date.parse(endedAt.replace(/-/g, '/'))
  if (Number.isFinite(beginMs) && Number.isFinite(endMs) && endMs > beginMs) {
    return { beginMs, durationMs: endMs - beginMs }
  }
  return { beginMs: beginMs || 0, durationMs: 0 }
}

export function sampleTrajectoryAtProgress(trajectory: TrajectoryPoint[], pct: number): TrajectoryPoint {
  if (!trajectory.length) {
    return { progress: pct, x: 0.5, y: 0.5, altitude: 0 }
  }
  if (pct <= trajectory[0].progress) return { ...trajectory[0], progress: pct }
  for (let i = 1; i < trajectory.length; i++) {
    if (pct <= trajectory[i].progress) {
      const a = trajectory[i - 1]
      const b = trajectory[i]
      const ratio = (pct - a.progress) / (b.progress - a.progress || 1)
      return {
        progress: pct,
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
        altitude: Math.round(a.altitude + (b.altitude - a.altitude) * ratio)
      }
    }
  }
  return { ...trajectory[trajectory.length - 1], progress: pct }
}

function previousTrajectorySample(trajectory: TrajectoryPoint[], pct: number): TrajectoryPoint {
  if (!trajectory.length) return sampleTrajectoryAtProgress(trajectory, pct)
  const index = Math.max(0, trajectory.findIndex((item) => item.progress >= pct))
  return trajectory[Math.max(0, index - 1)] || sampleTrajectoryAtProgress(trajectory, pct)
}

function buildSnapshotFromSample(
  detail: HistoryEventDetail,
  sample: TrajectoryPoint,
  prev: TrajectoryPoint,
  stepSec: number
): TrajectorySnapshot {
  const { targetId, discoveredAt, endedAt, devicePos } = detail
  const { beginMs, durationMs } = resolveDurationMs(discoveredAt, endedAt)
  const longitude = LNG_BASE + sample.x * LNG_SCALE
  const latitude = LAT_BASE + sample.y * LAT_SCALE

  const moveX = (sample.x - prev.x) * METER_PER_X
  const moveY = (sample.y - prev.y) * METER_PER_Y
  const horizontalMove = Math.sqrt(moveX * moveX + moveY * moveY)
  const speed =
    sample.progress <= 0 ? 0 : Math.round((horizontalMove / stepSec) * 10) / 10

  const toDeviceX = (sample.x - devicePos.x) * METER_PER_X
  const toDeviceY = (sample.y - devicePos.y) * METER_PER_Y
  const horizontalDist = Math.sqrt(toDeviceX * toDeviceX + toDeviceY * toDeviceY)
  const distance = Math.round(horizontalDist)
  const azimuth = normalizeAzimuth((Math.atan2(toDeviceX, -toDeviceY) * 180) / Math.PI)
  const pitch = Math.round((Math.atan2(sample.altitude, horizontalDist || 1) * 180) / Math.PI)
  const timeMs = durationMs > 0 ? beginMs + durationMs * (sample.progress / 100) : beginMs

  return {
    targetId,
    time: formatDateTime(timeMs),
    altitude: sample.altitude,
    longitude: longitude.toFixed(4),
    latitude: latitude.toFixed(4),
    distance,
    speed,
    azimuth,
    pitch
  }
}

export function getTrajectorySnapshotAtProgress(
  detail: HistoryEventDetail,
  progressPct: number
): TrajectorySnapshot | null {
  const { trajectory, discoveredAt, endedAt } = detail
  if (!trajectory.length) return null

  const { durationMs } = resolveDurationMs(discoveredAt, endedAt)
  const stepSec = durationMs > 0 ? durationMs / Math.max(trajectory.length - 1, 1) / 1000 : 1
  const sample = sampleTrajectoryAtProgress(trajectory, progressPct)
  const prev = previousTrajectorySample(trajectory, progressPct)

  return buildSnapshotFromSample(detail, sample, prev, stepSec)
}

export function buildTrajectoryListRows(detail: HistoryEventDetail): TrajectoryListRow[] {
  const { trajectory, discoveredAt, endedAt } = detail
  if (!trajectory.length) return []

  const { durationMs } = resolveDurationMs(discoveredAt, endedAt)
  const stepSec = durationMs > 0 ? durationMs / Math.max(trajectory.length - 1, 1) / 1000 : 1

  return trajectory.map((point, index) => {
    const prev = trajectory[Math.max(0, index - 1)]
    const snapshot = buildSnapshotFromSample(
      detail,
      { ...point, progress: point.progress <= 0 ? 0 : point.progress },
      prev,
      stepSec
    )
    return {
      seq: index + 1,
      ...snapshot,
      speed: index === 0 ? 0 : snapshot.speed
    }
  })
}
