<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LAD_BACKEND_HOME_PATH } from '@/constants/lad'

defineOptions({ name: 'LadDataScreen' })

const PROTOTYPE_WIDTH = 1920
const PROTOTYPE_HEIGHT = 1080
const PROTOTYPE_SRC = `${import.meta.env.BASE_URL}prototypes/data-screen-03/index.html`
const BACKEND_ENTRY_RESET_DELAY = 240

const router = useRouter()

const containerRef = ref<HTMLElement>()
const iframeRef = ref<HTMLIFrameElement>()
const frameLoaded = ref(false)
const frameBindingReady = ref(false)
const isEnteringBackend = ref(false)
const stageScale = ref(1)

let bindRetryTimer: number | undefined
let resetEntryTimer: number | undefined
let backendWarmupPromise: Promise<unknown> | undefined
let cleanupPrototypeButton: (() => void) | undefined

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
  backendWarmupPromise ??= import('@/views/Lad/Incident/HistoryEvent.vue')
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
  const button = iframeRef.value?.contentDocument?.getElementById('u9') as HTMLElement | null
  if (!button) return

  button.style.cursor = isEnteringBackend.value ? 'wait' : 'pointer'
  button.style.pointerEvents = isEnteringBackend.value ? 'none' : 'auto'
  button.style.opacity = isEnteringBackend.value ? '0.82' : '1'
}

const enterBackend = async () => {
  if (isEnteringBackend.value) return

  isEnteringBackend.value = true
  syncPrototypeButtonState()
  void warmBackendPage()

  try {
    await router.push(LAD_BACKEND_HOME_PATH)
  } finally {
    window.clearTimeout(resetEntryTimer)
    resetEntryTimer = window.setTimeout(() => {
      isEnteringBackend.value = false
      syncPrototypeButtonState()
    }, BACKEND_ENTRY_RESET_DELAY)
  }
}

const bindPrototypeButton = () => {
  cleanupPrototypeButton?.()
  cleanupPrototypeButton = undefined
  frameBindingReady.value = false

  const doc = iframeRef.value?.contentDocument
  const button = doc?.getElementById('u9') as HTMLElement | null
  if (!doc || !button) return false

  const text = button.querySelector('.text') as HTMLElement | null

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

  button.tabIndex = 0
  button.setAttribute('role', 'button')
  button.setAttribute('aria-label', '进入控制台')

  button.addEventListener('click', handleClick, true)
  button.addEventListener('keydown', handleKeydown, true)
  button.addEventListener('mouseenter', handleWarmup, { passive: true })
  text?.addEventListener('mouseenter', handleWarmup, { passive: true })

  cleanupPrototypeButton = () => {
    button.removeEventListener('click', handleClick, true)
    button.removeEventListener('keydown', handleKeydown, true)
    button.removeEventListener('mouseenter', handleWarmup)
    text?.removeEventListener('mouseenter', handleWarmup)
  }

  frameBindingReady.value = true
  syncPrototypeButtonState()
  return true
}

const schedulePrototypeBinding = () => {
  window.clearTimeout(bindRetryTimer)
  bindRetryTimer = window.setTimeout(() => {
    if (bindPrototypeButton()) return

    bindRetryTimer = window.setTimeout(() => {
      void nextTick(() => {
        bindPrototypeButton()
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
  cleanupPrototypeButton?.()
  cleanupPrototypeButton = undefined
  window.clearTimeout(bindRetryTimer)
  window.clearTimeout(resetEntryTimer)
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
          title="低空防御综合管控平台数据大屏"
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
