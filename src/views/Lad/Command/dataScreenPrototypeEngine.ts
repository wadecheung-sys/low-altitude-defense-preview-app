/**
 * 数据大屏原型交互引擎：从 Axure 导出 HTML 的 selectiongroup / data-label 自动发现槽位，
 * 并实现目标列表、地图图标、连线、详情面板之间的互选联动。
 */

export type DataScreenSlot = {
  index: number
  listItemIds: string[]
  lineId: string
  detailId: string
  iconIds: string[]
}

export type DataScreenMapEngine = {
  slots: DataScreenSlot[]
  selectSlot: (index: number) => void
  clearSelection: () => void
  bind: () => () => void
}

const LIST_GROUP = '告警列表选中'
const LINE_GROUP = '线'
const DETAIL_GROUP = '无人机详情'
const ICON_GROUP = '无人机icon'

const MAP_LINE_GROUP_ID = 'u173'
const MAP_TARGET_GROUP_ID = 'u178'

const DETAIL_CLOSE_BUTTONS = ['u184', 'u186', 'u189', 'u192'] as const

/** 设备控制/详情弹层根节点，需高于地图目标层 */
const DEVICE_CONTROL_ROOT_ID = 'u298'
const DEVICE_CONTROL_OVERLAY_ID = 'u299'
const DEVICE_DETAIL_MODAL_ID = 'u563'
const DEVICE_LIST_VIEW_MORE_BUTTON_ID = 'u170'

/** 连线组 < 地图目标组 < 详情面板 < 设备控制弹层 */
const MAP_LINE_GROUP_Z_INDEX = 180
const MAP_TARGET_GROUP_Z_INDEX = 200
const MAP_LINE_Z_INDEX = 10
const MAP_ICON_Z_INDEX = 25
const MAP_DETAIL_Z_INDEX = 50
const DEVICE_CONTROL_STACK_Z_INDEX = 300
const DEVICE_DETAIL_MODAL_Z_INDEX = 310

type Cleanup = () => void

type Point = { x: number; y: number }

function getElementCenter(el: HTMLElement): Point {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function distance(a: Point, b: Point) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function queryByGroup(doc: Document, group: string) {
  return [...doc.querySelectorAll<HTMLElement>(`[selectiongroup="${group}"]`)]
}

function labelIndex(label: string, prefix: string) {
  if (!label.startsWith(prefix)) return null
  const suffix = label.slice(prefix.length)
  const num = Number(suffix)
  return Number.isFinite(num) ? num : null
}

function discoverSlots(doc: Document): Omit<DataScreenSlot, 'iconIds'>[] {
  const listByIndex = new Map<number, string[]>()
  const lineByIndex = new Map<number, string>()
  const detailByIndex = new Map<number, string>()

  for (const el of queryByGroup(doc, LIST_GROUP)) {
    const label = el.getAttribute('data-label') ?? ''
    const index = labelIndex(label, '26-1-')
    if (index == null || !el.id) continue
    const bucket = listByIndex.get(index) ?? []
    bucket.push(el.id)
    listByIndex.set(index, bucket)
  }

  for (const el of queryByGroup(doc, LINE_GROUP)) {
    const label = el.getAttribute('data-label') ?? ''
    const index = labelIndex(label, '26-0-')
    if (index == null || !el.id) continue
    lineByIndex.set(index, el.id)
  }

  for (const el of queryByGroup(doc, DETAIL_GROUP)) {
    const label = el.getAttribute('data-label') ?? ''
    const index = labelIndex(label, '26-')
    if (index == null || !el.id) continue
    detailByIndex.set(index, el.id)
  }

  const indexes = [...new Set([...listByIndex.keys(), ...lineByIndex.keys(), ...detailByIndex.keys()])].sort(
    (a, b) => a - b
  )

  return indexes
    .filter((index) => lineByIndex.has(index) && detailByIndex.has(index))
    .map((index) => ({
      index,
      listItemIds: listByIndex.get(index) ?? [],
      lineId: lineByIndex.get(index)!,
      detailId: detailByIndex.get(index)!
    }))
}

function mapIconsToSlots(doc: Document, slots: Omit<DataScreenSlot, 'iconIds'>[]): DataScreenSlot[] {
  const icons = queryByGroup(doc, ICON_GROUP).filter((el) => el.id)
  const iconSlotMap = new Map<string, number>()

  for (const icon of icons) {
    const slotFromMarkup = detectIconSlotFromMarkup(icon)
    if (slotFromMarkup != null) {
      iconSlotMap.set(icon.id, slotFromMarkup)
      continue
    }

    const iconCenter = getElementCenter(icon)
    let bestIndex = slots[0]?.index ?? 1
    let bestDistance = Number.POSITIVE_INFINITY

    for (const slot of slots) {
      const line = doc.getElementById(slot.lineId)
      if (!line) continue
      const nextDistance = distance(iconCenter, getElementCenter(line))
      if (nextDistance < bestDistance) {
        bestDistance = nextDistance
        bestIndex = slot.index
      }
    }

    iconSlotMap.set(icon.id, bestIndex)
  }

  return slots.map((slot) => ({
    ...slot,
    iconIds: icons.filter((icon) => iconSlotMap.get(icon.id) === slot.index).map((icon) => icon.id)
  }))
}

/** 按原型 SVG 描边色映射槽位：红=高危(1)、蓝=白名单(2)、灰=中危(3) */
function detectIconSlotFromMarkup(icon: HTMLElement): number | null {
  const markup = icon.innerHTML
  if (markup.includes('rgba(217, 0, 27')) return 1
  if (markup.includes('rgba(2, 167, 240')) return 2
  if (markup.includes('rgba(127, 127, 127')) return 3
  return null
}

function isAxurePanelVisible(el: HTMLElement | null): boolean {
  if (!el) return false
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return false
  if (el.classList.contains('ax_default_hidden')) {
    return el.style.visibility === 'visible' || el.style.display === 'block' || el.style.display === 'flex'
  }
  return true
}

function syncDeviceControlLayerStack(doc: Document) {
  const root = doc.getElementById(DEVICE_CONTROL_ROOT_ID)
  if (!root) return

  const overlay = doc.getElementById(DEVICE_CONTROL_OVERLAY_ID)
  const modal = doc.getElementById(DEVICE_DETAIL_MODAL_ID)
  const shouldElevate = isAxurePanelVisible(overlay) || isAxurePanelVisible(modal)

  if (shouldElevate) {
    root.style.zIndex = String(DEVICE_CONTROL_STACK_Z_INDEX)
    if (modal) {
      modal.style.zIndex = String(DEVICE_DETAIL_MODAL_Z_INDEX)
      modal.style.pointerEvents = 'auto'
    }
    return
  }

  root.style.removeProperty('z-index')
  modal?.style.removeProperty('z-index')
}

/** 设备详情弹窗弹出时置顶，避免被地图目标层遮挡 */
export function bindDeviceControlLayerStack(doc: Document): Cleanup {
  syncDeviceControlLayerStack(doc)

  const watched = [DEVICE_CONTROL_OVERLAY_ID, DEVICE_DETAIL_MODAL_ID]
    .map((id) => doc.getElementById(id))
    .filter(Boolean) as HTMLElement[]

  if (!watched.length) return () => {}

  const observer = new MutationObserver(() => syncDeviceControlLayerStack(doc))
  for (const element of watched) {
    observer.observe(element, { attributes: true, attributeFilter: ['class', 'style'] })
  }

  return () => observer.disconnect()
}

/** 设备列表「查看更多」仅作展开，点击后取消 Axure 选中高亮 */
export function bindDeviceListViewMoreButton(doc: Document): Cleanup {
  const button = doc.getElementById(DEVICE_LIST_VIEW_MORE_BUTTON_ID)
  if (!button) return () => {}

  const div = doc.getElementById(`${DEVICE_LIST_VIEW_MORE_BUTTON_ID}_div`)

  const clearSelected = () => {
    const hasSelected =
      button.classList.contains('selected') || div?.classList.contains('selected') === true
    if (!hasSelected) return

    setElementSelected(doc, DEVICE_LIST_VIEW_MORE_BUTTON_ID, false)
    button.classList.remove('mouseOver')
    div?.classList.remove('mouseOver')
  }

  const observer = new MutationObserver(clearSelected)
  observer.observe(button, { attributes: true, attributeFilter: ['class'] })
  if (div) observer.observe(div, { attributes: true, attributeFilter: ['class'] })

  const handleClick = () => {
    window.setTimeout(clearSelected, 0)
  }
  button.addEventListener('click', handleClick)

  return () => {
    observer.disconnect()
    button.removeEventListener('click', handleClick)
  }
}

function elevateMapTargetStack(doc: Document) {
  const lineGroup = doc.getElementById(MAP_LINE_GROUP_ID)
  if (lineGroup) lineGroup.style.zIndex = String(MAP_LINE_GROUP_Z_INDEX)

  const targetGroup = doc.getElementById(MAP_TARGET_GROUP_ID)
  if (targetGroup) targetGroup.style.zIndex = String(MAP_TARGET_GROUP_Z_INDEX)
}

function normalizeMapPointerLayers(doc: Document, slots: DataScreenSlot[]) {
  elevateMapTargetStack(doc)

  for (const slot of slots) {
    const line = doc.getElementById(slot.lineId)
    if (line) {
      line.style.pointerEvents = 'none'
      line.style.zIndex = String(MAP_LINE_Z_INDEX)
    }
  }

  for (const slot of slots) {
    for (const iconId of slot.iconIds) {
      const icon = doc.getElementById(iconId)
      if (!icon) continue
      icon.style.pointerEvents = 'auto'
      icon.style.zIndex = String(MAP_ICON_Z_INDEX)
      icon.querySelectorAll<HTMLElement>('svg, .img, .text').forEach((node) => {
        node.style.pointerEvents = 'auto'
      })
    }
  }

  for (const slot of slots) {
    const panel = doc.getElementById(slot.detailId)
    if (!panel) continue

    panel.style.pointerEvents = 'auto'
    panel.style.zIndex = String(MAP_DETAIL_Z_INDEX)
    panel.querySelectorAll<HTMLElement>('a.link, .link').forEach((node) => {
      node.style.cursor = 'pointer'
    })
  }
}

function setElementSelected(doc: Document, id: string, selected: boolean) {
  const element = doc.getElementById(id)
  if (!element) return

  element.classList.toggle('selected', selected)
  doc.getElementById(`${id}_div`)?.classList.toggle('selected', selected)
  doc.getElementById(`${id}_img`)?.classList.toggle('selected', selected)
}

function setElementVisible(doc: Document, id: string, visible: boolean) {
  const element = doc.getElementById(id)
  if (!element) return

  element.style.display = visible ? '' : 'none'
  element.style.visibility = visible ? 'visible' : 'hidden'
  element.classList.toggle('ax_default_hidden', !visible)
}

function readDefaultSlotIndex(doc: Document, slots: DataScreenSlot[]) {
  const selectedDetail = slots.find((slot) => doc.getElementById(slot.detailId)?.classList.contains('selected'))
  if (selectedDetail) return selectedDetail.index

  const visibleDetail = slots.find((slot) => {
    const el = doc.getElementById(slot.detailId)
    return el && !el.classList.contains('ax_default_hidden') && el.style.display !== 'none'
  })
  return visibleDetail?.index ?? slots[0]?.index ?? 1
}

function bindPointer(
  doc: Document,
  elementId: string,
  onClick: () => void,
  options?: { ariaLabel?: string }
): Cleanup | undefined {
  const element = doc.getElementById(elementId)
  if (!element) return undefined

  element.style.cursor = 'pointer'
  element.style.pointerEvents = 'auto'
  if (options?.ariaLabel) {
    element.setAttribute('role', 'button')
    element.setAttribute('aria-label', options.ariaLabel)
  }

  const handleClick = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    onClick()
  }

  const targets = [element, ...element.querySelectorAll<HTMLElement>('svg, .img, .text')]
  for (const target of targets) {
    target.addEventListener('click', handleClick, true)
  }

  return () => {
    for (const target of targets) {
      target.removeEventListener('click', handleClick, true)
    }
  }
}

export function createDataScreenMapEngine(doc: Document): DataScreenMapEngine | null {
  const slots = mapIconsToSlots(doc, discoverSlots(doc))
  if (!slots.length) return null

  let activeIndex: number | null = readDefaultSlotIndex(doc, slots)

  const allListIds = slots.flatMap((slot) => slot.listItemIds)
  const allLineIds = slots.map((slot) => slot.lineId)
  const allDetailIds = slots.map((slot) => slot.detailId)
  const allIconIds = [...new Set(slots.flatMap((slot) => slot.iconIds))]

  const applySelection = (index: number | null) => {
    activeIndex = index

    for (const slot of slots) {
      const selected = index === slot.index
      for (const listId of slot.listItemIds) {
        setElementSelected(doc, listId, selected)
      }
      setElementVisible(doc, slot.lineId, selected)
      setElementSelected(doc, slot.lineId, selected)
      setElementVisible(doc, slot.detailId, selected)
      setElementSelected(doc, slot.detailId, selected)
      for (const iconId of slot.iconIds) {
        setElementSelected(doc, iconId, selected)
      }
    }

    if (index == null) {
      for (const id of allListIds) setElementSelected(doc, id, false)
      for (const id of allLineIds) {
        setElementVisible(doc, id, false)
        setElementSelected(doc, id, false)
      }
      for (const id of allDetailIds) {
        setElementVisible(doc, id, false)
        setElementSelected(doc, id, false)
      }
      for (const id of allIconIds) setElementSelected(doc, id, false)
    }
  }

  const selectSlot = (index: number) => {
    if (!slots.some((slot) => slot.index === index)) return
    applySelection(index)
  }

  const clearSelection = () => applySelection(null)

  const bind = () => {
    const cleanups: Cleanup[] = []

    normalizeMapPointerLayers(doc, slots)

    for (const slot of slots) {
      for (const listId of slot.listItemIds) {
        const cleanup = bindPointer(doc, listId, () => selectSlot(slot.index), {
          ariaLabel: `选择空飘物目标 ${slot.index}`
        })
        if (cleanup) cleanups.push(cleanup)
      }

      for (const iconId of slot.iconIds) {
        const cleanup = bindPointer(doc, iconId, () => selectSlot(slot.index), {
          ariaLabel: `选择地图目标 ${slot.index}`
        })
        if (cleanup) cleanups.push(cleanup)
      }
    }

    for (const closeId of DETAIL_CLOSE_BUTTONS) {
      const cleanup = bindPointer(doc, closeId, clearSelection, { ariaLabel: '关闭目标详情' })
      if (cleanup) cleanups.push(cleanup)
    }

    applySelection(activeIndex)
    normalizeMapPointerLayers(doc, slots)

    return () => cleanups.forEach((cleanup) => cleanup())
  }

  return { slots, selectSlot, clearSelection, bind }
}
