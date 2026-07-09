import { postDeviceCommandApi } from '@/api/lad/device-control'

export type DataScreenDisposalBridgeCleanup = () => void

type DisposalKey = 'radio' | 'nav' | 'sound' | 'laser' | 'microwave'

type PendingAction =
  | { type: 'activate'; key: DisposalKey }
  | { type: 'deactivate'; key: DisposalKey }

interface DisposalButton {
  key: DisposalKey
  elementId: string
  label: string
  laserPanelId?: string
}

const DISPOSAL_BUTTONS: DisposalButton[] = [
  { key: 'radio', elementId: 'u324', label: '无线电干扰' },
  { key: 'nav', elementId: 'u136', label: '导航诱骗' },
  { key: 'sound', elementId: 'u137', label: '声光驱离' },
  { key: 'laser', elementId: 'u140', label: '激光打击', laserPanelId: 'u258' },
  { key: 'microwave', elementId: 'u141', label: '微波打击' }
]

const LASER_PANEL_STATES = ['u258_state0', 'u258_state1']
const COUNTDOWN_SECONDS = 10
const STYLE_ID = 'lad-disposal-bridge-styles'

const PANEL = {
  laserConfirm: 'u293',
  systemHint: 'u300',
  confirmOn: 'u304',
  confirmOff: 'u314'
} as const

const BUTTON = {
  manualReview: 'u295',
  executeConfirm: 'u296',
  countdown: 'u299',
  systemHintText: 'u302',
  confirmOnCancel: 'u311',
  confirmOnOk: 'u312',
  confirmOnText: 'u313',
  confirmOffCancel: 'u321',
  confirmOffOk: 'u322',
  confirmOffText: 'u323',
  laserStrike: 'u140',
  release: 'u138'
} as const

const RELEASE_BUTTON_LABEL = '解除反制（交互）'

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

function setPanelVisible(doc: Document, panelId: string, visible: boolean) {
  const panel = doc.getElementById(panelId) as HTMLElement | null
  if (!panel) return
  panel.style.display = visible ? 'block' : 'none'
  panel.style.visibility = visible ? 'visible' : 'hidden'
  panel.classList.toggle('ax_default_hidden', !visible)
}

function setLabelHtml(doc: Document, elementId: string, html: string) {
  const host = doc.getElementById(`${elementId}_text`) as HTMLElement | null
  if (!host) return
  host.innerHTML = html
}

function setButtonSelected(doc: Document, elementId: string, selected: boolean) {
  const element = doc.getElementById(elementId) as HTMLElement | null
  if (!element) return
  element.classList.toggle('selected', selected)
}

function injectStyles(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #u258_state1.lad-laser-active {
      animation: lad-laser-blink 600ms ease-in-out infinite;
    }
    @keyframes lad-laser-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `
  doc.head.appendChild(style)
}

function setLaserPanelActive(doc: Document, active: boolean) {
  const idle = doc.getElementById(LASER_PANEL_STATES[0]) as HTMLElement | null
  const running = doc.getElementById(LASER_PANEL_STATES[1]) as HTMLElement | null
  if (idle) {
    idle.style.visibility = active ? 'hidden' : 'visible'
    idle.style.display = active ? 'none' : 'block'
  }
  if (running) {
    running.style.visibility = active ? 'visible' : 'hidden'
    running.style.display = active ? 'block' : 'none'
    running.classList.remove('lad-laser-active')
    if (active) running.classList.add('lad-laser-active')
  }
}

function resolveReleaseButton(doc: Document) {
  return (
    (doc.querySelector(`[data-label="${RELEASE_BUTTON_LABEL}"]`) as HTMLElement | null) ??
    doc.getElementById(BUTTON.release)
  )
}

export function bindDataScreenDisposalBridge(doc: Document): DataScreenDisposalBridgeCleanup {
  injectStyles(doc)

  const activeKeyRef = { current: null as DisposalKey | null }
  const getActiveKey = () => activeKeyRef.current
  const setActiveKey = (key: DisposalKey | null) => {
    activeKeyRef.current = key
  }
  let pendingAction: PendingAction | null = null
  let countdownTimer: number | undefined
  let hintTimer: number | undefined
  let countdownValue = COUNTDOWN_SECONDS

  const buttonByKey = Object.fromEntries(
    DISPOSAL_BUTTONS.map((item) => [item.key, item])
  ) as Record<DisposalKey, DisposalButton>

  const clearCountdown = () => {
    if (countdownTimer !== undefined) {
      window.clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }

  const clearHintTimer = () => {
    if (hintTimer !== undefined) {
      window.clearTimeout(hintTimer)
      hintTimer = undefined
    }
  }

  const hideAllDialogs = () => {
    clearCountdown()
    setPanelVisible(doc, PANEL.laserConfirm, false)
    setPanelVisible(doc, PANEL.confirmOn, false)
    setPanelVisible(doc, PANEL.confirmOff, false)
  }

  const showSystemHint = (message: string) => {
    clearHintTimer()
    setLabelHtml(
      doc,
      BUTTON.systemHintText,
      `<p><span>提示：${message}</span></p>`
    )
    setPanelVisible(doc, PANEL.systemHint, true)
    hintTimer = window.setTimeout(() => {
      setPanelVisible(doc, PANEL.systemHint, false)
      hintTimer = undefined
    }, 4000)
  }

  const updateCountdownUi = () => {
    setLabelHtml(doc, BUTTON.countdown, `<p><span>${countdownValue}</span></p>`)
    setLabelHtml(
      doc,
      BUTTON.executeConfirm,
      `<p><span>&nbsp;确认执行（&nbsp; ${countdownValue} &nbsp; s）</span></p>`
    )
  }

  const startLaserCountdown = () => {
    clearCountdown()
    countdownValue = COUNTDOWN_SECONDS
    updateCountdownUi()
    setPanelVisible(doc, PANEL.laserConfirm, true)

    countdownTimer = window.setInterval(() => {
      countdownValue -= 1
      if (countdownValue > 0) {
        updateCountdownUi()
        return
      }
      clearCountdown()
      void executeLaserStrike()
    }, 1000)
  }

  const applyActiveVisual = (key: DisposalKey | null) => {
    DISPOSAL_BUTTONS.forEach((item) => {
      setButtonSelected(doc, item.elementId, item.key === key)
    })
    setLaserPanelActive(doc, key === 'laser')
  }

  const deactivate = (key: DisposalKey) => {
    if (getActiveKey() !== key) return
    setActiveKey(null)
    applyActiveVisual(null)
  }

  const activate = (key: DisposalKey) => {
    const previous = getActiveKey()
    if (previous && previous !== key) {
      setButtonSelected(doc, buttonByKey[previous].elementId, false)
    }
    setActiveKey(key)
    applyActiveVisual(key)
  }

  const showConfirmOffDialog = (action: Extract<PendingAction, { type: 'deactivate' }>) => {
    pendingAction = action
    const label = buttonByKey[action.key].label
    setLabelHtml(
      doc,
      BUTTON.confirmOffText,
      `<p><span>提示：是否确认关闭</span><span style="color:#02A7F0;">${label}</span></p>`
    )
    setPanelVisible(doc, PANEL.confirmOff, true)
  }

  const showConfirmOnDialog = (key: DisposalKey) => {
    pendingAction = { type: 'activate', key }
    setLabelHtml(
      doc,
      BUTTON.confirmOnText,
      `<p><span>提示：是否确认执行</span><span style="color:#02A7F0;">${buttonByKey[key].label}</span></p>`
    )
    setPanelVisible(doc, PANEL.confirmOn, true)
  }

  const executeLaserStrike = async () => {
    hideAllDialogs()
    activate('laser')
    showSystemHint('激光打击指令已下发，设备激光-01 正在执行')
    try {
      await postDeviceCommandApi({
        deviceRecordId: '激光-01',
        deviceCode: '激光-01',
        deviceModel: 'TBD-LSR',
        deviceName: '激光-01',
        actionKey: 'laser_strike',
        actionLabel: '激光打击',
        channel: 'supplier',
        payload: { targetId: 'TG-2024-0002' }
      })
    } catch {
      // mock/local 模式下忽略网络错误
    }
  }

  const confirmPendingOff = () => {
    if (!pendingAction || pendingAction.type !== 'deactivate') return
    deactivate(pendingAction.key)
    hideAllDialogs()
    showSystemHint(`${buttonByKey[pendingAction.key].label}已关闭`)
    pendingAction = null
  }

  const confirmPendingOn = () => {
    if (!pendingAction || pendingAction.type !== 'activate') return
    hideAllDialogs()
    if (pendingAction.key === 'laser') {
      void executeLaserStrike()
    } else {
      activate(pendingAction.key)
      showSystemHint(`${buttonByKey[pendingAction.key].label}已启动`)
    }
    pendingAction = null
  }

  const handleDisposalButtonClick = (key: DisposalKey) => {
    hideAllDialogs()
    if (key === 'laser') {
      if (getActiveKey() === 'laser') {
        showConfirmOffDialog({ type: 'deactivate', key: 'laser' })
        return
      }
      if (getActiveKey()) {
        showSystemHint('请先解除当前反制后再执行激光打击')
        return
      }
      startLaserCountdown()
      return
    }

    if (getActiveKey() === key) {
      showConfirmOffDialog({ type: 'deactivate', key })
      return
    }
    if (getActiveKey()) {
      showSystemHint('请先解除当前反制后再切换处置方式')
      return
    }
    showConfirmOnDialog(key)
  }

  const handleReleaseClick = () => {
    hideAllDialogs()
    setActiveKey(null)
    applyActiveVisual(null)
  }

  const cleanups: DataScreenDisposalBridgeCleanup[] = []

  const laserCleanup = bindClickableElement(
    doc,
    BUTTON.laserStrike,
    () => handleDisposalButtonClick('laser'),
    { ariaLabel: '激光打击' }
  )
  if (laserCleanup) cleanups.push(laserCleanup)

  const releaseElement = resolveReleaseButton(doc)
  if (releaseElement) {
    releaseElement.style.cursor = 'pointer'
    releaseElement.setAttribute('role', 'button')
    releaseElement.setAttribute('aria-label', RELEASE_BUTTON_LABEL)
    const handleRelease = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      handleReleaseClick()
    }
    releaseElement.addEventListener('click', handleRelease, true)
    cleanups.push(() => releaseElement.removeEventListener('click', handleRelease, true))
  }

  DISPOSAL_BUTTONS.filter((item) => item.key !== 'laser').forEach((item) => {
    const cleanup = bindClickableElement(
      doc,
      item.elementId,
      () => handleDisposalButtonClick(item.key),
      { ariaLabel: item.label }
    )
    if (cleanup) cleanups.push(cleanup)
  })

  ;[
    [BUTTON.manualReview, hideAllDialogs],
    [BUTTON.executeConfirm, () => void executeLaserStrike()],
    [BUTTON.confirmOnCancel, hideAllDialogs],
    [BUTTON.confirmOnOk, confirmPendingOn],
    [BUTTON.confirmOffCancel, hideAllDialogs],
    [BUTTON.confirmOffOk, confirmPendingOff]
  ].forEach(([id, handler]) => {
    const cleanup = bindClickableElement(doc, id, handler as () => void)
    if (cleanup) cleanups.push(cleanup)
  })

  ;['u318', 'u319', 'u308', 'u309'].forEach((id) => {
    const cleanup = bindClickableElement(doc, id, hideAllDialogs)
    if (cleanup) cleanups.push(cleanup)
  })

  applyActiveVisual(null)
  hideAllDialogs()
  setPanelVisible(doc, PANEL.systemHint, false)

  return () => {
    clearCountdown()
    clearHintTimer()
    cleanups.forEach((cleanup) => cleanup())
  }
}
