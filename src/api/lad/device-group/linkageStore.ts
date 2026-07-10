import type {
  DeviceLinkageItem,
  DeviceLinkageListResult,
  DeviceLinkageQuery,
  DeviceLinkageSavePayload
} from './types'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function buildStoredRow(payload: DeviceLinkageSavePayload, id: string): DeviceLinkageItem {
  return {
    id,
    masterDeviceId: payload.masterDeviceId,
    deviceName: payload.deviceName,
    deviceCode: payload.deviceCode,
    deviceType: payload.deviceType,
    deployArea: payload.deployArea,
    linkedDeviceIds: [...payload.linkedDeviceIds],
    linkedChain: payload.linkedChain,
    enabled: payload.enabled ?? true,
    updatedAt: formatNow()
  }
}

let allLinkages: DeviceLinkageItem[] = [
  buildStoredRow(
    {
      masterDeviceId: 'di-10001',
      deviceName: '核心区转台压制-FG310F',
      deviceCode: 'DEV-FG310-01',
      deviceType: '无线电干扰',
      deployArea: '核心区制高点',
      linkedDeviceIds: ['di-20001', 'di-20002', 'di-20003'],
      linkedChain: '核心区东围墙筒机、核心区南围墙筒机、核心区西围墙枪机',
      enabled: true
    },
    'dl-1001'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10002',
      deviceName: '东侧频谱侦测-PL671F',
      deviceCode: 'DEV-PL671-01',
      deviceType: '无线电侦测',
      deployArea: '东侧瞭望台',
      linkedDeviceIds: ['di-20004', 'di-20005'],
      linkedChain: '东侧瞭望台北向枪机、东侧瞭望台南向枪机',
      enabled: true
    },
    'dl-1002'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10003',
      deviceName: '1#光电-GD',
      deviceCode: 'DEV-EO-01',
      deviceType: '光电跟踪',
      deployArea: '南门岗哨',
      linkedDeviceIds: ['di-20006', 'di-20007', 'di-20008'],
      linkedChain: '南门岗云台-东侧、南门岗云台-西侧、南门岗全景摄像机',
      enabled: true
    },
    'dl-1003'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10004',
      deviceName: '西区导航诱骗-DY506F',
      deviceCode: 'DEV-DY506-01',
      deviceType: '导航诱骗',
      deployArea: '西区机房',
      linkedDeviceIds: ['di-20009', 'di-20010'],
      linkedChain: '西区机房入口枪机、西区机房外围筒机',
      enabled: true
    },
    'dl-1004'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10005',
      deviceName: '北侧Remote-ID监视-RDS200',
      deviceCode: 'DEV-RDS200-01',
      deviceType: 'Remote-ID 监视',
      deployArea: '北侧制高点',
      linkedDeviceIds: [],
      linkedChain: '',
      enabled: true
    },
    'dl-1005'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10007',
      deviceName: '1#雷达-LD',
      deviceCode: 'DEV-RAD-01',
      deviceType: '雷达',
      deployArea: '待部署',
      linkedDeviceIds: [],
      linkedChain: '',
      enabled: true
    },
    'dl-1006'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10008',
      deviceName: '1#激光-JG',
      deviceCode: 'DEV-LSR-01',
      deviceType: '激光打击',
      deployArea: '待部署',
      linkedDeviceIds: [],
      linkedChain: '',
      enabled: true
    },
    'dl-1007'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10009',
      deviceName: '1#微波-WB',
      deviceCode: 'DEV-HPM-01',
      deviceType: '高功率微波',
      deployArea: '待部署',
      linkedDeviceIds: [],
      linkedChain: '',
      enabled: true
    },
    'dl-1008'
  )
]

allLinkages = allLinkages.map((item, index) => ({
  ...item,
  updatedAt: [
    '2026-06-01 09:20:00',
    '2026-06-01 09:35:00',
    '2026-06-01 10:10:00',
    '2026-06-02 11:00:00',
    '2026-06-02 14:00:00',
    '2026-06-03 09:00:00',
    '2026-06-03 10:30:00',
    '2026-06-03 11:45:00'
  ][index]
}))

function nextLinkageId() {
  const nums = allLinkages
    .map((item) => parseInt(item.id.replace(/^dl-/, ''), 10))
    .filter((n) => !Number.isNaN(n))
  return `dl-${(nums.length ? Math.max(...nums) : 1000) + 1}`
}

export function queryDeviceLinkageList(params: DeviceLinkageQuery): DeviceLinkageListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  let list = [...allLinkages]

  if (params.deployArea?.trim()) {
    const keyword = params.deployArea.trim()
    list = list.filter((item) => item.deployArea.includes(keyword))
  }
  if (params.deviceType) {
    list = list.filter((item) => item.deviceType === params.deviceType)
  }
  if (params.deviceName?.trim()) {
    const keyword = params.deviceName.trim().toLowerCase()
    list = list.filter((item) => item.deviceName.toLowerCase().includes(keyword))
  }
  if (params.deviceCode?.trim()) {
    const keyword = params.deviceCode.trim().toLowerCase()
    list = list.filter((item) => item.deviceCode.toLowerCase().includes(keyword))
  }
  if (typeof params.enabled === 'boolean') {
    list = list.filter((item) => item.enabled === params.enabled)
  }

  const start = (pageIndex - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length
  }
}

export function saveDeviceLinkageRecord(payload: DeviceLinkageSavePayload): DeviceLinkageItem {
  if (payload.id) {
    const index = allLinkages.findIndex((item) => item.id === payload.id)
    if (index < 0) throw new Error('设备关联不存在')
    const next = buildStoredRow(payload, payload.id)
    allLinkages[index] = next
    return next
  }

  const created = buildStoredRow(payload, nextLinkageId())
  allLinkages = [created, ...allLinkages]
  return created
}

export function deleteDeviceLinkageRecords(ids: string[]) {
  const idSet = new Set(ids)
  allLinkages = allLinkages.filter((item) => !idSet.has(item.id))
}

export function getLinkageByMasterDeviceId(masterDeviceId: string): DeviceLinkageItem | null {
  return allLinkages.find((item) => item.masterDeviceId === masterDeviceId && item.enabled) ?? null
}
