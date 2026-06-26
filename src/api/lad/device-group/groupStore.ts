import { queryDeviceInfoList } from '../device-info/infoStore'
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

function seedMemberIds(offset: number, count: number) {
  const { list } = queryDeviceInfoList({ pageIndex: 1, pageSize: 999 })
  return list.slice(offset, offset + count).map((item) => item.id)
}

let allGroups: DeviceGroupItem[] = [
  {
    id: 'dg-1001',
    groupCode: 'GRP-DET-01',
    groupName: '北区探测协同组',
    groupType: '探测组',
    description: '用于北区空域多源探测融合与联合告警。',
    memberIds: seedMemberIds(0, 3),
    enabled: true,
    updatedAt: '2026-06-01 09:20:00'
  },
  {
    id: 'dg-1002',
    groupCode: 'GRP-CM-01',
    groupName: '核心区反制处置组',
    groupType: '反制组',
    description: '用于核心区入侵目标的干扰、诱骗与近距反制联动。',
    memberIds: seedMemberIds(0, 4),
    enabled: true,
    updatedAt: '2026-06-01 09:35:00'
  },
  {
    id: 'dg-1003',
    groupCode: 'GRP-EO-01',
    groupName: '南门光电观察组',
    groupType: '光电协同组',
    description: '用于南门方向目标复核、锁定与画面回传。',
    memberIds: seedMemberIds(1, 2),
    enabled: true,
    updatedAt: '2026-06-01 10:10:00'
  }
]

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
  const updatedAt = formatNow()

  if (payload.id) {
    const index = allGroups.findIndex((item) => item.id === payload.id)
    if (index < 0) throw new Error('设备组不存在')
    const next: DeviceGroupItem = {
      ...allGroups[index],
      groupName: payload.groupName.trim(),
      groupType: payload.groupType,
      description: payload.description.trim(),
      memberIds: [...payload.memberIds],
      enabled: payload.enabled,
      updatedAt
    }
    allGroups[index] = next
    return next
  }

  const created: DeviceGroupItem = {
    id: nextGroupId(),
    groupCode: payload.groupCode?.trim() || nextGroupCode(payload.groupType),
    groupName: payload.groupName.trim(),
    groupType: payload.groupType,
    description: payload.description.trim(),
    memberIds: [...payload.memberIds],
    enabled: payload.enabled,
    updatedAt
  }
  allGroups = [created, ...allGroups]
  return created
}

export function deleteDeviceGroupRecord(id: string) {
  allGroups = allGroups.filter((item) => item.id !== id)
}
