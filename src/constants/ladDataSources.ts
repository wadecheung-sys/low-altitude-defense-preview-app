export const LAD_DATA_SOURCE_DICT_CODE = 'history_data_source'

export const LAD_DEFAULT_DATA_SOURCE = '多源数据融合'

export const LAD_DEFAULT_DATA_SOURCE_PARAM_KEY = 'history.dataSource.default'

export const LAD_DATA_SOURCE_OPTIONS = [
  {
    label: '雷达',
    value: '雷达',
    remark: '由雷达设备独立发现或持续跟踪'
  },
  {
    label: '无线电',
    value: '无线电',
    remark: '由无线电侦测设备识别频段、遥控链路或 DroneID'
  },
  {
    label: '光电',
    value: '光电',
    remark: '由光电设备跟踪、取证或人工复核'
  },
  {
    label: 'Remote-ID',
    value: 'Remote-ID',
    remark: '由远程识别监视设备解析广播报文'
  },
  {
    label: 'ADS-B',
    value: 'ADS-B',
    remark: '由 ADS-B 接收设备提供合作目标补充识别'
  },
  {
    label: '雷达+无线电',
    value: '雷达+无线电',
    remark: '雷达航迹与无线电侦测结果融合'
  },
  {
    label: '雷达+光电',
    value: '雷达+光电',
    remark: '雷达发现后联动光电确认或跟踪'
  },
  {
    label: '无线电+光电',
    value: '无线电+光电',
    remark: '无线电侦测与光电图像共同确认'
  },
  {
    label: LAD_DEFAULT_DATA_SOURCE,
    value: LAD_DEFAULT_DATA_SOURCE,
    remark: '雷达、无线电、光电等多类设备综合融合后的来源结论'
  }
] as const

const LAD_DATA_SOURCE_VALUES = new Set(LAD_DATA_SOURCE_OPTIONS.map((item) => item.value))

const LEGACY_DATA_SOURCE_MAP: Record<string, string> = {
  雷达单源: '雷达',
  无线电侦测: '无线电',
  光电跟踪: '光电',
  雷达无线电融合: '雷达+无线电',
  '雷达+无线电融合': '雷达+无线电',
  多源融合节点: LAD_DEFAULT_DATA_SOURCE
}

export function normalizeLadDataSource(value?: string, fallback = LAD_DEFAULT_DATA_SOURCE): string {
  const text = String(value ?? '').trim()
  if (!text) return fallback
  const legacy = LEGACY_DATA_SOURCE_MAP[text]
  if (legacy) return legacy
  return LAD_DATA_SOURCE_VALUES.has(text as (typeof LAD_DATA_SOURCE_OPTIONS)[number]['value'])
    ? text
    : fallback
}
