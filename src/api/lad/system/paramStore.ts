import type {
  SystemParam,
  SystemParamListResult,
  SystemParamQuery,
  SystemParamSavePayload
} from './types'
import {
  LAD_DEFAULT_DATA_SOURCE,
  LAD_DEFAULT_DATA_SOURCE_PARAM_KEY,
  normalizeLadDataSource
} from '@/constants/ladDataSources'

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
    id: 'sp-002',
    paramKey: LAD_DEFAULT_DATA_SOURCE_PARAM_KEY,
    paramName: '默认数据来源形式',
    group: '系统',
    valueType: 'string',
    paramValue: LAD_DEFAULT_DATA_SOURCE,
    remark: '历史事件数据来源缺省值；建议采用设备类型或设备组合，如雷达、雷达+无线电、多源数据融合',
    updatedAt: '2026-07-14 18:00:00'
  },
  {
    id: 'sp-010',
    paramKey: 'data.retention.days',
    paramName: '历史数据保留（天）',
    group: '存储',
    valueType: 'number',
    paramValue: 90,
    remark: '飞行记录与日志保留周期',
    updatedAt: '2026-05-20 11:00:00'
  },
  {
    id: 'sp-020',
    paramKey: 'storage.local.record.max.duration.seconds',
    paramName: '本地录制默认最大时长（秒）',
    group: '存储',
    valueType: 'number',
    paramValue: 30,
    updatedAt: '2026-05-20 11:00:00'
  },
  {
    id: 'sp-011',
    paramKey: 'control.intrusion.grace.seconds',
    paramName: '真实入侵宽容时间（秒）',
    group: '管制',
    valueType: 'number',
    paramValue: 30,
    remark: '低于该时长不视为真实进入更高级别管制区域',
    updatedAt: '2026-06-01 09:00:00'
  },
  {
    id: 'sp-012',
    paramKey: 'control.target.lost.judge.seconds',
    paramName: '目标丢失判定时间（秒）',
    group: '管制',
    valueType: 'number',
    paramValue: 30,
    remark:
      '目标自离/驱离/反制后，连续丢失飞行特征信息超过本时间，则视为目标丢失，可应用于「目标结果」判定是否处置完成。',
    updatedAt: '2026-06-01 09:00:00'
  },
  {
    id: 'sp-013',
    paramKey: 'simulate.temperature',
    paramName: '模拟温度（℃）',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  },
  {
    id: 'sp-014',
    paramKey: 'simulate.humidity',
    paramName: '模拟湿度（%）',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  },
  {
    id: 'sp-015',
    paramKey: 'simulate.wind',
    paramName: '模拟风力（m/s）',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  },
  {
    id: 'sp-016',
    paramKey: 'simulate.rainfall',
    paramName: '模拟雨量（mm/h）',
    group: '模拟',
    valueType: 'number',
    paramValue: null,
    remark: '留空不触发；填写数值后参与环境演算',
    updatedAt: '2026-06-01 10:00:00'
  },
  {
    id: 'sp-017',
    paramKey: 'alarm.audio.file',
    paramName: '告警音频',
    group: '告警',
    valueType: 'string',
    paramValue: '蜂鸣.wav',
    remark: '上传告警音频文件，支持 mp3 / wav / aac',
    updatedAt: '2026-06-15 09:00:00'
  },
  {
    id: 'sp-018',
    paramKey: 'alarm.audio.max.duration.seconds',
    paramName: '持续时间（秒）',
    group: '告警',
    valueType: 'number',
    paramValue: 30,
    remark: '告警音频播放的最长持续时间',
    updatedAt: '2026-06-15 09:00:00'
  },
  {
    id: 'sp-019',
    paramKey: 'alarm.visual.mode',
    paramName: '告警视觉表现形式',
    group: '告警',
    valueType: 'string',
    paramValue: '闪烁',
    remark: '可选：闪烁、常亮',
    updatedAt: '2026-06-15 09:00:00'
  }
]

function cloneParamSeed(): SystemParam[] {
  return PARAM_SEED.map((row) => ({ ...row }))
}

let allParams: SystemParam[] = cloneParamSeed()

export const SYSTEM_PARAM_STORE_VERSION = 8

function ensureStoreVersion() {
  const g = globalThis as { __ladSystemParamStoreVer?: number }
  if (g.__ladSystemParamStoreVer === SYSTEM_PARAM_STORE_VERSION) return
  g.__ladSystemParamStoreVer = SYSTEM_PARAM_STORE_VERSION
  allParams = cloneParamSeed()
}

ensureStoreVersion()

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
  ensureStoreVersion()
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
  const g = globalThis as { __ladSystemParamStoreVer?: number }
  g.__ladSystemParamStoreVer = SYSTEM_PARAM_STORE_VERSION
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

export function getStringSystemParam(paramKey: string, fallback = ''): string {
  ensureStoreVersion()
  const row = allParams.find((item) => item.paramKey === paramKey)
  if (!row || row.valueType !== 'string') return fallback
  const value = String(row.paramValue ?? '').trim()
  if (!value) return fallback
  if (paramKey === LAD_DEFAULT_DATA_SOURCE_PARAM_KEY) {
    return normalizeLadDataSource(value, fallback || LAD_DEFAULT_DATA_SOURCE)
  }
  return value
}
