import { queryDeviceInfoDetail, queryDeviceInfoList } from '@/api/lad/device-info/infoStore'
import type { DeviceInfoDetail } from '@/api/lad/device-info/types'
import {
  ALL_CATALOG_DEVICES,
  DATA_SCREEN_PRIORITY_DEVICES,
  PENDING_DEVICES
} from '@/constants/deviceCatalog'

export type DataScreenSyncCleanup = () => void

/** 弹窗 tab → 型号（顺序：雷达 / 光电 / 激光 / 微波） */
const PENDING_TAB_IDS = ['u308', 'u309', 'u310', 'u550'] as const

/** 底部设备列表卡片 → 具体部署设备（顺序与 Axure 原型一致） */
const DEVICE_LIST_CARDS: { elementId: string; model: string }[] = [
  { elementId: 'u113', model: 'TBD-RAD' },
  { elementId: 'u114', model: 'TBD-EO' },
  { elementId: 'u115', model: 'PL671F' },
  { elementId: 'u116', model: 'FG310F' },
  { elementId: 'u117', model: 'TBD-LSR' },
  { elementId: 'u118', model: 'TBD-HPM' }
]

const DEPLOYED_SUMMARY_ID = 'u551'

/** u563 详情弹窗字段映射 */
const DETAIL_FIELD_IDS = {
  deviceName: 'u583',
  deviceType: 'u582',
  serialNo: 'u580',
  ipAddress: 'u581',
  longitude: 'u577',
  latitude: 'u592',
  altitude: 'u579',
  azimuth: 'u585',
  status: 'u587',
  updatedAt: 'u594',
  softwareVersion: 'u595',
  port: 'u596',
  model: 'u597'
} as const

const PICKER_CLASS = 'lad-data-screen-device-pick'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function setElementText(doc: Document, elementId: string, text: string) {
  const textEl = doc.getElementById(`${elementId}_text`)
  if (!textEl) return

  const span = textEl.querySelector('span')
  if (span) {
    span.textContent = text
    return
  }

  textEl.textContent = text
}

function setDeviceCardLabel(doc: Document, elementId: string, label: string) {
  const textEl = doc.getElementById(`${elementId}_text`)
  if (!textEl) return
  textEl.innerHTML = `<p><span>${escapeHtml(label)}</span></p>`
}

function setElementHtml(doc: Document, elementId: string, html: string) {
  const textEl = doc.getElementById(`${elementId}_text`)
  if (!textEl) return

  const paragraph = textEl.querySelector('p')
  if (paragraph) {
    paragraph.innerHTML = html
    return
  }

  textEl.innerHTML = html
}

function extFieldValue(detail: DeviceInfoDetail, label: string): string {
  return detail.extendedFields?.find((f) => f.label === label)?.value?.trim() || ''
}

function isDeviceOnline(lastHeartbeat?: string): boolean {
  if (!lastHeartbeat) return true
  const t = new Date(lastHeartbeat.replace(/-/g, '/')).getTime()
  if (Number.isNaN(t)) return true
  return Date.now() - t < 48 * 3600 * 1000
}

function findInfoByModel(model: string): DeviceInfoDetail | null {
  const { list } = queryDeviceInfoList({ pageIndex: 1, pageSize: 500 })
  for (const row of list) {
    const detail = queryDeviceInfoDetail(row.id)
    if (detail?.linkedArchive?.deviceModel === model) return detail
  }
  return null
}

function resolveDeviceDisplayName(model: string): string {
  const detail = findInfoByModel(model)
  if (detail?.deviceName) return detail.deviceName
  const entry = ALL_CATALOG_DEVICES.find((d) => d.model === model)
  return entry?.demo.deviceName ?? model
}

function buildDeployedSummaryHtml(): string {
  const parts = DATA_SCREEN_PRIORITY_DEVICES.map((entry) => {
    return `<span class="${PICKER_CLASS}" data-model="${entry.model}" style="cursor:pointer;text-decoration:underline;">${entry.model}</span>`
  })
  return `<span>已部署：</span>${parts.join(' · ')}`
}

function fillDetailPanel(doc: Document, detail: DeviceInfoDetail) {
  const model = detail.linkedArchive?.deviceModel || ''
  setElementText(doc, DETAIL_FIELD_IDS.deviceName, detail.deviceName)
  setElementText(
    doc,
    DETAIL_FIELD_IDS.deviceType,
    model ? `${detail.deviceType}（${model}）` : detail.deviceType
  )
  setElementText(doc, DETAIL_FIELD_IDS.serialNo, detail.serialNo)
  setElementText(doc, DETAIL_FIELD_IDS.ipAddress, detail.ipAddress)
  setElementText(doc, DETAIL_FIELD_IDS.longitude, String(detail.longitude ?? '—'))
  setElementText(doc, DETAIL_FIELD_IDS.latitude, String(detail.latitude ?? '—'))
  setElementText(doc, DETAIL_FIELD_IDS.altitude, '7')
  setElementText(doc, DETAIL_FIELD_IDS.azimuth, model === 'FG310F' ? '180.00' : '—')
  setElementText(doc, DETAIL_FIELD_IDS.status, isDeviceOnline(detail.lastHeartbeat) ? '在线' : '离线')
  setElementText(doc, DETAIL_FIELD_IDS.updatedAt, detail.updatedAt || '—')
  setElementText(doc, DETAIL_FIELD_IDS.softwareVersion, extFieldValue(detail, '软件版本') || 'V1.0.0')
  setElementText(doc, DETAIL_FIELD_IDS.port, '19876')
  setElementText(doc, DETAIL_FIELD_IDS.model, model || detail.deviceId)
}

function syncDeviceListCards(doc: Document) {
  DEVICE_LIST_CARDS.forEach(({ elementId, model }) => {
    setDeviceCardLabel(doc, elementId, resolveDeviceDisplayName(model))
  })
}

/** 从 catalog + infoStore 写入 iframe 文本节点 */
export function syncDataScreenDeviceContent(doc: Document) {
  PENDING_DEVICES.slice(0, PENDING_TAB_IDS.length).forEach((entry, index) => {
    setElementText(doc, PENDING_TAB_IDS[index], entry.demo.deviceName)
  })

  syncDeviceListCards(doc)
  setElementHtml(doc, DEPLOYED_SUMMARY_ID, buildDeployedSummaryHtml())

  const primaryModel = DATA_SCREEN_PRIORITY_DEVICES[0]?.model ?? 'FG310F'
  const primary = findInfoByModel(primaryModel)
  if (primary) fillDetailPanel(doc, primary)
}

/** 已部署摘要中的型号名可点击切换 u563 详情（不拦截 Axure 事件） */
export function bindDataScreenDevicePickers(doc: Document): DataScreenSyncCleanup {
  const summaryEl = doc.getElementById(DEPLOYED_SUMMARY_ID)
  if (!summaryEl) return () => undefined

  const onPick = (event: Event) => {
    const target = event.target as HTMLElement | null
    const pick = target?.closest(`.${PICKER_CLASS}`) as HTMLElement | null
    if (!pick) return

    const model = pick.getAttribute('data-model')
    if (!model) return

    const detail = findInfoByModel(model)
    if (detail) fillDetailPanel(doc, detail)
  }

  summaryEl.addEventListener('click', onPick)
  return () => summaryEl.removeEventListener('click', onPick)
}

export function bindDataScreenDeviceSync(doc: Document): DataScreenSyncCleanup {
  syncDataScreenDeviceContent(doc)
  return bindDataScreenDevicePickers(doc)
}
