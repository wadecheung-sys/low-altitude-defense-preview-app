import type { Router } from 'vue-router'
import { LAD_BACKEND_HOME_PATH, LAD_MESSAGE_CENTER_PATH } from '@/constants/lad'

export type DataScreenNavBridgeCleanup = () => void

/** 仅绑定会离开大屏的入口；「操作台」走原型 u391→u392 弹层，不在此跳转。 */
const NAV_LINKS = [
  { id: 'u18', path: LAD_BACKEND_HOME_PATH, role: 'button', ariaLabel: '进入控制台' },
  { id: 'u103', path: LAD_BACKEND_HOME_PATH, role: 'link', ariaLabel: '历史事件' },
  { id: 'u183', path: LAD_MESSAGE_CENTER_PATH, role: 'link', ariaLabel: '消息中心更多' }
] as const

const OPERATOR_DESK_TRIGGER_ID = 'u391'
const OPERATOR_DESK_PANEL_ID = 'u392'
const OPERATOR_DESK_CLOSE_ID = 'u400'

function stopPrototypeEvent(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

function setPanelVisible(panel: HTMLElement, visible: boolean) {
  if (visible) {
    panel.style.removeProperty('display')
    panel.style.removeProperty('visibility')
    panel.style.display = 'block'
    panel.style.visibility = 'visible'
    panel.classList.remove('ax_default_hidden')
  } else {
    panel.style.display = 'none'
    panel.style.visibility = 'hidden'
    panel.classList.add('ax_default_hidden')
  }
}

function removeLightbox(doc: Document, panelId: string) {
  doc.getElementById(`${panelId}_lightbox`)?.remove()
}

function ensureLightbox(doc: Document, panelId: string) {
  const existing = doc.getElementById(`${panelId}_lightbox`)
  if (existing) return existing

  const lightbox = doc.createElement('div')
  lightbox.id = `${panelId}_lightbox`
  Object.assign(lightbox.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '10000px',
    height: '10000px',
    backgroundColor: 'rgba(230, 230, 230, 0.72)',
    zIndex: '9998'
  })
  doc.getElementById('base')?.appendChild(lightbox)
  return lightbox
}

function openOperatorDesk(doc: Document) {
  const panel = doc.getElementById(OPERATOR_DESK_PANEL_ID) as HTMLElement | null
  if (!panel) return

  const lightbox = ensureLightbox(doc, OPERATOR_DESK_PANEL_ID)
  lightbox.style.zIndex = '9998'
  panel.style.position = 'relative'
  panel.style.zIndex = '9999'
  setPanelVisible(panel, true)
}

function closeOperatorDesk(doc: Document) {
  const panel = doc.getElementById(OPERATOR_DESK_PANEL_ID) as HTMLElement | null
  if (panel) setPanelVisible(panel, false)
  removeLightbox(doc, OPERATOR_DESK_PANEL_ID)
}

function bindClickableElement(
  doc: Document,
  elementId: string,
  onClick: () => void,
  options?: { role?: string; ariaLabel?: string }
) {
  const element = doc.getElementById(elementId) as HTMLElement | null
  if (!element) return undefined

  element.style.cursor = 'pointer'
  if (options?.role) element.setAttribute('role', options.role)
  if (options?.ariaLabel) element.setAttribute('aria-label', options.ariaLabel)

  const handleClick = (event: Event) => {
    stopPrototypeEvent(event)
    onClick()
  }

  element.addEventListener('click', handleClick, true)
  return () => element.removeEventListener('click', handleClick, true)
}

function bindOperatorDeskPopup(doc: Document) {
  const cleanups: Array<() => void> = []

  // 初始保持关闭，避免加载时残留遮罩
  closeOperatorDesk(doc)

  const openCleanup = bindClickableElement(
    doc,
    OPERATOR_DESK_TRIGGER_ID,
    () => openOperatorDesk(doc),
    { role: 'button', ariaLabel: '操作台' }
  )
  if (openCleanup) cleanups.push(openCleanup)

  const closeCleanup = bindClickableElement(
    doc,
    OPERATOR_DESK_CLOSE_ID,
    () => closeOperatorDesk(doc),
    { role: 'button', ariaLabel: '关闭操作台' }
  )
  if (closeCleanup) cleanups.push(closeCleanup)

  const lightboxClick = (event: Event) => {
    const target = event.target as HTMLElement | null
    if (target?.id === `${OPERATOR_DESK_PANEL_ID}_lightbox`) {
      closeOperatorDesk(doc)
    }
  }
  doc.addEventListener('click', lightboxClick, true)
  cleanups.push(() => doc.removeEventListener('click', lightboxClick, true))

  return () => cleanups.forEach((cleanup) => cleanup())
}

export function bindDataScreenNavBridge(doc: Document, router: Router): DataScreenNavBridgeCleanup {
  const cleanups: Array<() => void> = [bindOperatorDeskPopup(doc)]

  NAV_LINKS.forEach((link) => {
    const cleanup = bindClickableElement(
      doc,
      link.id,
      () => {
        void router.push(link.path)
      },
      { role: link.role, ariaLabel: link.ariaLabel }
    )
    if (cleanup) cleanups.push(cleanup)
  })

  return () => cleanups.forEach((cleanup) => cleanup())
}
