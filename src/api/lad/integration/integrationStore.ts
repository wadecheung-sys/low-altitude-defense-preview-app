import type {
  IntegrationDetailResult,
  IntegrationEndpoint,
  IntegrationListResult,
  IntegrationProbeRecord,
  IntegrationQuery,
  IntegrationReconnectResult,
  IntegrationRunStatus,
  IntegrationSummary
} from './types'

/** 演示：重连必定失败，用于模拟通讯异常 */
const RECONNECT_BLOCKED_CODES = ['JAMMER_CTRL', 'WL_SYNC_GA']

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function formatDisplayTime(iso: string) {
  return iso.replace(/-/g, '.').replace(' ', ' ')
}

const seed: IntegrationEndpoint[] = [
  {
    id: 'int-001',
    linkCode: 'SYS_API',
    description: '\u6570\u636e\u4ea4\u6362\u4e3b\u901a\u9053',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (42ms)',
    dataUpdatedAt: '2026-05-20 11:00:00',
    baseUrl: 'http://192.168.10.21:8080/api/v1/exchange',
    protocol: 'HTTP',
    enabled: true,
    latencyMs: 42,
    successRate: 99.2,
    lastCheckAt: '2026-05-20 11:00:00',
    requestCount24h: 8640,
    failCount24h: 69
  },
  {
    id: 'int-002',
    linkCode: 'algorithm_API',
    description: '\u5a01\u80f1\u8bc4\u4f30\u4e0e\u822a\u8ff9\u9884\u6d4b\u7b97\u6cd5\u670d\u52a1',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (55ms)',
    dataUpdatedAt: '2026-05-20 11:00:00',
    baseUrl: 'http://192.168.20.11:7002/threat/ping',
    protocol: 'HTTP',
    enabled: true,
    latencyMs: 55,
    successRate: 99.5,
    lastCheckAt: '2026-05-20 11:00:00',
    requestCount24h: 5760,
    failCount24h: 29
  },
  {
    id: 'int-003',
    linkCode: 'RADAR_GW',
    description: '\u6beb\u7c73\u6ce2\u96f7\u8fbe\u63a5\u5165\u4e0e\u9065\u6d4b\u6570\u636e\u4e0a\u62a5',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (38ms)',
    dataUpdatedAt: '2026-05-20 10:58:30',
    baseUrl: 'http://192.168.10.21:8080/api/v1/telemetry',
    protocol: 'HTTP',
    enabled: true,
    latencyMs: 38,
    successRate: 99.1,
    lastCheckAt: '2026-05-20 10:58:30',
    requestCount24h: 8640,
    failCount24h: 78
  },
  {
    id: 'int-004',
    linkCode: 'RF_DETECT',
    description: '\u65e0\u7ebf\u7535\u4fa6\u6d4b\u5e73\u53f0\u6570\u636e\u5e27\u63a5\u6536',
    runStatus: 'error',
    heartbeatText: '\u5f02\u5e38 (\u8d85\u65f6 320ms)',
    dataUpdatedAt: '2026-05-20 10:55:00',
    baseUrl: 'mqtt://192.168.10.23:1883/rf/frames',
    protocol: 'MQTT',
    enabled: true,
    latencyMs: 320,
    successRate: 91.3,
    lastCheckAt: '2026-05-20 10:55:00',
    lastError: '\u5fc3\u8df3\u8d85\u65f6 > 3000ms',
    requestCount24h: 12000,
    failCount24h: 1044
  },
  {
    id: 'int-005',
    linkCode: 'EO_TRACK',
    description: '\u5149\u7535\u8ddf\u8e2a\u4e0e\u76ee\u6807\u89c6\u9891\u6d41\u5bf9\u63a5',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (68ms)',
    dataUpdatedAt: '2026-05-20 10:59:12',
    baseUrl: 'https://192.168.10.22:8443/eo/status',
    protocol: 'HTTPS',
    enabled: true,
    latencyMs: 68,
    successRate: 98.5,
    lastCheckAt: '2026-05-20 10:59:12',
    requestCount24h: 4320,
    failCount24h: 65
  },
  {
    id: 'int-006',
    linkCode: 'JAMMER_CTRL',
    description: '\u53cd\u5236\u8bbe\u5907\u6307\u4ee4\u4e0b\u53d1\u4e0e\u72b6\u6001\u56de\u4f20',
    runStatus: 'stopped',
    heartbeatText: '\u79bb\u7ebf',
    dataUpdatedAt: '2026-05-20 09:12:40',
    baseUrl: 'tcp://192.168.10.24:9001/cmd',
    protocol: 'TCP',
    enabled: true,
    latencyMs: null,
    successRate: 0,
    lastCheckAt: '2026-05-20 11:00:00',
    lastError: 'ECONNREFUSED',
    requestCount24h: 480,
    failCount24h: 480
  },
  {
    id: 'int-007',
    linkCode: 'FUSION_EDGE',
    description: '\u591a\u6e90\u63a2\u6d4b\u878d\u5408\u4e0e\u7efc\u5408\u7a7a\u60c5\u751f\u6210',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (48ms)',
    dataUpdatedAt: '2026-05-20 11:00:00',
    baseUrl: 'http://192.168.20.10:7001/fusion/health',
    protocol: 'HTTP',
    enabled: true,
    latencyMs: 48,
    successRate: 99.8,
    lastCheckAt: '2026-05-20 11:00:00',
    requestCount24h: 2880,
    failCount24h: 6
  },
  {
    id: 'int-008',
    linkCode: 'TIME_SYNC',
    description: '\u6388\u65f6\u7cfb\u7edf NTP \u540c\u6b65',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (12ms)',
    dataUpdatedAt: '2026-05-20 11:00:00',
    baseUrl: 'ntp://10.0.0.5:123',
    protocol: 'TCP',
    enabled: true,
    latencyMs: 12,
    successRate: 100,
    lastCheckAt: '2026-05-20 11:00:00',
    requestCount24h: 1440,
    failCount24h: 0
  },
  {
    id: 'int-009',
    linkCode: 'PPS_INTEGRATION',
    description: '\u5b9e\u7269\u4fdd\u62a4\u96c6\u6210\u7ba1\u7406\u5e73\u53f0\u544a\u8b66\u8ba2\u9605',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (95ms)',
    dataUpdatedAt: '2026-05-20 10:58:00',
    baseUrl: 'https://10.0.1.20/api/v2/alarm/subscribe',
    protocol: 'HTTPS',
    enabled: true,
    latencyMs: 95,
    successRate: 97.8,
    lastCheckAt: '2026-05-20 10:58:00',
    requestCount24h: 960,
    failCount24h: 21
  },
  {
    id: 'int-010',
    linkCode: 'WL_SYNC_GA',
    description: '\u516c\u5b89\u90e8\u767d\u540d\u5355\u540c\u6b65\u63a5\u53e3',
    runStatus: 'stopped',
    heartbeatText: '\u79bb\u7ebf (503)',
    dataUpdatedAt: '2026-05-20 06:30:00',
    baseUrl: 'https://whitelist.example.gov/sync/pull',
    protocol: 'HTTPS',
    enabled: true,
    latencyMs: null,
    successRate: 62.1,
    lastCheckAt: '2026-05-20 11:00:00',
    lastError: 'HTTP 503',
    requestCount24h: 24,
    failCount24h: 9
  },
  {
    id: 'int-011',
    linkCode: 'SITUATION_HUB',
    description: '\u6001\u52bf\u6570\u636e\u4e2d\u53f0\u63a5\u6536\u4e0e\u4e0b\u53d1',
    runStatus: 'running',
    heartbeatText: '\u6b63\u5e38 (76ms)',
    dataUpdatedAt: '2026-05-20 11:00:00',
    baseUrl: 'http://10.0.2.30:9200/api/situation/ingest',
    protocol: 'HTTP',
    enabled: true,
    latencyMs: 76,
    successRate: 98.9,
    lastCheckAt: '2026-05-20 11:00:00',
    requestCount24h: 17280,
    failCount24h: 190
  },
  {
    id: 'int-012',
    linkCode: 'VIDEO_AI',
    description: '\u89c6\u9891\u667a\u80fd\u5206\u6790\u670d\u52a1',
    runStatus: 'unknown',
    heartbeatText: '-',
    dataUpdatedAt: '2026-05-19 18:00:00',
    baseUrl: 'http://192.168.20.13:7004/ai/ready',
    protocol: 'HTTP',
    enabled: false,
    latencyMs: null,
    successRate: 0,
    lastCheckAt: '2026-05-19 18:00:00',
    requestCount24h: 0,
    failCount24h: 0
  }
]

let endpoints: IntegrationEndpoint[] = seed.map((e) => ({ ...e }))
let probeHistory: IntegrationProbeRecord[] = []
let lastPollAt = formatNow()

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function statusFromProbe(success: boolean, latencyMs: number, enabled: boolean): IntegrationRunStatus {
  if (!enabled) return 'unknown'
  if (!success) return 'stopped'
  if (latencyMs > 200) return 'error'
  return 'running'
}

function heartbeatFromProbe(success: boolean, latencyMs: number, enabled: boolean): string {
  if (!enabled) return '-'
  if (!success) return '\u79bb\u7ebf'
  if (latencyMs > 200) return `\u5f02\u5e38 (\u8d85\u65f6 ${latencyMs}ms)`
  return `\u6b63\u5e38 (${latencyMs}ms)`
}

function simulateProbe(endpoint: IntegrationEndpoint): IntegrationProbeRecord {
  const now = formatNow()
  if (!endpoint.enabled) {
    return {
      id: `probe-${Date.now()}-${randInt(1000, 9999)}`,
      endpointId: endpoint.id,
      checkedAt: now,
      success: false,
      latencyMs: 0,
      message: '\u5df2\u505c\u7528\u76d1\u6d4b'
    }
  }

  let success = true
  let latencyMs = randInt(25, 120)
  let message = '\u6570\u636e\u4ea4\u4e92\u6b63\u5e38'

  if (endpoint.runStatus === 'stopped' || endpoint.linkCode === 'JAMMER_CTRL') {
    success = Math.random() > 0.85
    if (!success) {
      latencyMs = 0
      message = 'ECONNREFUSED'
    }
  } else if (endpoint.runStatus === 'error' || endpoint.linkCode === 'RF_DETECT') {
    success = Math.random() > 0.3
    latencyMs = success ? randInt(180, 450) : randInt(3000, 5000)
    message = success ? '\u54cd\u5e94\u5ef6\u8fdf\u504f\u9ad8' : '\u5fc3\u8df3\u8d85\u65f6'
  }

  const idx = endpoints.findIndex((e) => e.id === endpoint.id)
  if (idx >= 0) {
    const row = { ...endpoints[idx] }
    row.lastCheckAt = now
    row.dataUpdatedAt = now
    row.latencyMs = success ? latencyMs : null
    row.runStatus = statusFromProbe(success, latencyMs, row.enabled)
    row.heartbeatText = heartbeatFromProbe(success, latencyMs, row.enabled)
    if (!success) row.lastError = message
    else row.lastError = undefined
    row.requestCount24h += 1
    if (!success) row.failCount24h += 1
    const total = row.requestCount24h
    row.successRate = Math.round(((total - row.failCount24h) / total) * 1000) / 10
    endpoints[idx] = row
  }

  return {
    id: `probe-${Date.now()}-${randInt(1000, 9999)}`,
    endpointId: endpoint.id,
    checkedAt: now,
    success,
    latencyMs,
    message,
    samplePayload: success ? '{"code":0,"data":{"status":"ok"}}' : undefined
  }
}

function filterList(q: IntegrationQuery): IntegrationEndpoint[] {
  let rows = [...endpoints]
  if (q.linkCode?.trim()) {
    const kw = q.linkCode.trim().toLowerCase()
    rows = rows.filter((r) => r.linkCode.toLowerCase().includes(kw))
  }
  if (q.description?.trim()) {
    const kw = q.description.trim().toLowerCase()
    rows = rows.filter((r) => r.description.toLowerCase().includes(kw))
  }
  if (q.runStatus) rows = rows.filter((r) => r.runStatus === q.runStatus)
  if (q.dataUpdatedAtStart) rows = rows.filter((r) => r.dataUpdatedAt >= q.dataUpdatedAtStart!)
  if (q.dataUpdatedAtEnd) rows = rows.filter((r) => r.dataUpdatedAt <= q.dataUpdatedAtEnd!)
  return rows
}

export function queryIntegrationList(q: IntegrationQuery): IntegrationListResult {
  const pageIndex = Number(q.pageIndex) || 1
  const pageSize = Number(q.pageSize) || 10
  const filtered = filterList(q)
  const start = (pageIndex - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize).map((r) => ({
      ...r,
      dataUpdatedAt: formatDisplayTime(r.dataUpdatedAt)
    })),
    total: filtered.length
  }
}

export function getIntegrationSummary(): IntegrationSummary {
  return {
    total: endpoints.length,
    running: endpoints.filter((e) => e.runStatus === 'running').length,
    error: endpoints.filter((e) => e.runStatus === 'error').length,
    stopped: endpoints.filter((e) => e.runStatus === 'stopped').length,
    unknown: endpoints.filter((e) => e.runStatus === 'unknown').length,
    lastPollAt
  }
}

export function getIntegrationDetail(id: string): IntegrationDetailResult | null {
  const endpoint = endpoints.find((e) => e.id === id)
  if (!endpoint) return null
  return {
    endpoint: { ...endpoint, dataUpdatedAt: formatDisplayTime(endpoint.dataUpdatedAt) },
    recentProbes: probeHistory.filter((p) => p.endpointId === id).slice(0, 10)
  }
}

export function probeIntegration(ids?: string[]): IntegrationProbeRecord[] {
  lastPollAt = formatNow()
  const targets = ids?.length
    ? endpoints.filter((e) => ids.includes(e.id))
    : endpoints.filter((e) => e.enabled)
  const records = targets.map((e) => simulateProbe(e))
  probeHistory = [...records, ...probeHistory].slice(0, 200)
  return records
}

function pushProbeRecord(
  endpointId: string,
  success: boolean,
  latencyMs: number,
  message: string,
  samplePayload?: string
) {
  const record: IntegrationProbeRecord = {
    id: `probe-${Date.now()}-${randInt(1000, 9999)}`,
    endpointId,
    checkedAt: formatNow(),
    success,
    latencyMs,
    message,
    samplePayload
  }
  probeHistory = [record, ...probeHistory].slice(0, 200)
  return record
}

export function reconnectIntegration(id: string): IntegrationReconnectResult {
  const idx = endpoints.findIndex((e) => e.id === id)
  if (idx < 0) throw new Error('\u5bf9\u63a5\u9879\u4e0d\u5b58\u5728')

  const ep = endpoints[idx]
  const now = formatNow()

  if (ep.runStatus === 'running') {
    return {
      success: true,
      message: '\u5f53\u524d\u5df2\u5728\u8fd0\u884c\u4e2d\uff0c\u65e0\u9700\u91cd\u8fde',
      endpoint: { ...ep, dataUpdatedAt: formatDisplayTime(ep.dataUpdatedAt) }
    }
  }

  if (RECONNECT_BLOCKED_CODES.includes(ep.linkCode)) {
    const failMsg =
      ep.linkCode === 'WL_SYNC_GA'
        ? 'HTTP 503 Service Unavailable'
        : 'ECONNREFUSED \u8fde\u63a5\u88ab\u5bf9\u7aef\u62d2\u7edd'
    const row: IntegrationEndpoint = {
      ...ep,
      enabled: true,
      runStatus: 'error',
      heartbeatText: '\u91cd\u8fde\u5931\u8d25 (\u901a\u8baf\u5f02\u5e38)',
      latencyMs: null,
      lastError: failMsg,
      lastCheckAt: now,
      dataUpdatedAt: now,
      requestCount24h: ep.requestCount24h + 1,
      failCount24h: ep.failCount24h + 1
    }
    const total = row.requestCount24h
    row.successRate = Math.round(((total - row.failCount24h) / total) * 1000) / 10
    endpoints[idx] = row
    pushProbeRecord(id, false, 0, `\u91cd\u8fde\u5931\u8d25: ${failMsg}`)
    return {
      success: false,
      message: '\u91cd\u8fde\u5931\u8d25\uff0c\u901a\u8baf\u4ecd\u5b58\u5728\u5f02\u5e38',
      endpoint: { ...row, dataUpdatedAt: formatDisplayTime(row.dataUpdatedAt) }
    }
  }

  const latencyMs = randInt(28, 95)
  const row: IntegrationEndpoint = {
    ...ep,
    enabled: true,
    runStatus: 'running',
    heartbeatText: `\u6b63\u5e38 (${latencyMs}ms)`,
    latencyMs,
    lastError: undefined,
    lastCheckAt: now,
    dataUpdatedAt: now,
    requestCount24h: ep.requestCount24h + 1
  }
  const total = row.requestCount24h
  row.successRate = Math.round(((total - row.failCount24h) / total) * 1000) / 10
  endpoints[idx] = row
  pushProbeRecord(id, true, latencyMs, '\u91cd\u8fde\u6210\u529f\uff0c\u6570\u636e\u4ea4\u4e92\u5df2\u6062\u590d', '{"code":0,"data":{"status":"ok"}}')

  return {
    success: true,
    message: '\u91cd\u8fde\u6210\u529f\uff0c\u901a\u8baf\u5df2\u6062\u590d',
    endpoint: { ...row, dataUpdatedAt: formatDisplayTime(row.dataUpdatedAt) }
  }
}
