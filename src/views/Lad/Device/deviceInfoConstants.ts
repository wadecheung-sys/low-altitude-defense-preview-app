export const DEVICE_INFO_SEARCH_COL = { span: 6 } as const

export const deviceInfoTypeOptions = [
  { label: '雷达', value: '雷达' },
  { label: '无线电侦测', value: '无线电侦测' },
  { label: 'Remote-ID 监视', value: 'Remote-ID 监视' },
  { label: 'ADS-B 监视', value: 'ADS-B 监视' },
  { label: '无线电干扰', value: '无线电干扰' },
  { label: '导航诱骗', value: '导航诱骗' },
  { label: '激光打击', value: '激光打击' },
  { label: '高功率微波', value: '高功率微波' },
  { label: '光电跟踪', value: '光电跟踪' }
]

export const deviceIconOptions = [
  { label: '干扰器', value: 'jammer' },
  { label: '雷达', value: 'radar' },
  { label: '光电', value: 'eo' },
  { label: '反制', value: 'counter' }
]
