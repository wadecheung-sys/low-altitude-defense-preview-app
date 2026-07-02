<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  LAD_BACKEND_HOME_PATH,
  LAD_MESSAGE_CENTER_PATH
} from '@/constants/lad'

defineOptions({ name: 'LadDataScreen' })

const PROTOTYPE_WIDTH = 1920
const PROTOTYPE_HEIGHT = 1080
const PROTOTYPE_SRC = `${import.meta.env.BASE_URL}prototypes/data-screen-03/index.html`
const BACKEND_ENTRY_RESET_DELAY = 240

const HISTORY_EVENT_LINK_ID = 'u111'
const MESSAGE_CENTER_LINK_ID = 'u177'

const MAP_TARGET_BINDINGS = [
  { iconId: 'u188', detailId: 'u196', lineId: 'u185', label: '选择无人机目标' },
  { iconId: 'u189', detailId: 'u193', lineId: 'u183', label: '选择无人机目标' },
  { iconId: 'u190', detailId: 'u191', lineId: 'u182', label: '选择无人机目标' },
  { iconId: 'u180', detailId: 'u199', lineId: 'u184', label: '选择飞鸟目标' }
] as const

const DETAIL_PANEL_IDS = MAP_TARGET_BINDINGS.map((item) => item.detailId)
const LINE_IDS = MAP_TARGET_BINDINGS.map((item) => item.lineId)
const ICON_IDS = MAP_TARGET_BINDINGS.map((item) => item.iconId)

const DETAIL_CLOSE_BUTTON_MAP: Record<string, string> = {
  u196: 'u197',
  u193: 'u194',
  u191: 'u192',
  u199: 'u200'
}

const CLOCK_ELEMENT_IDS = {
  weekday: 'u15',
  date: 'u16',
  time: 'u17'
} as const

const BACKEND_ENTRY_BUTTON_ID = 'u18'

const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

type Cleanup = () => void

const router = useRouter()

const containerRef = ref<HTMLElement>()
const iframeRef = ref<HTMLIFrameElement>()
const frameLoaded = ref(false)
const frameBindingReady = ref(false)
const isEnteringBackend = ref(false)
const stageScale = ref(1)

let bindRetryTimer: number | undefined
let resetEntryTimer: number | undefined
let clockTimer: number | undefined
let backendWarmupPromise: Promise<unknown> | undefined
let cleanupPrototypeBindings: Cleanup | undefined

const viewportStyle = computed(() => ({
  width: `${PROTOTYPE_WIDTH * stageScale.value}px`,
  height: `${PROTOTYPE_HEIGHT * stageScale.value}px`
}))

const stageStyle = computed(() => ({
  width: `${PROTOTYPE_WIDTH}px`,
  height: `${PROTOTYPE_HEIGHT}px`,
  transform: `scale(${stageScale.value})`
}))

const warmBackendPage = () => {
  backendWarmupPromise ??= Promise.all([
    import('@/views/Lad/Incident/HistoryEvent.vue'),
    import('@/views/Lad/Message/MessageCenterList.vue')
  ])
  return backendWarmupPromise
}

const updateStageScale = () => {
  const container = containerRef.value
  if (!container) return

  const widthScale = container.clientWidth / PROTOTYPE_WIDTH
  const heightScale = container.clientHeight / PROTOTYPE_HEIGHT
  const nextScale = Math.min(widthScale, heightScale, 1)

  if (!Number.isFinite(nextScale) || nextScale <= 0) {
    stageScale.value = 1
    return
  }

  stageScale.value = Math.max(nextScale, 0.1)
}

const normalizePrototypeSurface = () => {
  const doc = iframeRef.value?.contentDocument
  if (!doc) return

  doc.documentElement.style.overflow = 'hidden'
  doc.body.style.overflow = 'hidden'
  doc.body.style.margin = '0'
  doc.body.style.background = '#ffffff'

  const base = doc.getElementById('base') as HTMLElement | null
  if (!base) return

  base.style.width = `${PROTOTYPE_WIDTH}px`
  base.style.height = `${PROTOTYPE_HEIGHT}px`
  base.style.overflow = 'hidden'
}

const syncPrototypeButtonState = () => {
  const button = iframeRef.value?.contentDocument?.getElementById(BACKEND_ENTRY_BUTTON_ID) as HTMLElement | null
  if (!button) return

  button.style.cursor = isEnteringBackend.value ? 'wait' : 'pointer'
  button.style.pointerEvents = isEnteringBackend.value ? 'none' : 'auto'
  button.style.opacity = isEnteringBackend.value ? '0.82' : '1'
}

const navigateFromScreen = async (path: string) => {
  if (isEnteringBackend.value) return

  isEnteringBackend.value = true
  syncPrototypeButtonState()
  void warmBackendPage()

  try {
    await router.push(path)
  } finally {
    window.clearTimeout(resetEntryTimer)
    resetEntryTimer = window.setTimeout(() => {
      isEnteringBackend.value = false
      syncPrototypeButtonState()
    }, BACKEND_ENTRY_RESET_DELAY)
  }
}

const enterBackend = () => navigateFromScreen(LAD_BACKEND_HOME_PATH)

function setElementSelected(doc: Document, id: string, selected: boolean) {
  const element = doc.getElementById(id)
  if (!element) return

  element.classList.toggle('selected', selected)
  doc.getElementById(`${id}_div`)?.classList.toggle('selected', selected)
}

function setElementVisible(doc: Document, id: string, visible: boolean) {
  const element = doc.getElementById(id)
  if (!element) return

  element.style.display = visible ? '' : 'none'
  element.style.visibility = visible ? 'visible' : 'hidden'
  element.classList.toggle('ax_default_hidden', !visible)
  setElementSelected(doc, id, visible)
}

function showDetailPanel(doc: Document, panelId: string | null) {
  for (const id of DETAIL_PANEL_IDS) {
    setElementVisible(doc, id, id === panelId)
  }
}

function showTargetLine(doc: Document, lineId: string | null) {
  for (const id of LINE_IDS) {
    setElementVisible(doc, id, id === lineId)
  }
}

function clearMapTargetSelection(doc: Document) {
  for (const id of ICON_IDS) {
    setElementSelected(doc, id, false)
  }
  showDetailPanel(doc, null)
  showTargetLine(doc, null)
}

function selectMapTarget(
  doc: Document,
  binding: (typeof MAP_TARGET_BINDINGS)[number]
) {
  for (const item of MAP_TARGET_BINDINGS) {
    setElementSelected(doc, item.iconId, item.iconId === binding.iconId)
  }
  showDetailPanel(doc, binding.detailId)
  showTargetLine(doc, binding.lineId)
}

function bindClickableElement(
  doc: Document,
  elementId: string,
  onClick: () => void,
  options?: { role?: string; ariaLabel?: string; cursor?: string }
) {
  const element = doc.getElementById(elementId) as HTMLElement | null
  if (!element) return undefined

  element.style.cursor = options?.cursor ?? 'pointer'
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

function updateHeaderClock(doc: Document) {
  const now = new Date()
  const weekdayEl = doc.getElementById(CLOCK_ELEMENT_IDS.weekday)?.querySelector('.text span')
  const dateEl = doc.getElementById(CLOCK_ELEMENT_IDS.date)?.querySelector('.text span')
  const timeEl = doc.getElementById(CLOCK_ELEMENT_IDS.time)?.querySelector('.text span')

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  if (weekdayEl) weekdayEl.textContent = WEEKDAY_LABELS[now.getDay()]
  if (dateEl) dateEl.textContent = `${year}.${month}.${day}`
  if (timeEl) timeEl.textContent = `${hours}:${minutes}`
}

function startHeaderClock(doc: Document) {
  updateHeaderClock(doc)
  window.clearInterval(clockTimer)
  clockTimer = window.setInterval(() => updateHeaderClock(doc), 30_000)
}

function bindPrototypeInteractions() {
  cleanupPrototypeBindings?.()
  cleanupPrototypeBindings = undefined
  frameBindingReady.value = false

  const doc = iframeRef.value?.contentDocument
  if (!doc) return false

  const cleanups: Cleanup[] = []

  const backendButton = doc.getElementById(BACKEND_ENTRY_BUTTON_ID) as HTMLElement | null
  if (backendButton) {
    const text = backendButton.querySelector('.text') as HTMLElement | null
    const handleClick = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      void enterBackend()
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      handleClick(event)
    }
    const handleWarmup = () => {
      void warmBackendPage()
    }

    backendButton.tabIndex = 0
    backendButton.setAttribute('role', 'button')
    backendButton.setAttribute('aria-label', '进入控制台')

    backendButton.addEventListener('click', handleClick, true)
    backendButton.addEventListener('keydown', handleKeydown, true)
    backendButton.addEventListener('mouseenter', handleWarmup, { passive: true })
    text?.addEventListener('mouseenter', handleWarmup, { passive: true })

    cleanups.push(() => {
      backendButton.removeEventListener('click', handleClick, true)
      backendButton.removeEventListener('keydown', handleKeydown, true)
      backendButton.removeEventListener('mouseenter', handleWarmup)
      text?.removeEventListener('mouseenter', handleWarmup)
    })
  }

  const historyLinkCleanup = bindClickableElement(
    doc,
    HISTORY_EVENT_LINK_ID,
    () => {
      void navigateFromScreen(LAD_BACKEND_HOME_PATH)
    },
    { role: 'link', ariaLabel: '历史事件' }
  )
  if (historyLinkCleanup) cleanups.push(historyLinkCleanup)

  const messageLinkCleanup = bindClickableElement(
    doc,
    MESSAGE_CENTER_LINK_ID,
    () => {
      void navigateFromScreen(LAD_MESSAGE_CENTER_PATH)
    },
    { role: 'link', ariaLabel: '消息中心' }
  )
  if (messageLinkCleanup) cleanups.push(messageLinkCleanup)

  for (const binding of MAP_TARGET_BINDINGS) {
    const cleanup = bindClickableElement(
      doc,
      binding.iconId,
      () => selectMapTarget(doc, binding),
      { role: 'button', ariaLabel: binding.label }
    )
    if (cleanup) cleanups.push(cleanup)
  }

  for (const [detailId, closeId] of Object.entries(DETAIL_CLOSE_BUTTON_MAP)) {
    const cleanup = bindClickableElement(
      doc,
      closeId,
      () => clearMapTargetSelection(doc),
      { role: 'button', ariaLabel: `关闭${detailId === 'u199' ? '飞鸟' : '无人机'}详情` }
    )
    if (cleanup) cleanups.push(cleanup)
  }

  if (!cleanups.length) return false

  selectMapTarget(doc, MAP_TARGET_BINDINGS[0])
  startHeaderClock(doc)

  cleanupPrototypeBindings = () => {
    window.clearInterval(clockTimer)
    cleanups.forEach((cleanup) => cleanup())
  }

  frameBindingReady.value = true
  syncPrototypeButtonState()
  return true
}

const schedulePrototypeBinding = () => {
  window.clearTimeout(bindRetryTimer)
  bindRetryTimer = window.setTimeout(() => {
    if (bindPrototypeInteractions()) return

    bindRetryTimer = window.setTimeout(() => {
      void nextTick(() => {
        bindPrototypeInteractions()
      })
    }, 160)
  }, 0)
}

const handleFrameLoad = () => {
  frameLoaded.value = true
  normalizePrototypeSurface()
  updateStageScale()
  schedulePrototypeBinding()
}

onMounted(() => {
  updateStageScale()
  window.addEventListener('resize', updateStageScale)
  window.setTimeout(() => {
    void warmBackendPage()
  }, 180)
})

onBeforeUnmount(() => {
  cleanupPrototypeBindings?.()
  cleanupPrototypeBindings = undefined
  window.clearTimeout(bindRetryTimer)
  window.clearTimeout(resetEntryTimer)
  window.clearInterval(clockTimer)
  window.removeEventListener('resize', updateStageScale)
})
</script>

<template>
  <section ref="containerRef" class="lad-data-screen">
    <div class="lad-data-screen__viewport" :style="viewportStyle">
      <div class="lad-data-screen__stage" :style="stageStyle">
        <iframe
          ref="iframeRef"
          class="lad-data-screen__frame"
          :src="PROTOTYPE_SRC"
          title="低空防御指挥控制平台数据大屏"
          @load="handleFrameLoad"
        ></iframe>
      </div>
    </div>

    <div v-if="!frameLoaded" class="lad-data-screen__loading">
      <span class="lad-data-screen__loading-ring"></span>
      <p>数据大屏加载中...</p>
    </div>

    <button
      v-if="frameLoaded && !frameBindingReady"
      class="lad-data-screen__fallback"
      type="button"
      :disabled="isEnteringBackend"
      @mouseenter="warmBackendPage"
      @click="enterBackend"
    >
      {{ isEnteringBackend ? '正在进入控制台...' : '进入控制台' }}
    </button>
  </section>
</template>

<style scoped lang="less">
.lad-data-screen {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(57, 135, 218, 0.08), transparent 30%),
    linear-gradient(180deg, #f7f8fa 0%, #eef1f4 56%, #e6eaef 100%);
}

.lad-data-screen__viewport {
  position: relative;
  overflow: hidden;
}

.lad-data-screen__stage {
  transform-origin: top left;
}

.lad-data-screen__frame {
  display: block;
  width: 1920px;
  height: 1080px;
  border: 0;
  background: #ffffff;
}

.lad-data-screen__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(245, 247, 250, 0.82);
  color: #445168;
  letter-spacing: 0.08em;
  backdrop-filter: blur(8px);
}

.lad-data-screen__loading p {
  margin: 0;
  font-size: 14px;
}

.lad-data-screen__loading-ring {
  width: 42px;
  height: 42px;
  border: 3px solid rgba(111, 180, 255, 0.2);
  border-top-color: #71b9ff;
  border-radius: 999px;
  animation: lad-data-screen-spin 0.8s linear infinite;
}

.lad-data-screen__fallback {
  position: absolute;
  top: 28px;
  right: 28px;
  z-index: 3;
  min-width: 148px;
  height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(92, 169, 255, 0.75);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(16, 61, 118, 0.88), rgba(21, 99, 179, 0.96));
  color: #eff7ff;
  font-size: 14px;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(2, 9, 20, 0.45);
}

.lad-data-screen__fallback:disabled {
  cursor: wait;
  opacity: 0.78;
}

@keyframes lad-data-screen-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
