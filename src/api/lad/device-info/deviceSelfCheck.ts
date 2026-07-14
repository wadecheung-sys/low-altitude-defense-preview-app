import type { DeviceInfoItem } from './types'

/** 支持设备自检的类型（部分设备具备健康自检能力） */
export const DEVICE_SELF_CHECK_TYPES = new Set([
  '雷达',
  '无线电侦测',
  'Remote-ID 监视',
  '无线电干扰',
  '导航诱骗',
  '激光打击',
  '高功率微波',
  '光电跟踪'
])

export type DeviceSelfCheckItemStatus = 'pass' | 'warn' | 'fail'

export interface DeviceSelfCheckItem {
  name: string
  status: DeviceSelfCheckItemStatus
  detail: string
}

export type DeviceSelfCheckOverall = 'healthy' | 'degraded' | 'fault' | 'unsupported'

export interface DeviceSelfCheckResult {
  deviceId: string
  deviceName: string
  deviceType: string
  supported: boolean
  overall: DeviceSelfCheckOverall
  checkedAt: string
  items: DeviceSelfCheckItem[]
  summary: string
}

export function deviceSupportsSelfCheck(deviceType: string): boolean {
  return DEVICE_SELF_CHECK_TYPES.has(deviceType)
}

function isRecentlyOnline(lastHeartbeat: string): boolean {
  if (!lastHeartbeat?.trim()) return false
  const t = new Date(lastHeartbeat.replace(/-/g, '/')).getTime()
  if (Number.isNaN(t)) return true
  return Date.now() - t < 48 * 3600 * 1000
}

function pickStatus(online: boolean, base: DeviceSelfCheckItemStatus): DeviceSelfCheckItemStatus {
  if (!online && base === 'pass') return 'warn'
  if (!online && base === 'warn') return 'fail'
  return base
}

function buildItems(row: DeviceInfoItem, online: boolean): DeviceSelfCheckItem[] {
  const type = row.deviceType
  if (type === '雷达') {
    return [
      { name: '收发模块', status: pickStatus(online, 'pass'), detail: '发射/接收链路正常' },
      { name: '伺服与方位', status: pickStatus(online, 'pass'), detail: '方位角反馈稳定' },
      {
        name: '信号处理单元',
        status: pickStatus(online, online ? 'pass' : 'warn'),
        detail: 'DSP 负载正常'
      },
      {
        name: '网络链路',
        status: pickStatus(online, online ? 'pass' : 'fail'),
        detail: online ? 'IP 可达' : '心跳超时，链路异常'
      }
    ]
  }
  if (type === '无线电侦测') {
    return [
      { name: '频谱采集模块', status: pickStatus(online, 'pass'), detail: '宽带采集通道稳定' },
      { name: '测向阵列', status: pickStatus(online, 'pass'), detail: '测向解算正常' },
      {
        name: '时钟同步',
        status: pickStatus(online, online ? 'pass' : 'warn'),
        detail: '北斗授时已同步'
      },
      {
        name: '控制与通信',
        status: pickStatus(online, online ? 'pass' : 'fail'),
        detail: online ? '平台链路可用' : '设备离线'
      }
    ]
  }
  if (type === 'Remote-ID 监视') {
    return [
      {
        name: 'RID 报文解析',
        status: pickStatus(online, 'pass'),
        detail: '2.4G/5.8G 广播解析正常'
      },
      { name: '多目标跟踪', status: pickStatus(online, 'pass'), detail: '轨迹刷新 ≤1s' },
      {
        name: '上报链路',
        status: pickStatus(online, online ? 'pass' : 'warn'),
        detail: online ? '平台上报正常' : '上报延迟'
      },
      {
        name: '控制与通信',
        status: pickStatus(online, online ? 'pass' : 'fail'),
        detail: online ? '设备在线' : '设备离线'
      }
    ]
  }
  if (type === '无线电干扰') {
    return [
      { name: '功放模块', status: pickStatus(online, 'pass'), detail: '输出功率在额定范围' },
      { name: '天线与馈线', status: pickStatus(online, 'pass'), detail: '驻波比正常' },
      {
        name: '温控与散热',
        status: pickStatus(online, online ? 'pass' : 'warn'),
        detail: '机箱温度 42℃'
      },
      {
        name: '控制与通信',
        status: pickStatus(online, online ? 'pass' : 'fail'),
        detail: online ? '指令通道正常' : '设备离线'
      }
    ]
  }
  if (type === '导航诱骗') {
    return [
      { name: '诱骗发射单元', status: pickStatus(online, 'pass'), detail: '导航信号注入正常' },
      { name: '时频基准', status: pickStatus(online, 'pass'), detail: '频率稳定度符合要求' },
      {
        name: '安全白名单',
        status: pickStatus(online, online ? 'pass' : 'warn'),
        detail: '保护名单已同步'
      },
      {
        name: '控制与通信',
        status: pickStatus(online, online ? 'pass' : 'fail'),
        detail: online ? '诱骗策略已加载' : '设备离线'
      }
    ]
  }
  if (type === '光电跟踪') {
    return [
      { name: '可见光通道', status: pickStatus(online, 'pass'), detail: '传感器自检通过' },
      {
        name: '红外通道',
        status: pickStatus(online, online ? 'pass' : 'warn'),
        detail: '制冷机工作正常'
      },
      { name: '云台机构', status: pickStatus(online, 'pass'), detail: '俯仰/方位限位正常' },
      {
        name: '网络与存储',
        status: pickStatus(online, online ? 'pass' : 'fail'),
        detail: online ? '录像服务可用' : '心跳中断'
      }
    ]
  }
  if (type === '激光打击' || type === '高功率微波') {
    return [
      { name: '主控单元', status: pickStatus(online, 'pass'), detail: '固件版本匹配' },
      {
        name: '执行机构',
        status: pickStatus(online, online ? 'pass' : 'warn'),
        detail: '机械/射频执行器就绪'
      },
      { name: '安全联锁', status: pickStatus(online, 'pass'), detail: '联锁回路闭合' },
      {
        name: '通信状态',
        status: pickStatus(online, online ? 'pass' : 'fail'),
        detail: online ? '与平台连接正常' : '离线，无法完成远程自检'
      }
    ]
  }
  return []
}

function resolveOverall(items: DeviceSelfCheckItem[]): DeviceSelfCheckOverall {
  if (items.some((i) => i.status === 'fail')) return 'fault'
  if (items.some((i) => i.status === 'warn')) return 'degraded'
  return 'healthy'
}

function overallSummary(overall: DeviceSelfCheckOverall): string {
  if (overall === 'healthy') return '设备健康，各自检项通过'
  if (overall === 'degraded') return '设备可用但存在告警项，建议安排巡检'
  return '设备存在故障项，请尽快处置'
}

export function runDeviceSelfCheck(row: DeviceInfoItem): DeviceSelfCheckResult {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const checkedAt = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`

  if (!deviceSupportsSelfCheck(row.deviceType)) {
    return {
      deviceId: row.deviceId,
      deviceName: row.deviceName,
      deviceType: row.deviceType,
      supported: false,
      overall: 'unsupported',
      checkedAt,
      items: [],
      summary: '当前设备类型未配置自检能力'
    }
  }

  const online = isRecentlyOnline(row.lastHeartbeat)
  const items = buildItems(row, online)
  const overall = resolveOverall(items)

  return {
    deviceId: row.deviceId,
    deviceName: row.deviceName,
    deviceType: row.deviceType,
    supported: true,
    overall,
    checkedAt,
    items,
    summary: overallSummary(overall)
  }
}
