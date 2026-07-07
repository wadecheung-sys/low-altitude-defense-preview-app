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

const PARAM_SEED: SystemParam[] = [
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
  },
  {
    id: 'sp-011',
    paramKey: 'control.intrusion.grace.seconds',
    paramName: '真实入侵宽容时间',
    group: '管制',
    valueType: 'number',
    paramValue: 30,
    remark: '单位：秒。低于该时长不视为真实进入更高级别管制区域',
    updatedAt: '2026-06-01 09:00:00'
  },
  {
    id: 'sp-012',
    paramKey: 'device.control.safety.lock.minutes',
    paramName: '设备控制安全锁默认有效时间',
    group: '安全',
    valueType: 'number',
    paramValue: 15,
    remark: '单位：分钟。一次输入密码后，默认该时长内设备控制操作有效',
    updatedAt: '2026-06-01 09:00:00'
  },
  {
    id: 'sp-013',
    paramKey: 'simulate.temperature',
    paramName: '模拟温度',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '单位：℃。留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  },
  {
    id: 'sp-014',
    paramKey: 'simulate.humidity',
    paramName: '模拟湿度',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '单位：%。留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  },
  {
    id: 'sp-015',
    paramKey: 'simulate.wind',
    paramName: '模拟风力',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '单位：级。留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  },
  {
    id: 'sp-016',
    paramKey: 'simulate.rainfall',
    paramName: '模拟雨量',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '单位：mm/h。留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  }
]

function cloneParamSeed(): SystemParam[] {
  return PARAM_SEED.map((row) => ({ ...row }))
}

let allParams: SystemParam[] = cloneParamSeed()

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

export function restoreSystemParamsToDefaults(): true {
  allParams = cloneParamSeed()
  return true
}

/** 读取数值参数；模拟类留空（null）时返回 null，不参与运算 */
export function getNumericSystemParam(paramKey: string): number | null {
  const row = allParams.find((item) => item.paramKey === paramKey)
  if (!row || row.valueType !== 'number') return null
  if (row.paramValue === null || row.paramValue === '') return null
  const value = Number(row.paramValue)
  return Number.isFinite(value) ? value : null
}

export function isSimulateParamActive(paramKey: string): boolean {
  return getNumericSystemParam(paramKey) !== null
}
