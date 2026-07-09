import {
  buildDataScreenDeviceView,
  DATA_SCREEN_SUMMARY_PANELS,
  DATA_SCREEN_VIEW_MORE_BUTTONS,
  setPrototypeLabelText
} from './dataScreenDeviceModel'

export type DataScreenBridgeCleanup = () => void

function bindClickableElement(
  doc: Document,
  elementId: string,
  onClick: () => void,
  options?: { ariaLabel?: string }
) {
  const element = doc.getElementById(elementId) as HTMLElement | null
  if (!element) return undefined

  element.style.cursor = 'pointer'
  element.setAttribute('role', 'button')
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

export function syncDataScreenDeviceSummary(doc: Document) {
  DATA_SCREEN_SUMMARY_PANELS.forEach((panel) => {
    const view = buildDataScreenDeviceView(panel.model)
    if (!view) return
    panel.fields.forEach((field) => {
      setPrototypeLabelText(doc, field.elementId, field.render(view))
    })
  })
}

export function bindDataScreenDeviceBridge(
  doc: Document,
  onOpenDetail: (model: string) => void
): DataScreenBridgeCleanup {
  syncDataScreenDeviceSummary(doc)

  const cleanups: DataScreenBridgeCleanup[] = []

  Object.entries(DATA_SCREEN_VIEW_MORE_BUTTONS).forEach(([buttonId, model]) => {
    const view = buildDataScreenDeviceView(model)
    const cleanup = bindClickableElement(
      doc,
      buttonId,
      () => onOpenDetail(model),
      { ariaLabel: `查看${view?.deviceName ?? model}详情` }
    )
    if (cleanup) cleanups.push(cleanup)
  })

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}
