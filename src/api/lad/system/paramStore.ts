import type {
  SystemParam,
  SystemParamListResult,
  SystemParamQuery,
  SystemParamSavePayload
} from './types'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}

const seed: SystemParam[] = [
  {
    id: 'sp-001',
    paramKey: 'sys.platform.name',
    paramName: '平台名称',
    group: '系统',
    valueType: 'string',
    paramValue: '低空防御指挥控制平台',
    remark: '登录页与页面标题展示',
    updatedAt: '2026-05-18 09:00:00'
  },
  {
    id: 'sp-007',
    paramKey: 'map.default.lng',
    paramName: '地图默认经度',
    group: '地图',
    valueType: 'number',
    paramValue: 116.397128,
    updatedAt: '2026-05-20 08:00:00'
  },
  {
    id: 'sp-008',
    paramKey: 'map.default.lat',
    paramName: '地图默认纬度',
    group: '地图',
    valueType: 'number',
    paramValue: 39.916527,
    updatedAt: '2026-05-20 08:00:00'
  },
  {
    id: 'sp-009',
    paramKey: 'map.zoom.scale',
    paramName: '地图缩放比例',
    group: '地图',
    valueType: 'number',
    paramValue: 1.0,
    updatedAt: '2026-05-20 08:30:00'
  },
  {
    id: 'sp-010',
    paramKey: 'data.retention.days',
    paramName: '历史数据保留天数',
    group: '数据',
    valueType: 'number',
    paramValue: 90,
    remark: '飞行记录与日志保留周期',
    updatedAt: '2026-05-20 11:00:00'
  }
]

const allParams: SystemParam[] = seed.map((row) => ({ ...row }))

function filterParams(params: SystemParamQuery): SystemParam[] {
  let rows = [...allParams]
  if (params.paramName?.trim()) {
    const keyword = params.paramName.trim().toLowerCase()
    rows = rows.filter((row) => row.paramName.toLowerCase().includes(keyword))
  }
  if (params.valueType) {
    rows = rows.filter((row) => row.valueType === params.valueType)
  }
  if (params.remark?.trim()) {
    const keyword = params.remark.trim().toLowerCase()
    rows = rows.filter((row) => (row.remark || '').toLowerCase().includes(keyword))
  }
  if (params.updatedAtStart) {
    rows = rows.filter((row) => row.updatedAt >= params.updatedAtStart!)
  }
  if (params.updatedAtEnd) {
    rows = rows.filter((row) => row.updatedAt <= params.updatedAtEnd!)
  }
  return rows
}

export function querySystemParamList(params: SystemParamQuery): SystemParamListResult {
  const pageIndex = Number(params.pageIndex) || 1
  const pageSize = Number(params.pageSize) || 10
  const filtered = filterParams(params)
  const start = (pageIndex - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length
  }
}

export function saveSystemParam(body: SystemParamSavePayload): SystemParam {
  if (body.id) {
    const idx = allParams.findIndex((row) => row.id === body.id)
    if (idx < 0) throw new Error('参数不存在')
    const row = {
      ...allParams[idx],
      paramValue: body.paramValue,
      updatedAt: formatNow()
    }
    allParams[idx] = row
    return { ...row }
  }

  const paramKey = body.paramKey?.trim()
  const paramName = body.paramName?.trim()
  if (!paramKey || !paramName) throw new Error('请填写参数键与参数名称')
  if (allParams.some((row) => row.paramKey === paramKey)) throw new Error('参数键已存在')

  const valueType = body.valueType || 'string'
  const row: SystemParam = {
    id: `sp-${Date.now()}`,
    paramKey,
    paramName,
    group: '系统',
    valueType,
    paramValue: body.paramValue,
    remark: body.remark?.trim() || undefined,
    updatedAt: formatNow()
  }
  allParams.unshift(row)
  return { ...row }
}
