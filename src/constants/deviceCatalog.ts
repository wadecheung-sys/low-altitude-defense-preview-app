/**
 * 设备选型目录（单一事实来源）
 * 说明书原件：仓库根目录 device-docs/
 *
 * 版本标记：v2-selection — 与初版 mock 数据区分，便于回滚对照
 */
import type {
  DeviceArchiveIndicator,
  DeviceConfigItemScope
} from '@/api/lad/device/types'

export const DEVICE_CATALOG_VERSION = 'v2-selection'

export const DEVICE_DOCS_ROOT = '../device-docs'

export type DeviceCatalogTier = 'confirmed' | 'pending' | 'peripheral'
export type CountermeasureActionValue =
  | 'navigation_spoofing'
  | 'radio_jamming'
  | 'sound_light_expulsion'
  | 'microwave_strike'
  | 'laser_strike'

export interface DeviceCatalogEntry {
  model: string
  vendor: string
  deviceType: string
  tier: DeviceCatalogTier
  /** 相对 DEVICE_DOCS_ROOT 的文件名 */
  docFile?: string
  /** 是否可作为设备组主设备 */
  groupMasterEligible: boolean
  archiveName: string
  archiveNo: string
  /** 设备规格：说明书固定参数 */
  specifications: Omit<DeviceArchiveIndicator, 'id'>[]
  /** 可配置项定义（设备级 / 运行时） */
  configurableItems: DeviceConfigurableItemTemplate[]
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

export interface CountermeasureDeviceBinding {
  deviceType: string
  model: string
  effect: string
  actionLabel: string
  timelineLabel: string
  resultEventType: '驱离/自离' | '迫降' | '打击'
  aliases: string[]
  /** 代码层占位，不进入用户可见的设备台账种子 */
  internalOnly?: boolean
  /** 演示阶段是否允许通过 mock 指令通道下发 */
  demoExecutable: boolean
}

function ind(item: string, unit: string, value: string): Omit<DeviceArchiveIndicator, 'id'> {
  return { item, unit, value }
}

export interface DeviceConfigurableItemTemplate {
  key: string
  label: string
  unit: string
  scope: DeviceConfigItemScope
  hint?: string
  defaultValue?: string
}

function cfg(
  key: string,
  label: string,
  unit: string,
  scope: DeviceConfigItemScope,
  hint?: string,
  defaultValue?: string
): DeviceConfigurableItemTemplate {
  return { key, label, unit, scope, hint, defaultValue }
}

/** 已确认选型（有说明书） */
export const CONFIRMED_DEVICES: DeviceCatalogEntry[] = [
  {
    model: 'FG310F',
    vendor: '凡双科技',
    deviceType: '无线电干扰',
    tier: 'confirmed',
    docFile: '使用说明书_固定式转台无线电压制设备FG310F.pdf',
    archiveName: '核心区转台无线电压制设备档案',
    archiveNo: 'D-LAD-JAM0001',
    specifications: [
      ind(
        '工作频段',
        'MHz',
        '400-450 / 840-928 / 1160-1250 / 1350-1470 / 1550-1620 / 2400-2485 / 5140-5945'
      ),
      ind('水平转角范围', '°', '0~360'),
      ind('俯仰角范围', '°', '-10~+60'),
      ind('有效拦截距离', 'km', '≥3'),
      ind('设备功率', 'W', '≤600'),
      ind('拦截响应时间', 's', '≤5')
    ],
    configurableItems: [
      cfg('jam_default_band', '默认压制频段', 'MHz', 'device', '选自工作频段子集', '2400-2485'),
      cfg('link_track_mode', '联动跟踪模式', '', 'device', '自动 / 手动', '自动'),
      cfg(
        'turntable_azimuth',
        '转台方位角',
        '°',
        'runtime',
        '0~360，指挥大屏实时控制'
      ),
      cfg(
        'turntable_elevation',
        '转台俯仰角',
        '°',
        'runtime',
        '-10~+60，指挥大屏实时控制'
      )
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
    docFile: '使用说明书_固定式反无人机无线电主动防御设备DY506F.pdf',
    archiveName: '西区导航主动防御设备档案',
    archiveNo: 'D-LAD-SPF0001',
    specifications: [
      ind('工作频率', 'MHz', 'GPS L1 / GLONASS L1 / Galileo E1'),
      ind('主动防御距离', 'm', '500-1000'),
      ind('诱骗起效时间', 's', '≤10'),
      ind('设备功耗', 'W', '≤16'),
      ind('防护等级', '', 'IP66')
    ],
    configurableItems: [
      cfg('spoof_default_mode', '默认证诱骗模式', '', 'device', '禁飞 / 驱离 / 迫降', '驱离'),
      cfg('emit_power_level', '发射功率档位', '', 'device', '低 / 中 / 高', '中')
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
    archiveName: '东侧无线电侦测站档案',
    archiveNo: 'D-LAD-RF0001',
    specifications: [
      ind('频率范围', 'MHz', '20-6000'),
      ind('侦测半径', 'km', '3-10'),
      ind('多目标探测', '架', '≥40'),
      ind('探测响应时间', 's', '≤2'),
      ind('识别模式', '', '频谱/DroneID/Remote ID/WiFi')
    ],
    configurableItems: [
      cfg('detect_sensitivity', '侦测灵敏度', '', 'device', '低 / 中 / 高', '中'),
      cfg('report_interval', '平台上报周期', 's', 'device', '1~60', '5')
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
    archiveName: 'Remote-ID 监视站档案',
    archiveNo: 'D-LAD-RID0001',
    specifications: [
      ind('工作频段', 'MHz', '2400-2500 / 5725-5850'),
      ind('探测半径', 'km', '1.5-3'),
      ind('多目标监测', '架', '≥50'),
      ind('刷新时间', 's', '≤1'),
      ind('侦测模式', '', 'RID 广播报文解析')
    ],
    configurableItems: [
      cfg('refresh_policy', '监测刷新策略', '', 'device', '实时 / 节能', '实时')
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
    archiveName: 'ADS-B 地面站接收机档案',
    archiveNo: 'D-LAD-ADS0001',
    specifications: [
      ind('接收频段', 'MHz', '1090ES / UAT978'),
      ind('作用距离', 'km', '≤250'),
      ind('通信协议', '', 'TCP/UDP'),
      ind('输出模式', '', 'Mode1-4 JSON/明文'),
      ind('防护等级', '', 'IP66')
    ],
    configurableItems: [cfg('output_format', '数据输出格式', '', 'device', 'JSON / 明文', 'JSON')],
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

/** 扩展选型设备（设备组与演示保留） */
export const PENDING_DEVICES: DeviceCatalogEntry[] = [
  {
    model: 'TBD-RAD',
    vendor: '华诺智感',
    deviceType: '雷达',
    tier: 'pending',
    groupMasterEligible: true,
    archiveName: '低空监视雷达档案',
    archiveNo: 'D-LAD-RAD0001',
    specifications: [
      ind('工作频段', 'GHz', 'X / Ku'),
      ind('探测距离', 'km', '≥8'),
      ind('备注', '', '北区主雷达站')
    ],
    configurableItems: [
      cfg('scan_mode', '扫描模式', '', 'device', '扇扫 / 圆桌', '扇扫'),
      cfg('target_filter', '目标过滤等级', '', 'device', '低 / 中 / 高', '中'),
      cfg('alarm_threshold', '告警触发阈值', '架', 'device', '1~20', '3'),
      cfg('link_eo_track', '联动光电跟踪', '', 'device', '开 / 关', '开')
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
    archiveName: '光电跟踪转台档案',
    archiveNo: 'D-LAD-EO0001',
    specifications: [
      ind('可见光焦距', 'mm', '15-750'),
      ind('热成像', '', '640×512'),
      ind('水平转角范围', '°', '0~360'),
      ind('俯仰角范围', '°', '-45~+45'),
      ind('备注', '', '南门岗哨主跟踪')
    ],
    configurableItems: [
      cfg('track_mode', '跟踪模式', '', 'device', '自动 / 手动', '自动'),
      cfg('eo_azimuth', '转台方位角', '°', 'runtime', '指挥大屏实时控制'),
      cfg('eo_elevation', '转台俯仰角', '°', 'runtime', '指挥大屏实时控制')
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
    archiveName: '激光反制设备档案',
    archiveNo: 'D-LAD-LSR0001',
    specifications: [
      ind('作用距离', 'm', '≥500'),
      ind('激光功率', 'W', '—'),
      ind('备注', '', '西区反制激光站')
    ],
    configurableItems: [
      cfg('safety_interlock', '安全联锁', '', 'device', '启用 / 关闭', '启用'),
      cfg('max_exposure', '最大出光时长', 's', 'device', '1~30', '10'),
      cfg('fire_confirm', '出光二次确认', '', 'device', '开 / 关', '开'),
      cfg('link_radar_aim', '雷达引导瞄准', '', 'device', '开 / 关', '开')
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
    archiveName: '高功率微波设备档案',
    archiveNo: 'D-LAD-HPM0001',
    specifications: [
      ind('作用范围', 'm', '≥300'),
      ind('输出峰值', 'kW', '—'),
      ind('备注', '', '核心区微波压制')
    ],
    configurableItems: [
      cfg('work_mode', '工作模式', '', 'device', '待机 / 发射准备', '待机'),
      cfg('target_hold_time', '目标锁定保持', 's', 'device', '3~60', '15'),
      cfg('emission_confirm', '发射二次确认', '', 'device', '开 / 关', '开'),
      cfg('link_track_mode', '联动跟踪模式', '', 'device', '自动 / 手动', '自动')
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

/** 内部占位能力：用于动作映射和后续接入准备，不进入用户可见设备台账。 */
export const INTERNAL_PLACEHOLDER_DEVICES: DeviceCatalogEntry[] = [
  {
    model: 'TBD-SLA',
    vendor: '警翼科技',
    deviceType: '声光驱离',
    tier: 'pending',
    groupMasterEligible: false,
    archiveName: '声光驱离设备档案',
    archiveNo: 'D-LAD-SLA0001',
    specifications: [
      ind('声压级', 'dB', '≥120'),
      ind('警示灯', '', '红蓝频闪'),
      ind('备注', '', '南区声光警示站')
    ],
    configurableItems: [
      cfg('warning_level', '警示等级', '', 'device', '低 / 中 / 高', '中'),
      cfg('auto_trigger', '告警自动触发', '', 'device', '开 / 关', '开'),
      cfg('volume_level', '音量档位', '', 'device', '低 / 中 / 高', '中'),
      cfg('light_pattern', '灯光模式', '', 'device', '常亮 / 频闪', '频闪')
    ],
    demo: {
      deviceId: 'DEV-SLA-01',
      deviceName: '1#声光-SG',
      deployLocation: '南区警示塔',
      ipAddress: '192.168.8.95',
      serialNo: 'SG-SLA-2025-001',
      personInCharge: '马工',
      controlRangeM: 300,
      deviceIcon: 'counter'
    }
  }
]

export const ALL_CATALOG_DEVICES = [...CONFIRMED_DEVICES, ...PENDING_DEVICES]
export const ALL_DEVICE_CAPABILITY_CATALOG = [
  ...ALL_CATALOG_DEVICES,
  ...INTERNAL_PLACEHOLDER_DEVICES
]

export function catalogCategoryFromDeviceType(
  deviceType: string
): 'radar' | 'radio' | 'counter' | 'eo' | 'camera' {
  if (deviceType === '监控摄像机') return 'camera'
  if (deviceType === '雷达' || deviceType === 'ADS-B 监视') return 'radar'
  if (deviceType === '无线电侦测' || deviceType === 'Remote-ID 监视') return 'radio'
  if (deviceType === '光电跟踪') return 'eo'
  return 'counter'
}

/** 反制动作 → 设备能力的权威映射。前端展示文案仍由字典控制。 */
export const COUNTERMEASURE_DEVICE_BINDINGS: Record<
  CountermeasureActionValue,
  CountermeasureDeviceBinding
> = {
  navigation_spoofing: {
    deviceType: '导航诱骗',
    model: 'DY506F',
    effect: '迫降 / 禁飞 / 驱离',
    actionLabel: '导航诱骗',
    timelineLabel: '迫降处置',
    resultEventType: '迫降',
    aliases: ['导航诱骗', '迫降', '禁飞', '诱骗', 'forced_landing'],
    demoExecutable: true
  },
  radio_jamming: {
    deviceType: '无线电干扰',
    model: 'FG310F',
    effect: '压制 / 可能触发自动返航',
    actionLabel: '无线电干扰',
    timelineLabel: '无线电压制',
    resultEventType: '驱离/自离',
    aliases: ['无线电干扰', '无线电压制', '压制', '链路阻断', '干扰', 'link_disruption'],
    demoExecutable: true
  },
  sound_light_expulsion: {
    deviceType: '声光驱离',
    model: 'TBD-SLA',
    effect: '声光驱离',
    actionLabel: '声光驱离',
    timelineLabel: '声光驱离',
    resultEventType: '驱离/自离',
    aliases: ['声光驱离', '声光警示', '声光', '驱离'],
    internalOnly: true,
    demoExecutable: false
  },
  microwave_strike: {
    deviceType: '高功率微波',
    model: 'TBD-HPM',
    effect: '微波打击',
    actionLabel: '微波打击',
    timelineLabel: '微波打击',
    resultEventType: '打击',
    aliases: ['微波打击', '高功率微波', '微波', 'hpm_suppression'],
    demoExecutable: false
  },
  laser_strike: {
    deviceType: '激光打击',
    model: 'TBD-LSR',
    effect: '激光打击',
    actionLabel: '激光打击',
    timelineLabel: '激光打击',
    resultEventType: '打击',
    aliases: ['激光打击', '激光'],
    demoExecutable: false
  }
}

export function resolveCountermeasureActionValue(
  text?: string
): CountermeasureActionValue | undefined {
  const value = String(text ?? '').trim()
  if (!value) return undefined
  if (value in COUNTERMEASURE_DEVICE_BINDINGS) return value as CountermeasureActionValue
  for (const [actionValue, binding] of Object.entries(COUNTERMEASURE_DEVICE_BINDINGS)) {
    if (binding.aliases.some((alias) => value.includes(alias))) {
      return actionValue as CountermeasureActionValue
    }
  }
  return undefined
}

export function countermeasureActionLabelFromValue(text?: string): string {
  const actionValue = resolveCountermeasureActionValue(text)
  return actionValue ? COUNTERMEASURE_DEVICE_BINDINGS[actionValue].actionLabel : String(text ?? '')
}

export function countermeasureTimelineLabel(text?: string, fallback = '定向驱离'): string {
  const actionValue = resolveCountermeasureActionValue(text)
  return actionValue ? COUNTERMEASURE_DEVICE_BINDINGS[actionValue].timelineLabel : fallback
}

export function countermeasureResultEventType(
  text?: string
): CountermeasureDeviceBinding['resultEventType'] {
  const actionValue = resolveCountermeasureActionValue(text)
  return actionValue ? COUNTERMEASURE_DEVICE_BINDINGS[actionValue].resultEventType : '驱离/自离'
}

export function isDemoExecutableDeviceModel(model?: string): boolean {
  if (!model) return true
  const binding = Object.values(COUNTERMEASURE_DEVICE_BINDINGS).find((item) => item.model === model)
  if (binding) return binding.demoExecutable
  if (model === 'TBD-SLA') return true
  return !model.startsWith('TBD-')
}
