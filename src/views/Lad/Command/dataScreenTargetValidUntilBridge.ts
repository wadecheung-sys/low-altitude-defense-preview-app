const DEFAULT_LIST_VALID_UNTIL = '永久'

type Cleanup = () => void

function appendTargetCardValidUntil(doc: Document, container: HTMLElement, top: number): Cleanup {
  const row = doc.createElement('div')
  const modelLabel = doc.getElementById('u40')
  const modelLabelStyle = modelLabel ? doc.defaultView?.getComputedStyle(modelLabel) : undefined
  row.className = 'lad-target-list-valid-until'
  row.textContent = `名单有效期：${DEFAULT_LIST_VALID_UNTIL}`
  Object.assign(row.style, {
    position: 'absolute',
    left: '99px',
    top: `${top}px`,
    width: '220px',
    height: '15px',
    display: 'flex',
    alignItems: 'center',
    color: modelLabelStyle?.color || '#333333',
    fontFamily: modelLabelStyle?.fontFamily || "''",
    fontSize: modelLabelStyle?.fontSize || '13px',
    fontStyle: modelLabelStyle?.fontStyle || 'normal',
    fontWeight: modelLabelStyle?.fontWeight || '700',
    lineHeight: modelLabelStyle?.lineHeight || 'normal',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: '2'
  })
  container.appendChild(row)
  return () => row.remove()
}

function appendPopupValidUntil(doc: Document, popupId: string): Cleanup | undefined {
  const popup = doc.getElementById(popupId) as HTMLElement | null
  const text = doc.getElementById(`${popupId}_text`) as HTMLElement | null
  if (!popup || !text) return

  const listStatusRow = Array.from(text.children).find(
    (child) => child.tagName === 'P' && child.textContent?.includes('名单状态：')
  )
  if (!listStatusRow) return

  const row = doc.createElement('p')
  row.className = 'lad-target-popup-valid-until'
  const content = doc.createElement('span')
  content.style.fontFamily = "''"
  content.style.fontWeight = '400'
  content.textContent = `名单有效期：   ${DEFAULT_LIST_VALID_UNTIL}`
  row.appendChild(content)
  listStatusRow.insertAdjacentElement('afterend', row)

  const background = doc.getElementById(`${popupId}_div`) as HTMLElement | null
  const previousPopupHeight = popup.style.height
  const previousBackgroundHeight = background?.style.height
  popup.style.height = '400px'
  if (background) background.style.height = '400px'

  return () => {
    row.remove()
    popup.style.height = previousPopupHeight
    if (background) background.style.height = previousBackgroundHeight || ''
  }
}

/**
 * 为首页数据大屏的黑/白名单无人机补充名单有效期。
 * “未知”目标尚未纳入后台名单管理，不展示该字段。
 */
export function bindDataScreenTargetValidUntil(doc: Document): Cleanup {
  const cleanups: Cleanup[] = []
  const targetListContent = doc.getElementById('u36_state0_content') as HTMLElement | null

  if (targetListContent) {
    ;[26, 123].forEach((top) => {
      cleanups.push(appendTargetCardValidUntil(doc, targetListContent, top))
    })
  }

  ;['u162', 'u167'].forEach((popupId) => {
    const cleanup = appendPopupValidUntil(doc, popupId)
    if (cleanup) cleanups.push(cleanup)
  })

  return () => cleanups.forEach((cleanup) => cleanup())
}
