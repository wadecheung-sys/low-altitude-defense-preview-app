import type {
  DictEntryItem,
  DictEntryListResult,
  DictEntryQuery,
  DictEntrySavePayload,
  DictTypeItem,
  DictTypeQuery,
  DictTypeListResult,
  DictTypeSavePayload
} from './types'
import { LAD_TARGET_MODELS } from '@/constants/ladTargetModels'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const dictTypesSeed: DictTypeItem[] = [
  {
    id: 'dt-001',
    dictCode: 'list_type',
    dictName: '黑白名单类型',
    remark: '黑名单/白名单/未知',
    itemCount: 3,
    updatedAt: '2026-05-18 10:00:00'
  },
  {
    id: 'dt-002',
    dictCode: 'target_type',
    dictName: '目标类型',
    itemCount: 4,
    updatedAt: '2026-05-18 10:05:00'
  },
  {
    id: 'dt-003',
    dictCode: 'threat_level',
    dictName: '威胁等级',
    itemCount: 4,
    updatedAt: '2026-05-19 09:00:00'
  },
  {
    id: 'dt-004',
    dictCode: 'device_type',
    dictName: '设备类型',
    itemCount: 5,
    updatedAt: '2026-05-19 14:00:00'
  },
  {
    id: 'dt-007',
    dictCode: 'area_region_type',
    dictName: '区域类型',
    remark: '与区域管理一致，供威胁评估等模块引用',
    itemCount: 9,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'dt-008',
    dictCode: 'target_model',
    dictName: '目标型号',
    remark: '历史事件、黑白名单与威胁评估共用',
    itemCount: LAD_TARGET_MODELS.length,
    updatedAt: '2026-06-25 10:00:00'
  }
]

const dictEntriesSeed: DictEntryItem[] = [
  {
    id: 'de-001',
    dictTypeId: 'dt-001',
    label: '黑名单',
    value: 'black',
    sort: 1,
    updatedAt: '2026-05-18 10:00:00'
  },
  {
    id: 'de-002',
    dictTypeId: 'dt-001',
    label: '白名单',
    value: 'white',
    sort: 2,
    updatedAt: '2026-05-18 10:00:00'
  },
  {
    id: 'de-003',
    dictTypeId: 'dt-001',
    label: '未知',
    value: 'unknown',
    sort: 3,
    updatedAt: '2026-05-18 10:00:00'
  },
  {
    id: 'de-004',
    dictTypeId: 'dt-002',
    label: '多旋翼',
    value: 'multirotor',
    sort: 1,
    updatedAt: '2026-05-18 10:05:00'
  },
  {
    id: 'de-005',
    dictTypeId: 'dt-002',
    label: '固定翼',
    value: 'fixed',
    sort: 2,
    updatedAt: '2026-05-18 10:05:00'
  },
  {
    id: 'de-006',
    dictTypeId: 'dt-002',
    label: '行业级',
    value: 'industry',
    sort: 3,
    updatedAt: '2026-05-18 10:05:00'
  },
  {
    id: 'de-007',
    dictTypeId: 'dt-002',
    label: '未知',
    value: 'unknown',
    sort: 4,
    updatedAt: '2026-05-18 10:05:00'
  },
  {
    id: 'de-008',
    dictTypeId: 'dt-003',
    label: '高危',
    value: 'high',
    sort: 1,
    updatedAt: '2026-05-19 09:00:00'
  },
  {
    id: 'de-009',
    dictTypeId: 'dt-003',
    label: '中危',
    value: 'medium',
    sort: 2,
    updatedAt: '2026-05-19 09:00:00'
  },
  {
    id: 'de-010',
    dictTypeId: 'dt-003',
    label: '低危',
    value: 'low',
    sort: 3,
    updatedAt: '2026-05-19 09:00:00'
  },
  {
    id: 'de-011',
    dictTypeId: 'dt-003',
    label: '无危',
    value: 'none',
    sort: 4,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-012',
    dictTypeId: 'dt-004',
    label: '雷达',
    value: 'radar',
    sort: 1,
    updatedAt: '2026-05-19 14:00:00'
  },
  {
    id: 'de-013',
    dictTypeId: 'dt-004',
    label: '光电',
    value: 'eo',
    sort: 2,
    updatedAt: '2026-05-19 14:00:00'
  },
  {
    id: 'de-014',
    dictTypeId: 'dt-004',
    label: '无线电',
    value: 'rf',
    sort: 3,
    updatedAt: '2026-05-19 14:00:00'
  },
  {
    id: 'de-015',
    dictTypeId: 'dt-004',
    label: '反制',
    value: 'jammer',
    sort: 4,
    updatedAt: '2026-05-19 14:00:00'
  },
  {
    id: 'de-016',
    dictTypeId: 'dt-004',
    label: '融合',
    value: 'fusion',
    sort: 5,
    updatedAt: '2026-05-19 14:00:00'
  },
  ...LAD_TARGET_MODELS.map((item, index) => ({
    id: `de-target-model-${String(index + 1).padStart(2, '0')}`,
    dictTypeId: 'dt-008',
    label: item,
    value: item,
    sort: index + 1,
    updatedAt: '2026-06-25 10:00:00'
  })),
  {
    id: 'de-023',
    dictTypeId: 'dt-007',
    label: '预警区',
    value: 'warning',
    sort: 1,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-024',
    dictTypeId: 'dt-007',
    label: '警戒区',
    value: 'alert',
    sort: 2,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-025',
    dictTypeId: 'dt-007',
    label: '识别处置区',
    value: 'dispose',
    sort: 3,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-026',
    dictTypeId: 'dt-007',
    label: '禁飞区',
    value: 'nofly',
    sort: 4,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-027',
    dictTypeId: 'dt-007',
    label: '报警屏蔽区',
    value: 'mask',
    sort: 5,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-028',
    dictTypeId: 'dt-007',
    label: '核岛',
    value: 'nuclear',
    sort: 6,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-029',
    dictTypeId: 'dt-007',
    label: '乏燃料水池',
    value: 'pool',
    sort: 7,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-030',
    dictTypeId: 'dt-007',
    label: '试飞区',
    value: 'testflight',
    sort: 8,
    updatedAt: '2026-05-21 10:00:00'
  },
  {
    id: 'de-031',
    dictTypeId: 'dt-007',
    label: '其他',
    value: 'other',
    sort: 9,
    updatedAt: '2026-05-21 10:00:00'
  }
]

let allTypes: DictTypeItem[] = dictTypesSeed.map((r) => ({ ...r }))
let allEntries: DictEntryItem[] = dictEntriesSeed.map((r) => ({ ...r }))

function syncTypeItemCount() {
  allTypes = allTypes.map((t) => ({
    ...t,
    itemCount: allEntries.filter((e) => e.dictTypeId === t.id).length
  }))
}

syncTypeItemCount()

function filterTypes(params: DictTypeQuery): DictTypeItem[] {
  let rows = [...allTypes]
  if (params.dictCode?.trim()) {
    const kw = params.dictCode.trim().toLowerCase()
    rows = rows.filter((r) => r.dictCode.toLowerCase().includes(kw))
  }
  if (params.dictName?.trim()) {
    const kw = params.dictName.trim().toLowerCase()
    rows = rows.filter((r) => r.dictName.toLowerCase().includes(kw))
  }
  return rows
}

export function queryDictTypeList(params: DictTypeQuery): DictTypeListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const filtered = filterTypes(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length
  }
}

export function getDictType(id: string): DictTypeItem | null {
  const row = allTypes.find((t) => t.id === id)
  return row ? { ...row } : null
}

export function saveDictType(body: DictTypeSavePayload): DictTypeItem {
  const now = formatNow()
  if (body.id) {
    const idx = allTypes.findIndex((t) => t.id === body.id)
    if (idx < 0) throw new Error('字典不存在')
    if (allTypes.some((t) => t.dictCode === body.dictCode && t.id !== body.id)) {
      throw new Error('字典编码已存在')
    }
    const row: DictTypeItem = {
      ...allTypes[idx],
      dictCode: body.dictCode.trim(),
      dictName: body.dictName.trim(),
      remark: body.remark,
      updatedAt: now
    }
    allTypes[idx] = row
    return { ...row }
  }
  if (allTypes.some((t) => t.dictCode === body.dictCode)) {
    throw new Error('字典编码已存在')
  }
  const id = `dt-${Date.now()}`
  const row: DictTypeItem = {
    id,
    dictCode: body.dictCode.trim(),
    dictName: body.dictName.trim(),
    remark: body.remark,
    itemCount: 0,
    updatedAt: now
  }
  allTypes.push(row)
  return { ...row }
}

export function deleteDictType(id: string) {
  allTypes = allTypes.filter((t) => t.id !== id)
  allEntries = allEntries.filter((e) => e.dictTypeId !== id)
  syncTypeItemCount()
}

/** 按字典编码获取字典项（供业务下拉/展示） */
export function queryDictEntriesByCode(dictCode: string): DictEntryItem[] {
  const type = allTypes.find((t) => t.dictCode === dictCode)
  if (!type) return []
  return allEntries
    .filter((e) => e.dictTypeId === type.id)
    .sort((a, b) => a.sort - b.sort)
    .map((e) => ({ ...e }))
}

export function queryDictEntryList(params: DictEntryQuery): DictEntryListResult {
  const dictType = getDictType(params.dictTypeId)
  let rows = allEntries.filter((e) => e.dictTypeId === params.dictTypeId)
  if (params.label?.trim()) {
    const kw = params.label.trim().toLowerCase()
    rows = rows.filter(
      (r) => r.label.toLowerCase().includes(kw) || r.value.toLowerCase().includes(kw)
    )
  }
  rows.sort((a, b) => a.sort - b.sort)
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 50
  const start = (pageIndex - 1) * pageSize
  return {
    dictType,
    list: rows.slice(start, start + pageSize),
    total: rows.length
  }
}

export function saveDictEntry(body: DictEntrySavePayload): DictEntryItem {
  const now = formatNow()
  if (body.id) {
    const idx = allEntries.findIndex((e) => e.id === body.id)
    if (idx < 0) throw new Error('字典项不存在')
    const row: DictEntryItem = {
      ...allEntries[idx],
      label: body.label.trim(),
      value: body.value.trim(),
      sort: body.sort,
      remark: body.remark,
      updatedAt: now
    }
    allEntries[idx] = row
    syncTypeItemCount()
    return { ...row }
  }
  const row: DictEntryItem = {
    id: `de-${Date.now()}`,
    dictTypeId: body.dictTypeId,
    label: body.label.trim(),
    value: body.value.trim(),
    sort: body.sort,
    remark: body.remark,
    updatedAt: now
  }
  allEntries.push(row)
  syncTypeItemCount()
  return { ...row }
}

export function deleteDictEntry(id: string) {
  allEntries = allEntries.filter((e) => e.id !== id)
  syncTypeItemCount()
}

export function deleteDictEntries(ids: string[]) {
  const set = new Set(ids)
  allEntries = allEntries.filter((e) => !set.has(e.id))
  syncTypeItemCount()
}
