import type { DictEntryItem } from '@/api/lad/system/types'
import { allOption, targetModelOptions } from '../shared/ladOptionConstants'

/** 查询栅格布局（与预案策略页一致） */
export const THREAT_SEARCH_COL = { span: 6 } as const

/** 威胁评估页目标型号（不含蜂群目标） */
export const threatTargetModelOptions = targetModelOptions.filter((o) => o.value !== '蜂群目标')

/** 表单/模拟测试共用的「全部型号」选项 */
export const threatTargetModelAllOption = { label: '全部型号', value: '全部型号' } as const

/** 编辑、模拟测试等表单下拉（与列表筛选项区分） */
export const threatTargetModelSelectOptions = [
  threatTargetModelAllOption,
  ...threatTargetModelOptions
]

/** 列表筛选：首项「全部」表示不过滤 */
export const threatTargetModelFilterOptions = [allOption, ...threatTargetModelOptions]

/** 表单/筛选共用的威胁等级下拉（首项「全部」） */
export function buildThreatLevelSelectOptions(entries: DictEntryItem[]) {
  return [
    allOption,
    ...entries.map((item) => ({ label: item.label, value: item.label }))
  ]
}

export const UI = {
  ruleName: '规则名称',
  threatLevel: '威胁等级',
  threatLevelHint:
    '由威胁评估规则输出；后续可扩展为按威胁等级关联预案，当前阶段由本列表直接关联触发预案',
  areaRegionType: '区域类型',
  areaRegionTypeHint: '与区域管理一致，枚举值在字典管理（area_region_type）中维护',
  targetType: '名单类型',
  swarmHint: '蜂群维度：同时探测机数≥3 时默认提升威胁等级，建议关联激光/高功率微波预案而非驱离。',
  swarmCount: '蜂群机数',
  targetProperty: '目标属性',
  status: '状态',
  area: '区域',
  priority: '优先级',
  conditions: '触发条件',
  triggerPlan: '触发预案',
  triggerPlanHint: '规则命中后触发所选预案；具体设备动作由预案定义',
  enabled: '状态',
  action: '操作',
  btnAdd: '新增规则',
  btnSimulate: '模拟测试',
  btnBatchDelete: '批量删除',
  btnDetail: '详情',
  btnEdit: '编辑',
  btnDelete: '删除',
  dialogAdd: '新增规则',
  dialogEdit: '编辑规则',
  dialogSimulate: '模拟测试',
  simulateTabGeneral: '一般模式',
  simulateTabSwarm: '蜂群模式',
  simulateGeneralPresetHint:
    '默认参数可命中规则「保护区-自动驱离」；表单字段与编辑规则一致（不含规则名称），命中后在下方显示规则名称与处置结果。',
  simulateSwarmPresetHint: '默认参数可命中蜂群反制类规则，用于对比一般模式与蜂群模式的评估差异。',
  simulateRun: '开始模拟',
  simulateResultSuccess: '模拟命中规则',
  simulateResultFail: '模拟未命中',
  simulateMatchedRule: '命中规则',
  simulateDisposalMode: '处置模式',
  simulateTriggerStrategy: '预案触发策略',
  simulateDeviceAction: '设备动作',
  fallbackTag: '兜底',
  dialogDetail: '规则详情',
  detailThreatLevel: '威胁等级',
  detailAlarmLevel: '告警等级参考',
  detailTriggerNote: '触发说明',
  detailRuleSummary: '规则摘要',
  detailLevelHint: '（可在编辑规则时调整；后续可扩展按等级关联预案）',
  detailDeviceType: '关联预案设备',
  detailDeviceFunction: '设备功能',
  btnSave: '确认编辑',
  btnCancel: '取消',
  btnAddCondition: '新增',
  conditionDelete: '删除',
  saveOk: '保存成功',
  deleteOk: '已删除',
  statusEnabled: '启用',
  statusDisabled: '停用'
} as const
