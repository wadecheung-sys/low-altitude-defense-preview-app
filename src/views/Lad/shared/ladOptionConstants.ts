/** Shared dropdown options for LAD modules */

export const allOption = { label: '\u5168\u90e8', value: '\u5168\u90e8' }

export const areaLevelOptions = [
  allOption,
  { label: '\u4e00\u7ea7', value: '\u4e00\u7ea7' },
  { label: '\u4e8c\u7ea7', value: '\u4e8c\u7ea7' },
  { label: '\u4e09\u7ea7', value: '\u4e09\u7ea7' },
  { label: '\u8bd5\u98de\u533a', value: '\u8bd5\u98de\u533a' }
]

export const scenarioOptions = [
  { label: '\u7535\u5b50\u56f4\u680f\u5165\u4fb5', value: '\u7535\u5b50\u56f4\u680f\u5165\u4fb5' },
  { label: '\u591a\u65e0\u4eba\u673a\u8702\u7fa4\u5165\u4fb5', value: '\u591a\u65e0\u4eba\u673a\u8702\u7fa4\u5165\u4fb5' },
  { label: '\u6838\u4fdd\u573a\u666f', value: '\u6838\u4fdd\u573a\u666f' },
  { label: '\u5927\u578b\u6d3b\u52a8', value: '\u5927\u578b\u6d3b\u52a8' },
  { label: '\u8bd5\u98de\u533a', value: '\u8bd5\u98de\u533a' }
]

export const targetTypeOptions = [
  allOption,
  { label: '\u591a\u65cb\u7ffc', value: '\u591a\u65cb\u7ffc' },
  { label: '\u56fa\u5b9a\u7ffc', value: '\u56fa\u5b9a\u7ffc' },
  { label: '\u65e0\u4eba\u673a\u8702\u7fa4', value: '\u65e0\u4eba\u673a\u8702\u7fa4' },
  { label: '\u9ed1\u540d\u5355', value: '\u9ed1\u540d\u5355' },
  { label: '\u767d\u540d\u5355', value: '\u767d\u540d\u5355' }
]

export const weatherOptions = [
  allOption,
  { label: '\u6674\u5929', value: '\u6674\u5929' },
  { label: '\u9634\u5929', value: '\u9634\u5929' },
  { label: '\u96e8\u5929', value: '\u96e8\u5929' },
  { label: '\u5927\u98ce', value: '\u5927\u98ce' },
  { label: '\u5927\u96fe', value: '\u5927\u96fe' }
]

export const deviceActionOptions = [
  { label: '\u9a71\u79bb', value: '\u9a71\u79bb' },
  { label: '\u8feb\u964d', value: '\u8feb\u964d' },
  { label: '\u8ddf\u8e2a', value: '\u8ddf\u8e2a' },
  { label: '\u544a\u8b66', value: '\u544a\u8b66' }
]

export const ruleStatusOptions = [
  allOption,
  { label: '\u542f\u7528', value: 'enabled' },
  { label: '\u505c\u7528', value: 'disabled' }
]

export const conditionPropertyOptions = [
  { label: '\u901f\u5ea6', value: 'speed' },
  { label: '\u9017\u7559\u65f6\u95f4', value: 'stayDuration' },
  { label: '\u5165\u4fb5\u6b21\u6570', value: 'intrusionCount' },
  { label: '\u8702\u7fa4\u673a\u6570', value: 'swarmCount' },
  { label: '\u98de\u884c\u9ad8\u5ea6', value: 'altitude' },
  { label: '\u4fe1\u53f7\u5f3a\u5ea6', value: 'signalStrength' }
]

export const conditionOperatorOptions = [
  { label: '>', value: '>' },
  { label: '>=', value: '>=' },
  { label: '<', value: '<' },
  { label: '<=', value: '<=' },
  { label: '=', value: '=' }
]
