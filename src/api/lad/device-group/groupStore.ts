import { buildMemberIds, deriveGroupType } from './deviceGroupCatalog'
import type {
  DeviceGroupItem,
  DeviceGroupListResult,
  DeviceGroupQuery,
  DeviceGroupSavePayload
} from './types'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function buildStoredRow(payload: DeviceGroupSavePayload, id: string, groupCode: string): DeviceGroupItem {
  const groupType = deriveGroupType(payload.deviceType)
  const linkedDeviceIds = [...payload.linkedDeviceIds]
  return {
    id,
    masterDeviceId: payload.masterDeviceId,
    deviceName: payload.deviceName,
    deviceCode: payload.deviceCode,
    deviceType: payload.deviceType,
    deployArea: payload.deployArea,
    linkedDeviceIds,
    linkedChain: payload.linkedChain,
    enabled: payload.enabled ?? true,
    updatedAt: formatNow(),
    groupName: payload.deviceName,
    groupCode,
    groupType,
    memberIds: buildMemberIds(payload.masterDeviceId, linkedDeviceIds),
    description: payload.description?.trim() || ''
  }
}

let allGroups: DeviceGroupItem[] = [
  buildStoredRow(
    {
      masterDeviceId: 'di-10001',
      deviceName: '核心区转台压制-FG310F',
      deviceCode: 'DEV-FG310-01',
      deviceType: '无线电干扰',
      deployArea: '核心区制高点',
      linkedDeviceIds: ['di-20001', 'di-20002', 'di-20003'],
      linkedChain: 'FG310F压制-东向监控、FG310F压制-南向监控、FG310F压制-西向监控',
      enabled: true
    },
    'dg-1001',
    'GRP-CM-01'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10002',
      deviceName: '东侧频谱侦测-PL671F',
      deviceCode: 'DEV-PL671-01',
      deviceType: '无线电侦测',
      deployArea: '东侧瞭望台',
      linkedDeviceIds: ['di-20004', 'di-20005'],
      linkedChain: 'PL671F侦测-北侧监控、PL671F侦测-南侧监控',
      enabled: true
    },
    'dg-1002',
    'GRP-DET-01'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10003',
      deviceName: '1#光电-GD',
      deviceCode: 'DEV-EO-01',
      deviceType: '光电跟踪',
      deployArea: '南门岗哨',
      linkedDeviceIds: ['di-20006', 'di-20007', 'di-20008'],
      linkedChain: '光电跟踪-东侧监控、光电跟踪-西侧监控、光电跟踪-岗哨全景监控',
      enabled: true
    },
    'dg-1003',
    'GRP-EO-01'
  ),
  buildStoredRow(
    {
      masterDeviceId: 'di-10004',
      deviceName: '西区导航诱骗-DY506F',
      deviceCode: 'DEV-DY506-01',
      deviceType: '导航诱骗',
      deployArea: '西区机房',
      linkedDeviceIds: ['di-20009', 'di-20010'],
      linkedChain: 'DY506F诱骗-机房入口监控、DY506F诱骗-外围监控',
      enabled: true
    },
    'dg-1004',
    'GRP-CM-02'
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
    'dg-1005',
    'GRP-RID-01'
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
    'dg-1006',
    'GRP-RAD-TBD'
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
    'dg-1007',
    'GRP-LSR-TBD'
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
    'dg-1008',
    'GRP-HPM-TBD'
  )
]

allGroups = allGroups.map((item, index) => ({
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

function nextGroupId() {
  const nums = allGroups
    .map((item) => parseInt(item.id.replace(/^dg-/, ''), 10))
    .filter((n) => !Number.isNaN(n))
  return `dg-${(nums.length ? Math.max(...nums) : 1000) + 1}`
}

function nextGroupCode(groupType: string) {
  const prefixMap: Record<string, string> = {
    探测组: 'GRP-DET',
    反制组: 'GRP-CM',
    光电协同组: 'GRP-EO',
    综合联动组: 'GRP-LNK'
  }
  const prefix = prefixMap[groupType] || 'GRP-LAD'
  const current = allGroups.filter((item) => item.groupCode.startsWith(prefix)).length + 1
  return `${prefix}-${String(current).padStart(2, '0')}`
}

export function queryDeviceGroupList(params: DeviceGroupQuery): DeviceGroupListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  let list = [...allGroups]

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
  if (params.groupCode?.trim()) {
    const keyword = params.groupCode.trim().toLowerCase()
    list = list.filter((item) => item.groupCode.toLowerCase().includes(keyword))
  }
  if (params.groupName?.trim()) {
    const keyword = params.groupName.trim().toLowerCase()
    list = list.filter((item) => item.groupName.toLowerCase().includes(keyword))
  }
  if (params.groupType) {
    list = list.filter((item) => item.groupType === params.groupType)
  }
  if (params.description?.trim()) {
    const keyword = params.description.trim().toLowerCase()
    list = list.filter((item) => item.description.toLowerCase().includes(keyword))
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

export function saveDeviceGroupRecord(payload: DeviceGroupSavePayload): DeviceGroupItem {
  if (payload.id) {
    const index = allGroups.findIndex((item) => item.id === payload.id)
    if (index < 0) throw new Error('设备组不存在')
    const next = buildStoredRow(payload, payload.id, allGroups[index].groupCode)
    allGroups[index] = next
    return next
  }

  const groupType = deriveGroupType(payload.deviceType)
  const created = buildStoredRow(
    payload,
    nextGroupId(),
    payload.groupCode?.trim() || nextGroupCode(groupType)
  )
  allGroups = [created, ...allGroups]
  return created
}

export function deleteDeviceGroupRecords(ids: string[]) {
  const idSet = new Set(ids)
  allGroups = allGroups.filter((item) => !idSet.has(item.id))
}

export function getDeviceGroupsByRefIds(refIds: string[]): DeviceGroupItem[] {
  return refIds.flatMap((id) => allGroups.filter((item) => item.id === id))
}

export function getLinkageByMasterDeviceId(masterDeviceId: string): DeviceGroupItem | null {
  return allGroups.find((item) => item.masterDeviceId === masterDeviceId && item.enabled) ?? null
}
