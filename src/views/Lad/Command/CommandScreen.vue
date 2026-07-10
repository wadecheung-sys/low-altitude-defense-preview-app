<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LAD_BACKEND_HOME_PATH, LAD_MESSAGE_CENTER_PATH } from '@/constants/lad'
import DataScreenDeviceDetailModal from './DataScreenDeviceDetailModal.vue'
import { bindDataScreenDeviceBridge } from './dataScreenDeviceBridge'
import { bindDataScreenDisposalBridge } from './dataScreenDisposalBridge'
import { bindDataScreenLinkageBridge } from './dataScreenLinkageBridge'
import { resolvePrototypeDocument } from './dataScreenPrototypeDoc'

defineOptions({ name: 'LadDataScreen' })

const PROTOTYPE_WIDTH = 1920
/** 原型画布高度：主屏 1080 + 底部演示按钮区域（u263/u321 位于 y=1174，高 68） */
const PROTOTYPE_HEIGHT = 1242
/** 页面展示最大宽度（仅约束宽度，高度随内容完整呈现并可滚动） */
const DISPLAY_MAX_WIDTH = 1920
const PROTOTYPE_SRC = `${import.meta.env.BASE_URL}prototypes/data-screen-03/index.html`

const BACKEND_ENTRY_BUTTON_ID = 'u18'
const HISTORY_EVENT_LINK_ID = 'u103'
/** 消息区右侧「更多」，非设备列表区的「查看更多」(u170) */
const MESSAGE_CENTER_LINK_ID = 'u206'

type Cleanup = () => void

const router = useRouter()

const containerRef = ref<HTMLElement>()
const iframeRef = ref<HTMLIFrameElement>()
const frameLoaded = ref(false)
const stageScale = ref(1)
const deviceDetailVisible = ref(false)
const deviceDetailModel = ref('')

let bindRetryTimer: number | undefined
let resizeObserver: ResizeObserver | undefined
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

const updateStageScale = () => {
  const container = containerRef.value
  if (!container) return

  const availableWidth = container.clientWidth
  const targetWidth = Math.min(availableWidth, DISPLAY_MAX_WIDTH)
  const nextScale = targetWidth / PROTOTYPE_WIDTH

  if (!Number.isFinite(nextScale) || nextScale <= 0) {
    stageScale.value = 1
    return
  }

  stageScale.value = Math.max(nextScale, 0.1)
}

const getPrototypeDocument = () => resolvePrototypeDocument(iframeRef.value)

const normalizePrototypeSurface = () => {
  const doc = getPrototypeDocument()
  if (!doc) return

  doc.documentElement.style.overflow = 'hidden'
  doc.body.style.overflow = 'hidden'
  doc.body.style.margin = '0'
  doc.body.style.background = '#ffffff'
  doc.body.style.minHeight = `${PROTOTYPE_HEIGHT}px`

  const base = doc.getElementById('base') as HTMLElement | null
  if (!base) return

  base.style.width = `${PROTOTYPE_WIDTH}px`
  base.style.height = `${PROTOTYPE_HEIGHT}px`
  base.style.overflow = 'visible'
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

function bindPrototypeInteractions() {
  cleanupPrototypeBindings?.()
  cleanupPrototypeBindings = undefined

  const doc = getPrototypeDocument()
  if (!doc) return false

  const cleanups: Cleanup[] = []

  const backendEntryCleanup = bindClickableElement(
    doc,
    BACKEND_ENTRY_BUTTON_ID,
    () => {
      void router.push(LAD_BACKEND_HOME_PATH)
    },
    { role: 'button', ariaLabel: '进入控制台' }
  )
  if (!backendEntryCleanup) return false
  cleanups.push(backendEntryCleanup)

  const historyLinkCleanup = bindClickableElement(
    doc,
    HISTORY_EVENT_LINK_ID,
    () => {
      void router.push(LAD_BACKEND_HOME_PATH)
    },
    { role: 'link', ariaLabel: '历史事件' }
  )
  if (!historyLinkCleanup) return false
  cleanups.push(historyLinkCleanup)

  const messageLinkCleanup = bindClickableElement(
    doc,
    MESSAGE_CENTER_LINK_ID,
    () => {
      void router.push(LAD_MESSAGE_CENTER_PATH)
    },
    { role: 'link', ariaLabel: '消息中心' }
  )
  if (!messageLinkCleanup) return false
  cleanups.push(messageLinkCleanup)

  cleanups.push(
    bindDataScreenDeviceBridge(doc, (model) => {
      deviceDetailModel.value = model
      deviceDetailVisible.value = true
    })
  )

  cleanups.push(bindDataScreenLinkageBridge(doc))
  cleanups.push(bindDataScreenDisposalBridge(doc))

  cleanupPrototypeBindings = () => {
    cleanups.forEach((cleanup) => cleanup())
  }

  return true
}

const schedulePrototypeBinding = () => {
  window.clearTimeout(bindRetryTimer)
  bindRetryTimer = window.setTimeout(() => {
    const tryBind = () => {
      if (bindPrototypeInteractions()) return
      bindRetryTimer = window.setTimeout(tryBind, 160)
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(tryBind)
    })
  }, 120)
}

const handleFrameLoad = () => {
  frameLoaded.value = true
  normalizePrototypeSurface()
  void nextTick(() => {
    updateStageScale()
    schedulePrototypeBinding()
  })
}

onMounted(() => {
  updateStageScale()

  const container = containerRef.value
  if (container && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateStageScale()
    })
    resizeObserver.observe(container)
  }

  window.addEventListener('resize', updateStageScale)
})

onBeforeUnmount(() => {
  cleanupPrototypeBindings?.()
  cleanupPrototypeBindings = undefined
  resizeObserver?.disconnect()
  resizeObserver = undefined
  window.clearTimeout(bindRetryTimer)
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

    <DataScreenDeviceDetailModal v-model="deviceDetailVisible" :device-model="deviceDetailModel" />
  </section>
</template>

<style scoped lang="less">
.lad-data-screen {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow-x: auto;
  overflow-y: auto;
  background:
    radial-gradient(circle at top, rgba(57, 135, 218, 0.08), transparent 30%),
    linear-gradient(180deg, #f7f8fa 0%, #eef1f4 56%, #e6eaef 100%);
}

.lad-data-screen__viewport {
  position: relative;
  flex-shrink: 0;
  max-width: 1920px;
  margin: 0 auto;
  padding-bottom: 24px;
  overflow: hidden;
}

.lad-data-screen__stage {
  transform-origin: top left;
}

.lad-data-screen__frame {
  display: block;
  width: 1920px;
  height: 100%;
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

@keyframes lad-data-screen-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
