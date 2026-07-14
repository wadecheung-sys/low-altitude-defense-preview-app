import type { Router } from 'vue-router'
import { LAD_BACKEND_HOME_PATH, LAD_MESSAGE_CENTER_PATH } from '@/constants/lad'

export type DataScreenNavBridgeCleanup = () => void

const NAV_LINKS = [
  { id: 'u18', path: LAD_BACKEND_HOME_PATH, role: 'button', ariaLabel: '进入控制台' },
  { id: 'u103', path: LAD_BACKEND_HOME_PATH, role: 'link', ariaLabel: '历史事件' },
  { id: 'u183', path: LAD_MESSAGE_CENTER_PATH, role: 'link', ariaLabel: '消息中心更多' },
  { id: 'u391', path: LAD_BACKEND_HOME_PATH, role: 'button', ariaLabel: '控制台' }
] as const

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
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    onClick()
  }

  element.addEventListener('click', handleClick, true)
  return () => element.removeEventListener('click', handleClick, true)
}

function normalizeConsoleShortcut(doc: Document) {
  const button = doc.getElementById('u391') as HTMLElement | null
  if (!button) return

  const placeholderImage = doc.getElementById('u391_img') as HTMLElement | null
  if (placeholderImage) {
    placeholderImage.style.setProperty('display', 'none', 'important')
  }

  Object.assign(button.style, {
    alignItems: 'center',
    background: 'linear-gradient(135deg, #3f4656 0%, #2f3543 100%)',
    border: '1px solid rgba(255, 255, 255, 0.82)',
    borderRadius: '2px',
    boxShadow: '0 8px 18px rgba(28, 36, 52, 0.2)',
    boxSizing: 'border-box',
    color: '#fff',
    display: 'flex',
    fontSize: '16px',
    fontWeight: '700',
    justifyContent: 'center',
    letterSpacing: '0',
    lineHeight: '20px',
    textAlign: 'center',
    zIndex: '20'
  })

  const text = doc.getElementById('u391_text') as HTMLElement | null
  if (text) {
    Object.assign(text.style, {
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      inset: '0',
      padding: '0 8px',
      width: '100%'
    })
  }
}

export function bindDataScreenNavBridge(doc: Document, router: Router): DataScreenNavBridgeCleanup {
  normalizeConsoleShortcut(doc)

  const cleanups = NAV_LINKS.map((link) =>
    bindClickableElement(
      doc,
      link.id,
      () => {
        void router.push(link.path)
      },
      { role: link.role, ariaLabel: link.ariaLabel }
    )
  ).filter(Boolean) as Array<() => void>

  return () => cleanups.forEach((cleanup) => cleanup())
}
