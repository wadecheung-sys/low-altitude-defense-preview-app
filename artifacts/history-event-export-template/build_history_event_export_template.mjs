import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.join(__dirname, 'outputs')
await fs.mkdir(outputDir, { recursive: true })

const workbook = Workbook.create()

const templateSheet = workbook.worksheets.add('导出模板')
const fieldSheet = workbook.worksheets.add('字段说明')
const guideSheet = workbook.worksheets.add('导出说明')

templateSheet.showGridLines = false
fieldSheet.showGridLines = false
guideSheet.showGridLines = false

templateSheet.getRange('A1:R1').merge()
templateSheet.getRange('A1').values = [['历史事件导出模板']]
templateSheet.getRange('A2:R2').merge()
templateSheet.getRange('A2').values = [[
  '适用于历史事件模块导出。实际导出时，数据量跟随当前筛选结果；无筛选时默认导出全部。'
]]
templateSheet.getRange('A1:R2').format = {
  fill: '#F7FAFC',
  font: { color: '#0F172A', bold: true },
  verticalAlignment: 'center'
}
templateSheet.getRange('A1').format = {
  font: { size: 16, bold: true, color: '#0F172A' },
  horizontalAlignment: 'center'
}
templateSheet.getRange('A2').format = {
  font: { size: 10, color: '#475569' },
  horizontalAlignment: 'left',
  wrapText: true
}

const templateHeaders = [[
  '目标ID',
  '名单状态',
  '发现时间',
  '处置时间',
  '持续时长',
  '飞手位置',
  '目标型号',
  '识别码',
  '威胁等级',
  '处置状态',
  '处置结果',
  '探测设备',
  '反制设备',
  '数据来源',
  '所在区域',
  '目标位置',
  '威胁识别',
  '备注'
]]

const sampleRows = [[
  'TG-2024-0001',
  '黑名单',
  '2024-03-04 08:00:00',
  '2024-03-04 08:00:25',
  '00:00:25',
  '未定位',
  'DJI Mavic 3',
  '1581F4100000',
  '高',
  '已处置',
  '驱离成功',
  '雷达-01 (2.4G)',
  '干扰-01 (自动)',
  '雷达+无线电融合',
  '核心区',
  'E:113.39 N:23.09',
  '人工核查-真实入侵',
  '多源轨迹已合并'
]]

templateSheet.getRange('A4:R4').values = templateHeaders
templateSheet.getRange('A5:R5').values = sampleRows
templateSheet.getRange('A4:R5').format.borders = { preset: 'all', style: 'thin', color: '#D7DFE8' }
templateSheet.getRange('A4:R4').format = {
  fill: '#1D4ED8',
  font: { color: '#FFFFFF', bold: true },
  horizontalAlignment: 'center',
  verticalAlignment: 'center'
}
templateSheet.getRange('A5:R5').format = {
  horizontalAlignment: 'left',
  verticalAlignment: 'center'
}
templateSheet.getRange('C5:D5').format.numberFormat = 'yyyy-mm-dd hh:mm:ss'
templateSheet.getRange('A7:R9').merge(true)
templateSheet.getRange('A7').values = [['导出占位区']]
templateSheet.getRange('A7:R9').format = {
  fill: '#EFF6FF',
  font: { color: '#1E3A8A', bold: true },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  borders: { preset: 'all', style: 'dashed', color: '#93C5FD' }
}

templateSheet.getRange('A11:F11').merge()
templateSheet.getRange('A11').values = [['建议导出参数']]
templateSheet.getRange('A12:F15').values = [
  ['导出类型', 'Excel / Word', '导出时间', '系统生成', '数据量', '跟随当前筛选'],
  ['筛选范围', '历史事件列表当前筛选条件', '模板用途', '正式导出文件字段结构参考', '说明', '可按需扩展样式'],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', '']
]
templateSheet.getRange('A11:F15').format.borders = { preset: 'all', style: 'thin', color: '#D7DFE8' }
templateSheet.getRange('A11:F11').format = {
  fill: '#E2E8F0',
  font: { bold: true, color: '#0F172A' },
  horizontalAlignment: 'left'
}

;[
  14, 12, 20, 20, 12, 12, 16, 16, 10, 12, 14, 18, 18, 18, 14, 18, 16, 20
].forEach((width, idx) => {
  templateSheet.getRangeByIndexes(0, idx, 30, 1).format.columnWidth = width
})
templateSheet.freezePanes.freezeRows(4)

const fieldRows = [
  ['字段名', '示例值', '说明'],
  ['目标ID', 'TG-2024-0001', '融合后的历史事件唯一编号'],
  ['名单状态', '黑名单 / 白名单 / 未知', '目标当前名单归属'],
  ['发现时间', '2024-03-04 08:00:00', '事件首次发现时间'],
  ['处置时间', '2024-03-04 08:00:25 / --', '如未执行处置可为空'],
  ['持续时长', '00:00:25', '事件持续时间'],
  ['飞手位置', '未定位 / E:113.40 N:23.10', '飞手研判定位结果'],
  ['目标型号', 'DJI Mavic 3', '识别到的型号信息'],
  ['识别码', '1581F4100000', '原 SN 码统一改名后的字段'],
  ['威胁等级', '高 / 中 / 低 / 未知', '系统威胁评估结果'],
  ['处置状态', '待处置 / 处置中 / 已处置 / 已结束', '已结束用于未执行反制但事件已自然结束的情况'],
  ['处置结果', '驱离成功 / 无人机自离', '最终处置或结束结果'],
  ['探测设备', '雷达-01 (2.4G)', '首要或融合探测来源设备'],
  ['反制设备', '干扰-01 (自动) / --', '未执行反制时通常为 --'],
  ['数据来源', '雷达+无线电融合', '事件来源说明'],
  ['所在区域', '核心区', '事件所处区域'],
  ['目标位置', 'E:113.39 N:23.09', '目标大致位置'],
  ['威胁识别', '人工核查-真实入侵', '自动识别或人工核查结果'],
  ['备注', '多源轨迹已合并', '补充说明']
]
fieldSheet.getRange(`A1:C${fieldRows.length}`).values = fieldRows
fieldSheet.getRange(`A1:C${fieldRows.length}`).format.borders = {
  preset: 'all',
  style: 'thin',
  color: '#D7DFE8'
}
fieldSheet.getRange('A1:C1').format = {
  fill: '#0F766E',
  font: { color: '#FFFFFF', bold: true },
  horizontalAlignment: 'center'
}
fieldSheet.getRangeByIndexes(0, 0, 40, 1).format.columnWidth = 18
fieldSheet.getRangeByIndexes(0, 1, 40, 1).format.columnWidth = 22
fieldSheet.getRangeByIndexes(0, 2, 40, 1).format.columnWidth = 48
fieldSheet.freezePanes.freezeRows(1)

const guideRows = [
  ['历史事件导出模板说明'],
  ['1. Excel 模板用于列表字段对照、字段顺序确认、数据填充与二次整理。'],
  ['2. Word 模板用于正式报表导出，适合对外呈现、归档或人工签阅。'],
  ['3. 实际业务导出时，数据量应跟随历史事件列表当前筛选条件；若无筛选，则导出全部。'],
  ['4. “已结束”表示事件未执行反制但已自然结束，例如无人机自离、飞鸟躁扰等。'],
  ['5. 如需补充字段，可优先保持与历史事件模块当前列表字段一致。']
]
guideSheet.getRange(`A1:A${guideRows.length}`).values = guideRows
guideSheet.getRange('A1').format = {
  font: { size: 15, bold: true, color: '#0F172A' }
}
guideSheet.getRange('A2:A6').format = {
  wrapText: true,
  font: { color: '#334155' }
}
guideSheet.getRangeByIndexes(0, 0, 20, 1).format.columnWidth = 96

const table = templateSheet.tables.add('A4:R5', true, 'HistoryEventExportTemplate')
table.style = 'TableStyleMedium2'

const preview = await workbook.render({
  sheetName: '导出模板',
  range: 'A1:R15',
  scale: 1,
  format: 'png'
})
await fs.writeFile(path.join(outputDir, 'history-event-export-template-preview.png'), new Uint8Array(await preview.arrayBuffer()))

const xlsx = await SpreadsheetFile.exportXlsx(workbook)
await xlsx.save(path.join(outputDir, 'history-event-export-template.xlsx'))
