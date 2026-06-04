import type {
  SystemParam,
  SystemParamQuery,
  SystemParamListResult,
  SystemParamSavePayload
} from './types'

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const seed: SystemParam[] = [
  {
    id: 'sp-001',
    paramKey: 'sys.platform.name',
    paramName: '平台名称',
    group: '系统',
    valueType: 'string',
    paramValue: '低空防御综合管控平台',
    remark: '登录页与页眉展示',
    updatedAt: '2026-05-18 09:00:00'
  },
  {
    id: 'sp-002',
    paramKey: 'sys.session.timeout',
    paramName: '会话超时(分钟)',
    group: '系统',
    valueType: 'number',
    paramValue: 30,
    updatedAt: '2026-05-18 09:10:00'
  },
  {
    id: 'sp-003',
    paramKey: 'sys.audit.enabled',
    paramName: '启用操作审计',
    group: '系统',
    valueType: 'boolean',
    paramValue: true,
    updatedAt: '2026-05-18 09:12:00'
  },
  {
    id: 'sp-004',
    paramKey: 'alarm.sound.enabled',
    paramName: '声光告警开关',
    group: '告警',
    valueType: 'boolean',
    paramValue: true,
    updatedAt: '2026-05-19 10:00:00'
  },
  {
    id: 'sp-005',
    paramKey: 'alarm.repeat.interval',
    paramName: '重复告警间隔(秒)',
    group: '告警',
    valueType: 'number',
    paramValue: 60,
    updatedAt: '2026-05-19 10:05:00'
  },
  {
    id: 'sp-006',
    paramKey: 'alarm.blacklist.auto',
    paramName: '黑名单自动告警',
    group: '告警',
    valueType: 'boolean',
    paramValue: true,
    updatedAt: '2026-05-19 10:08:00'
  },
  {
    id: 'sp-007',
    paramKey: 'map.default.lng',
    paramName: '默认经度',
    group: '地图',
    valueType: 'number',
    paramValue: 116.397128,
    updatedAt: '2026-05-20 08:00:00'
  },
  {
    id: 'sp-008',
    paramKey: 'map.default.lat',
    paramName: '默认纬度',
    group: '地图',
    valueType: 'number',
    paramValue: 39.916527,
    updatedAt: '2026-05-20 08:00:00'
  },
  {
    id: 'sp-009',
    paramKey: 'map.provider',
    paramName: '地图服务标识',
    group: '地图',
    valueType: 'string',
    paramValue: 'geoq-community',
    updatedAt: '2026-05-20 08:30:00'
  },
  {
    id: 'sp-010',
    paramKey: 'data.retention.days',
    paramName: '历史数据保留天数',
    group: '数据',
    valueType: 'number',
    paramValue: 90,
    remark: '飞行记录与日志',
    updatedAt: '2026-05-20 11:00:00'
  },
  {
    id: 'sp-011',
    paramKey: 'data.export.maxRows',
    paramName: '单次导出上限',
    group: '数据',
    valueType: 'number',
    paramValue: 5000,
    updatedAt: '2026-05-20 11:05:00'
  },
  {
    id: 'sp-012',
    paramKey: 'data.mock.enabled',
    paramName: '演示数据模式',
    group: '数据',
    valueType: 'boolean',
    paramValue: true,
    updatedAt: '2026-05-20 11:10:00'
  }
]

let allParams: SystemParam[] = seed.map((r) => ({ ...r }))

function filterParams(params: SystemParamQuery): SystemParam[] {
  let rows = [...allParams]
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim().toLowerCase()
    rows = rows.filter(
      (r) =>
        r.paramKey.toLowerCase().includes(kw) ||
        r.paramName.toLowerCase().includes(kw) ||
        String(r.paramValue).toLowerCase().includes(kw)
    )
  }
  if (params.group) {
    rows = rows.filter((r) => r.group === params.group)
  }
  if (params.valueType) {
    rows = rows.filter((r) => r.valueType === params.valueType)
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
  const idx = allParams.findIndex((r) => r.id === body.id)
  if (idx < 0) throw new Error('参数不存在')
  const row = {
    ...allParams[idx],
    paramValue: body.paramValue,
    updatedAt: formatNow()
  }
  allParams[idx] = row
  return { ...row }
}
