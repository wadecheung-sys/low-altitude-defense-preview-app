/** 查询区栅格（与 DeviceInfoList / list-page-core 一致） */
export const PLAN_SEARCH_COL = { span: 6 } as const
/** 与同行查询按钮共占一行（6+6+offset+9=24） */
export const PLAN_SEARCH_DATE_COL = { span: 6 } as const

export const UI = {
  planCode: '预案编号',
  planName: '预案名称',
  planRule: '执行说明',
  planRulePlaceholder:
    '执行步骤与限制（如时长、人工确认、停止条件），不填写速度/入侵等触发条件',
  disposalMode: '处置模式',
  disposalModeAuto: '自动处置',
  disposalModeManual: '人员值守',
  manualResponseSeconds: '人工响应时间',
  manualResponseUnit: '秒',
  manualResponseHint:
    '自动处置专用：触发后进入该时间窗口，值班员可「立即执行」或「暂不执行」；超时未操作则按策略自动执行。填 0 表示不等待、立即自动执行。',
  manualResponseManualHint: '人员值守模式下不启用响应窗口，所有反制须人工确认后下发。',
  deviceType: '执行设备类型',
  deviceFunction: '设备功能',
  deviceTypeHint: '选择实际下发指令的设备类型（与设备台账对齐）',
  deviceFunctionHint:
    '选择具体功能与下发编码（如驱离、跟踪等意图已包含在功能名称中）',
  weather: '天气因素',
  weatherHint: '按触发规则内的天气场景筛选预案（列表不单独展示天气列）',
  triggerRules: '触发策略',
  triggerRuleName: '规则名称',
  triggerPriority: '匹配优先级',
  triggerRuleAdd: '新增规则',
  triggerRuleHint:
    '同一预案可配置多条场景规则；执行时按当前天气等场景匹配优先级最高的启用规则下发设备指令',
  triggerRuleEmpty: '请至少添加一条触发策略规则',
  defaultResponse: '默认响应',
  updatedBy: '修改人',
  updatedAt: '修改时间',
  enabled: '启停',
  action: '操作',
  btnAdd: '新增预案',
  btnBatchDelete: '批量删除',
  btnDetail: '详情',
  btnEdit: '编辑',
  btnDelete: '删除',
  dialogAdd: '新增预案',
  dialogEdit: '编辑预案',
  dialogDetail: '预案详情',
  btnSave: '确认编辑',
  btnCancel: '取消',
  saveOk: '保存成功',
  deleteOk: '已删除'
} as const
