export interface DeviceProtocolMessage {
  code: string
  label: string
  direction: '设备→平台' | '平台→设备' | '双向'
}

export interface DeviceProtocolBand {
  index: number
  startMHz: number
  endMHz: number
}

export interface DeviceProtocolProfile {
  model: 'RDS200' | 'DY506F' | 'FG310F' | 'EO-V2.8'
  sourceDocument: string
  transport: string
  connectionRole: string
  framing: string
  endpoint: string
  messages: DeviceProtocolMessage[]
  bands?: DeviceProtocolBand[]
}

export const CONFIRMED_DEVICE_PROTOCOLS: Record<
  DeviceProtocolProfile['model'],
  DeviceProtocolProfile
> = {
  RDS200: {
    model: 'RDS200',
    sourceDocument: 'RID对接协议2026.docx',
    transport: 'TCP（RJ45/4G）或 MQTT',
    connectionRole: 'RID 设备作为 TCP 客户端，平台作为 TCP 服务端',
    framing: '0x55 0x55 0xAA 0xAA + 小端类型/长度 + ASCII JSON',
    endpoint: 'TCP/MQTT 地址、端口与 Topic 按部署环境配置',
    messages: [
      { code: '0x1100', label: '设备心跳', direction: '设备→平台' },
      { code: '0x1102', label: '无人机 RID 信息', direction: '设备→平台' },
      { code: '0x101C', label: '设备软件升级', direction: '平台→设备' }
    ]
  },
  DY506F: {
    model: 'DY506F',
    sourceDocument: '导航诱骗对接协议&固定式 对外协议-固定式防爆506.docx',
    transport: 'TCP + JSON',
    connectionRole: '平台作为 TCP 客户端，设备作为 TCP 服务端',
    framing: '0xAA 0xAA 0x55 0x55 + Uint16 帧体长度 + JSON',
    endpoint: '设备网络参数由 0x1005~0x1008 查询/设置',
    messages: [
      { code: '0x1010', label: '设备信息上报', direction: '设备→平台' },
      { code: '0x1000', label: '固定式心跳', direction: '设备→平台' },
      { code: '0x2001', label: '诱骗位置设置', direction: '平台→设备' },
      { code: '0x2003', label: '四系统发射开关', direction: '平台→设备' },
      { code: '0x200E', label: '模拟初速度设置', direction: '平台→设备' },
      { code: '0x2012', label: '模拟圆周运动设置', direction: '平台→设备' },
      { code: '0x2102', label: '驱离发射设置', direction: '平台→设备' },
      { code: '0x2106', label: '导航禁飞/降落发射设置', direction: '平台→设备' },
      { code: '0x2108', label: '导航防御发射设置', direction: '平台→设备' }
    ]
  },
  FG310F: {
    model: 'FG310F',
    sourceDocument: '固定式转台定向压制协议（310）.docx',
    transport: 'HTTP POST/PUT + JSON',
    connectionRole: '设备与平台均同时提供 HTTP client/server',
    framing: 'HTTP Request/Response Body：msgType + body/result',
    endpoint: '设备默认 192.168.8.50:19876；平台默认 192.168.8.51:8000',
    messages: [
      { code: '0x1001', label: '设备信息上报', direction: '设备→平台' },
      { code: '0x2001', label: '转台方向控制', direction: '平台→设备' },
      { code: '0x2003', label: '水平/垂直角度上报', direction: '设备→平台' },
      { code: '0x2004', label: '转台指定角度', direction: '平台→设备' },
      { code: '0x3001', label: '单频段开关', direction: '平台→设备' },
      { code: '0x3002', label: '全部频段开关', direction: '平台→设备' },
      { code: '0x3003', label: '频段状态查询', direction: '双向' }
    ],
    bands: [
      { index: 0, startMHz: 840, endMHz: 960 },
      { index: 1, startMHz: 1550, endMHz: 1650 },
      { index: 2, startMHz: 2400, endMHz: 2485 },
      { index: 3, startMHz: 5725, endMHz: 5850 },
      { index: 4, startMHz: 5145, endMHz: 5250 },
      { index: 5, startMHz: 400, endMHz: 450 }
    ]
  },
  'EO-V2.8': {
    model: 'EO-V2.8',
    sourceDocument: '光电指控协议V2.8.pdf / SDK_CN_2026_02_28.rar',
    transport: 'UDP / TCP（可配置）',
    connectionRole: '指控平台与光电设备双向通信',
    framing: '协议号 9002；36+N Byte；小端序；固定帧头/帧尾',
    endpoint: '设备地址及平台 IP/端口按部署配置，平台参数可由 0x19 下发',
    messages: [
      { code: '0x01', label: '设备状态', direction: '设备→平台' },
      { code: '0x02', label: '方位俯仰', direction: '设备→平台' },
      { code: '0x03/0x16', label: '目指引导', direction: '平台→设备' },
      { code: '0x04', label: '搜索跟踪', direction: '平台→设备' },
      { code: '0x08', label: '状态扩展', direction: '设备→平台' },
      { code: '0x09', label: '镜头控制', direction: '平台→设备' },
      { code: '0x0B/0x18', label: '目标上报', direction: '设备→平台' },
      { code: '0x0C', label: '镜头状态', direction: '设备→平台' },
      { code: '0x0D', label: '转台控制', direction: '平台→设备' },
      { code: '0x0E', label: '跟踪通道切换', direction: '平台→设备' },
      { code: '0x0F', label: '脱靶量', direction: '设备→平台' },
      { code: '0x10', label: '手动锁定', direction: '平台→设备' },
      { code: '0x11', label: '外围设备控制', direction: '平台→设备' },
      { code: '0x13', label: '聚焦模式', direction: '平台→设备' },
      { code: '0x15', label: '系统状态扩展', direction: '设备→平台' },
      { code: '0x19', label: '系统参数', direction: '平台→设备' }
    ]
  }
}

export function getConfirmedDeviceProtocol(model?: string): DeviceProtocolProfile | undefined {
  if (!model || !(model in CONFIRMED_DEVICE_PROTOCOLS)) return undefined
  return CONFIRMED_DEVICE_PROTOCOLS[model as DeviceProtocolProfile['model']]
}
