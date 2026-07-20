import type { Router } from 'vue-router'
import { LAD_BACKEND_HOME_PATH, LAD_MESSAGE_CENTER_PATH } from '@/constants/lad'

export type DataScreenNavBridgeCleanup = () => void

/**
 * 仅绑定会离开大屏的入口。
 * 「操作台」u393→u394 弹层由 Axure 原型自身处理，勿在此拦截。
 */
const NAV_LINKS = [
  { id: 'u18', path: LAD_BACKEND_HOME_PATH, role: 'button', ariaLabel: '进入控制台' },
  { id: 'u103', path: LAD_BACKEND_HOME_PATH, role: 'link', ariaLabel: '历史事件' },
  { id: 'u185', path: LAD_MESSAGE_CENTER_PATH, role: 'link', ariaLabel: '消息中心更多' }
] as const

function stopPrototypeEvent(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
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

export function bindDataScreenNavBridge(doc: Document, router: Router): DataScreenNavBridgeCleanup {
  const cleanups: Array<() => void> = []

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
