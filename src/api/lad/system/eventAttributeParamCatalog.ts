/** 消息模板可变参数（与事件属性配置占位符一致） */
export interface MessageVariableParam {
  /** 模板中的参数形式，如 {时间} */
  param: string
  /** 系统编码 */
  code: string
}

export const MESSAGE_VARIABLE_PARAMS: MessageVariableParam[] = [
  { param: '{时间}', code: 'time' },
  { param: '{设备类型}', code: 'deviceType' },
  { param: '{设备名称}', code: 'deviceName' },
  { param: '{设备ID}', code: 'deviceId' },
  { param: '{目标类型}', code: 'targetKind' },
  { param: '{目标型号}', code: 'targetModel' },
  { param: '{目标ID}', code: 'targetId' },
  { param: '{规则名称}', code: 'ruleName' },
  { param: '{反制动作}', code: 'countermeasureAction' },
  { param: '{编码}', code: 'targetCode' },
  { param: '{无人机/非无人机}', code: 'uavKind' },
  { param: '{逗留时间}', code: 'dwellDuration' },
  { param: '{经纬度}', code: 'coordinates' },
  { param: '{故障类型}', code: 'faultType' }
]
