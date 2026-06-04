export type IntegrationProtocol = 'HTTP' | 'HTTPS' | 'WebSocket' | 'MQTT' | 'TCP'

/** 运行状态（原型） */
export type IntegrationRunStatus = 'running' | 'stopped' | 'error' | 'unknown'

export interface IntegrationEndpoint {
  id: string
  /** 系统对接标识，如 SYS_API */
  linkCode: string
  /** 描述 */
  description: string
  runStatus: IntegrationRunStatus
  /** 心跳测试展示文案 */
  heartbeatText: string
  /** 数据更新时间 */
  dataUpdatedAt: string
  baseUrl: string
  protocol: IntegrationProtocol
  enabled: boolean
  latencyMs: number | null
  successRate: number
  lastCheckAt?: string
  lastError?: string
  requestCount24h: number
  failCount24h: number
}

export interface IntegrationQuery {
  pageIndex?: number
  pageSize?: number
  linkCode?: string
  description?: string
  runStatus?: IntegrationRunStatus | ''
  dataUpdatedAtStart?: string
  dataUpdatedAtEnd?: string
}

export interface IntegrationListResult {
  list: IntegrationEndpoint[]
  total: number
}

export interface IntegrationSummary {
  total: number
  running: number
  error: number
  stopped: number
  unknown: number
  lastPollAt: string
}

export interface IntegrationProbeRecord {
  id: string
  endpointId: string
  checkedAt: string
  success: boolean
  latencyMs: number
  message: string
  samplePayload?: string
}

export interface IntegrationDetailResult {
  endpoint: IntegrationEndpoint
  recentProbes: IntegrationProbeRecord[]
}

export interface IntegrationReconnectResult {
  success: boolean
  message: string
  endpoint: IntegrationEndpoint
}
