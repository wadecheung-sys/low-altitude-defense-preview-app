/**
 * 设备选型目录（单一事实来源）
 * 说明书原件：仓库根目录 device-docs/
 *
 * 版本标记：v2-selection — 与初版 mock 数据区分，便于回滚对照
 */
import type { DeviceArchiveIndicator } from '@/api/lad/device/types'

export const DEVICE_CATALOG_VERSION = 'v2-selection'

export const DEVICE_DOCS_ROOT = '../device-docs'

export type DeviceCatalogTier = 'confirmed' | 'pending' | 'peripheral'

export interface DeviceCatalogEntry {
  model: string
  vendor: string
  deviceType: string
  tier: DeviceCatalogTier
  /** 相对 DEVICE_DOCS_ROOT 的文件名 */
  docFile?: string
  /** 数据大屏弹窗优先展示（1 最高） */
  screenPriority?: number
  /** 是否可作为设备组主设备 */
  groupMasterEligible: boolean
  /** 是否出现在数据大屏设备弹窗 */
  dataScreenVisible: boolean
  archiveName: string
  archiveNo: string
  indicators: Omit<DeviceArchiveIndicator, 'id'>[]
  /** 演示部署默认值 */
  demo: {
    deviceId: string
    deviceName: string
    deployLocation: string
    ipAddress: string
    serialNo: string
    personInCharge: string
    controlRangeM: number
    deviceIcon: string
  }
}

function ind(
  item: string,
  unit: string,
  value: string,
  dataType: DeviceArchiveIndicator['dataType'] = 'text'
): Omit<DeviceArchiveIndicator, 'id'> {
  return { item, unit, dataType, value, config: dataType === 'number' ? { integerDigits: 6, decimalPlaces: 0 } : { maxLength: 64 } }
}

/** 已确认选型（有说明书） */
export const CONFIRMED_DEVICES: DeviceCatalogEntry[] = [
  {
    model: 'FG310F',
    vendor: '凡双科技',
    deviceType: '无线电干扰',
    tier: 'confirmed',
    docFile: '使用说明书_固定式转台无线电压制设备FG310F.pdf',
    screenPriority: 1,
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: '核心区转台无线电压制设备档案',
    archiveNo: 'D-LAD-JAM0001',
    indicators: [
      ind('工作频段', 'MHz', '400-450 / 840-928 / 1160-1250 / 1350-1470 / 1550-1620 / 2400-2485 / 5140-5945'),
      ind('转台水平角', '°', '360'),
      ind('转台俯仰角', '°', '-10~+60'),
      ind('有效拦截距离', 'km', '≥3'),
      ind('设备功率', 'W', '≤600'),
      ind('拦截响应时间', 's', '≤5')
    ],
    demo: {
      deviceId: 'DEV-FG310-01',
      deviceName: '核心区转台压制-FG310F',
      deployLocation: '核心区制高点',
      ipAddress: '192.168.8.120',
      serialNo: 'FG310F-2025-001',
      personInCharge: '张工',
      controlRangeM: 3000,
      deviceIcon: 'jammer'
    }
  },
  {
    model: 'DY506F',
    vendor: '凡双科技',
    deviceType: '导航诱骗',
    tier: 'confirmed',
    docFile: '使用说明书_固定式反无人机导航主动防御设备DY506F.pdf',
    screenPriority: 2,
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: '西区导航主动防御设备档案',
    archiveNo: 'D-LAD-SPF0001',
    indicators: [
      ind('工作频率', 'MHz', 'GPS L1 / GLONASS L1 / Galileo E1'),
      ind('主动防御距离', 'm', '500-1000'),
      ind('诱骗起效时间', 's', '≤10'),
      ind('设备功耗', 'W', '≤16'),
      ind('防护等级', '', 'IP66')
    ],
    demo: {
      deviceId: 'DEV-DY506-01',
      deviceName: '西区导航诱骗-DY506F',
      deployLocation: '西区机房',
      ipAddress: '192.168.8.69',
      serialNo: 'DY506F-2025-001',
      personInCharge: '赵工',
      controlRangeM: 800,
      deviceIcon: 'counter'
    }
  },
  {
    model: 'PL671F',
    vendor: '凡双科技',
    deviceType: '无线电侦测',
    tier: 'confirmed',
    docFile: '使用说明书_固定式无线电侦测设备PL671F.pdf',
    screenPriority: 3,
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: '东侧无线电侦测站档案',
    archiveNo: 'D-LAD-RF0001',
    indicators: [
      ind('频率范围', 'MHz', '20-6000'),
      ind('侦测半径', 'km', '3-10'),
      ind('多目标探测', '架', '≥40'),
      ind('探测响应时间', 's', '≤2'),
      ind('识别模式', '', '频谱/DroneID/Remote ID/WiFi')
    ],
    demo: {
      deviceId: 'DEV-PL671-01',
      deviceName: '东侧频谱侦测-PL671F',
      deployLocation: '东侧瞭望台',
      ipAddress: '192.168.8.100',
      serialNo: 'PL671F-2025-001',
      personInCharge: '周工',
      controlRangeM: 5000,
      deviceIcon: 'radar'
    }
  },
  {
    model: 'RDS200',
    vendor: '凡双科技',
    deviceType: 'Remote-ID 监视',
    tier: 'confirmed',
    docFile: '使用说明书_远程识别监视设备RDS200.pdf',
    screenPriority: 4,
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: 'Remote-ID 监视站档案',
    archiveNo: 'D-LAD-RID0001',
    indicators: [
      ind('工作频段', 'MHz', '2400-2500 / 5725-5850'),
      ind('探测半径', 'km', '1.5-3'),
      ind('多目标监测', '架', '≥50'),
      ind('刷新时间', 's', '≤1'),
      ind('侦测模式', '', 'RID 广播报文解析')
    ],
    demo: {
      deviceId: 'DEV-RDS200-01',
      deviceName: '北侧Remote-ID监视-RDS200',
      deployLocation: '北侧制高点',
      ipAddress: '192.168.8.50',
      serialNo: 'RDS200-2025-001',
      personInCharge: '李工',
      controlRangeM: 2500,
      deviceIcon: 'radar'
    }
  },
  {
    model: 'EXD55-LS',
    vendor: '亿思德科技',
    deviceType: 'ADS-B 监视',
    tier: 'peripheral',
    docFile: 'EXD55-LS ADS-B接收机手册V1.3.pdf',
    groupMasterEligible: false,
    dataScreenVisible: false,
    archiveName: 'ADS-B 地面站接收机档案',
    archiveNo: 'D-LAD-ADS0001',
    indicators: [
      ind('接收频段', 'MHz', '1090ES / UAT978'),
      ind('作用距离', 'km', '≤250'),
      ind('通信协议', '', 'TCP/UDP'),
      ind('输出模式', '', 'Mode1-4 JSON/明文'),
      ind('防护等级', '', 'IP66')
    ],
    demo: {
      deviceId: 'DEV-EXD55-01',
      deviceName: '塔台ADS-B补盲-EXD55-LS',
      deployLocation: '塔台屋顶',
      ipAddress: '192.168.9.10',
      serialNo: 'EXD55-LS-2025-001',
      personInCharge: '王工',
      controlRangeM: 250000,
      deviceIcon: 'radar'
    }
  }
]

/** 扩展选型设备（大屏 tab 与设备组保留） */
export const PENDING_DEVICES: DeviceCatalogEntry[] = [
  {
    model: 'TBD-RAD',
    vendor: '华诺智感',
    deviceType: '雷达',
    tier: 'pending',
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: '低空监视雷达档案',
    archiveNo: 'D-LAD-RAD0001',
    indicators: [
      ind('工作频段', 'GHz', 'X / Ku'),
      ind('探测距离', 'km', '≥8'),
      ind('备注', '', '北区主雷达站')
    ],
    demo: {
      deviceId: 'DEV-RAD-01',
      deviceName: '1#雷达-LD',
      deployLocation: '北区瞭望台',
      ipAddress: '192.168.8.60',
      serialNo: 'LD-RAD-2025-001',
      personInCharge: '陈工',
      controlRangeM: 800,
      deviceIcon: 'radar'
    }
  },
  {
    model: 'TBD-EO',
    vendor: '视界光电',
    deviceType: '光电跟踪',
    tier: 'pending',
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: '光电跟踪转台档案',
    archiveNo: 'D-LAD-EO0001',
    indicators: [
      ind('可见光焦距', 'mm', '15-750'),
      ind('热成像', '', '640×512'),
      ind('备注', '', '南门岗哨主跟踪')
    ],
    demo: {
      deviceId: 'DEV-EO-01',
      deviceName: '1#光电-GD',
      deployLocation: '南门岗哨',
      ipAddress: '192.168.2.15',
      serialNo: 'GD-EO-2025-001',
      personInCharge: '王工',
      controlRangeM: 600,
      deviceIcon: 'eo'
    }
  },
  {
    model: 'TBD-LSR',
    vendor: '锐光防务',
    deviceType: '激光打击',
    tier: 'pending',
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: '激光反制设备档案',
    archiveNo: 'D-LAD-LSR0001',
    indicators: [
      ind('作用距离', 'm', '≥500'),
      ind('激光功率', 'W', '—'),
      ind('备注', '', '西区反制激光站')
    ],
    demo: {
      deviceId: 'DEV-LSR-01',
      deviceName: '1#激光-JG',
      deployLocation: '西区反制阵地',
      ipAddress: '192.168.8.88',
      serialNo: 'JG-LSR-2025-001',
      personInCharge: '刘工',
      controlRangeM: 500,
      deviceIcon: 'counter'
    }
  },
  {
    model: 'TBD-HPM',
    vendor: '磐石电子',
    deviceType: '高功率微波',
    tier: 'pending',
    groupMasterEligible: true,
    dataScreenVisible: true,
    archiveName: '高功率微波设备档案',
    archiveNo: 'D-LAD-HPM0001',
    indicators: [
      ind('作用范围', 'm', '≥300'),
      ind('输出峰值', 'kW', '—'),
      ind('备注', '', '核心区微波压制')
    ],
    demo: {
      deviceId: 'DEV-HPM-01',
      deviceName: '1#微波-WB',
      deployLocation: '核心区西侧',
      ipAddress: '192.168.8.90',
      serialNo: 'WB-HPM-2025-001',
      personInCharge: '孙工',
      controlRangeM: 1200,
      deviceIcon: 'counter'
    }
  }
]

export const ALL_CATALOG_DEVICES = [...CONFIRMED_DEVICES, ...PENDING_DEVICES]

export const DATA_SCREEN_PRIORITY_DEVICES = CONFIRMED_DEVICES.filter((d) => d.dataScreenVisible).sort(
  (a, b) => (a.screenPriority ?? 99) - (b.screenPriority ?? 99)
)

export function catalogCategoryFromDeviceType(deviceType: string): 'radar' | 'radio' | 'counter' | 'eo' {
  if (deviceType === '雷达' || deviceType === 'ADS-B 监视') return 'radar'
  if (deviceType === '无线电侦测' || deviceType === 'Remote-ID 监视') return 'radio'
  if (deviceType === '光电跟踪') return 'eo'
  return 'counter'
}

/** 反制语义：迫降 → 导航诱骗；压制 → 无线电干扰（可能触发自动返航） */
export const COUNTERMEASURE_DEVICE_MAP = {
  forcedLanding: { deviceType: '导航诱骗', model: 'DY506F', action: '迫降/禁飞/驱离' },
  suppression: { deviceType: '无线电干扰', model: 'FG310F', action: '压制/自动返航' }
} as const
