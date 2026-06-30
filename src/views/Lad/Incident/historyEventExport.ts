import dayjs from 'dayjs'

import { getHistoryEventListApi } from '@/api/lad/incident'

import type { HistoryEventItem, HistoryEventQuery } from '@/api/lad/incident/types'

import { threatLevelDisplay, verificationMethodOf, countermeasureDeviceDisplay } from '../shared/ladDictHelpers'



export type HistoryEventExportRange = 'all' | 'query' | 'selected'

export type HistoryEventExportFormat = 'excel' | 'word'



/** 与历史事件列表列顺序、字段保持一致 */

export const HISTORY_EVENT_EXPORT_HEADERS = [

  '目标ID',

  '名单类型',

  '目标类型',

  '发现时间',

  '处置时间',

  '飞手位置',

  '目标型号',

  '识别码',

  '威胁等级',

  '验证方式',

  '探测设备',

  '反制设备',

  '处置状态',

  '备注'

] as const



const EXCEL_TEMPLATE_URL = `${import.meta.env.BASE_URL}export-templates/历史事件.xlsx`

const DATA_START_ROW = 5



const formatExportRemark = (remark: string) => {

  const text = remark.replace(/人工确认/g, '人工核查')

  if (text === '等待值守人员确认' || text === '等待值守人员人工核查') return ''

  return text

}



const displayValue = (value: unknown) => {

  if (value === null || value === undefined) return ''

  const text = String(value).trim()

  return text === '--' ? '--' : text

}



export function mapHistoryEventToExportRow(item: HistoryEventItem): string[] {

  return [

    displayValue(item.targetId),

    displayValue(item.listType),

    displayValue(item.historyTargetType),

    displayValue(item.discoveredAt),

    displayValue(item.handledAt),

    displayValue(item.pilotLocation),

    displayValue(item.targetModel),

    displayValue(item.uavSn),

    threatLevelDisplay(item.threatLevel),

    verificationMethodOf(item.manualConfirmStatus),

    displayValue(item.detectionDevice),

    displayValue(countermeasureDeviceDisplay(item.countermeasureDevice)),

    displayValue(item.handlingStatus),

    formatExportRemark(item.remark)

  ]

}



export async function fetchHistoryEventsForExport(

  range: HistoryEventExportRange,

  searchParams: HistoryEventQuery,

  selected: HistoryEventItem[]

): Promise<HistoryEventItem[]> {

  if (range === 'selected') return [...selected]



  const query: HistoryEventQuery = range === 'query' ? { ...searchParams } : {}



  const pageSize = 200

  let pageIndex = 1

  let total = 0

  const rows: HistoryEventItem[] = []



  do {

    const res = await getHistoryEventListApi({

      ...query,

      pageIndex,

      pageSize

    })

    rows.push(...res.data.list)

    total = res.data.total

    pageIndex += 1

  } while (rows.length < total)



  return rows

}



function buildExportFileName(format: HistoryEventExportFormat) {

  const stamp = dayjs().format('YYYYMMDD_HHmmss')

  return `历史事件_${stamp}.${format === 'word' ? 'docx' : 'xlsx'}`

}



function buildMetaLine(rangeLabel: string, count: number) {

  const time = dayjs().format('YYYY-MM-DD HH:mm:ss')

  return `导出范围：${rangeLabel}；导出时间：${time}；记录数：${count} 条`

}



async function loadExcelTemplateWorkbook(ExcelJS: typeof import('exceljs').default) {

  const response = await fetch(EXCEL_TEMPLATE_URL)

  if (!response.ok) {

    throw new Error('导出模板加载失败，请确认 public/export-templates/历史事件.xlsx 已部署')

  }

  const buffer = await response.arrayBuffer()

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(buffer)

  return workbook

}



async function exportHistoryEventsExcel(

  rows: HistoryEventItem[],

  rangeLabel: string

): Promise<void> {

  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([

    import('exceljs'),

    import('file-saver')

  ])



  const workbook = await loadExcelTemplateWorkbook(ExcelJS)

  const sheet = workbook.getWorksheet('导出模板') ?? workbook.worksheets[0]

  if (!sheet) throw new Error('导出模板工作表不存在')



  sheet.getCell('A2').value = buildMetaLine(rangeLabel, rows.length)



  const lastDataRow = Math.max(sheet.rowCount, DATA_START_ROW + rows.length - 1)

  for (let rowIndex = DATA_START_ROW; rowIndex <= lastDataRow; rowIndex += 1) {

    for (let colIndex = 1; colIndex <= HISTORY_EVENT_EXPORT_HEADERS.length; colIndex += 1) {

      sheet.getCell(rowIndex, colIndex).value = null

    }

  }



  rows.forEach((item, index) => {

    const values = mapHistoryEventToExportRow(item)

    values.forEach((value, colIndex) => {

      const cell = sheet.getCell(DATA_START_ROW + index, colIndex + 1)

      cell.value = value

      cell.font = { name: '宋体', size: 10 }

      cell.alignment = { vertical: 'middle' }

    })

  })



  const buffer = await workbook.xlsx.writeBuffer()

  saveAs(

    new Blob([buffer], {

      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    }),

    buildExportFileName('excel')

  )

}



async function exportHistoryEventsWord(

  rows: HistoryEventItem[],

  rangeLabel: string

): Promise<void> {

  const [

    { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType },

    { saveAs }

  ] = await Promise.all([import('docx'), import('file-saver')])



  const tableCell = (text: string, bold = false) =>

    new TableCell({

      children: [

        new Paragraph({

          children: [

            new TextRun({

              text,

              bold,

              font: '宋体',

              size: 18

            })

          ]

        })

      ]

    })



  const headerRow = new TableRow({

    children: HISTORY_EVENT_EXPORT_HEADERS.map((header) => tableCell(header, true))

  })

  const dataRows = rows.map(

    (item) =>

      new TableRow({

        children: mapHistoryEventToExportRow(item).map((value) => tableCell(value))

      })

  )



  const doc = new Document({

    sections: [

      {

        properties: {

          page: {

            size: {

              orientation: 'landscape'

            },

            margin: {

              top: 720,

              right: 720,

              bottom: 720,

              left: 720

            }

          }

        },

        children: [

          new Paragraph({

            alignment: AlignmentType.CENTER,

            children: [

              new TextRun({

                text: '历史事件数据',

                bold: true,

                size: 32,

                font: '宋体'

              })

            ]

          }),

          new Paragraph({

            children: [

              new TextRun({

                text: buildMetaLine(rangeLabel, rows.length),

                size: 20,

                font: '宋体'

              })

            ]

          }),

          new Paragraph({ text: '' }),

          new Table({

            width: { size: 100, type: WidthType.PERCENTAGE },

            rows: [headerRow, ...dataRows]

          })

        ]

      }

    ]

  })



  const buffer = await Packer.toBlob(doc)

  saveAs(buffer, buildExportFileName('word'))

}



export async function exportHistoryEvents(

  format: HistoryEventExportFormat,

  rows: HistoryEventItem[],

  rangeLabel: string

): Promise<void> {

  if (!rows.length) {

    throw new Error('没有可导出的历史事件记录')

  }

  if (format === 'word') {

    await exportHistoryEventsWord(rows, rangeLabel)

    return

  }

  await exportHistoryEventsExcel(rows, rangeLabel)

}

