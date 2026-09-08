<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bindDataScreenNavBridge } from './dataScreenNavBridge'

defineOptions({ name: 'LadDataScreen' })

const PROTOTYPE_WIDTH = 1920
const PROTOTYPE_HEIGHT = 1080
const DISPLAY_MAX_WIDTH = 1920
const PROTOTYPE_DIRECTORY = 'data-screen-03-20260908-145354'
const PROTOTYPE_PAGE = encodeURIComponent('数据大屏03.html')
const PROTOTYPE_VERSION = '20260908-145354'
const PROTOTYPE_SRC = `${import.meta.env.BASE_URL}prototypes/${PROTOTYPE_DIRECTORY}/${PROTOTYPE_PAGE}?v=${PROTOTYPE_VERSION}`

type Cleanup = () => void
type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

const router = useRouter()
const containerRef = ref<HTMLElement>()
const iframeRef = ref<HTMLIFrameElement>()
const frameLoaded = ref(false)
const stageScale = ref(1)

let bindRetryTimer: number | undefined
let backendPrefetchTimer: number | undefined
let backendPrefetchIdleId: number | undefined
let resizeObserver: ResizeObserver | undefined
let cleanupPrototypeBindings: Cleanup | undefined
let backendPrefetchPromise: Promise<unknown> | undefined

const viewportStyle = computed(() => ({
  width: `${PROTOTYPE_WIDTH * stageScale.value}px`,
  height: `${PROTOTYPE_HEIGHT * stageScale.value}px`
}))

const stageStyle = computed(() => ({
  width: `${PROTOTYPE_WIDTH}px`,
  height: `${PROTOTYPE_HEIGHT}px`,
  transform: `scale(${stageScale.value})`
}))

function updateStageScale() {
  const container = containerRef.value
  if (!container) return

  const availableWidth = container.clientWidth
  const availableHeight = container.clientHeight
  const targetWidth = Math.min(availableWidth, DISPLAY_MAX_WIDTH)
  const scaleW = targetWidth / PROTOTYPE_WIDTH
  const scaleH = availableHeight / PROTOTYPE_HEIGHT
  const nextScale = Math.min(scaleW, scaleH)

  if (!Number.isFinite(nextScale) || nextScale <= 0) {
    stageScale.value = 1
    return
  }

  stageScale.value = Math.max(nextScale, 0.1)
}

function getPrototypeDocument() {
  return iframeRef.value?.contentDocument ?? null
}

function normalizePrototypeSurface() {
  const doc = getPrototypeDocument()
  if (!doc) return

  doc.documentElement.style.overflow = 'hidden'
  doc.body.style.overflow = 'hidden'
  doc.body.style.margin = '0'
}

function bindPrototypeInteractions() {
  cleanupPrototypeBindings?.()
  cleanupPrototypeBindings = undefined

  const doc = getPrototypeDocument()
  if (!doc?.getElementById('base')) return false

  // 设备详情与配置由最新 Axure 导出原型自身处理；这里只桥接离开大屏的应用路由。
  const cleanups: Cleanup[] = [
    bindDataScreenNavBridge(doc, router, () => {
      void prefetchBackendEntries()
    })
  ]

  cleanupPrototypeBindings = () => {
    cleanups.forEach((cleanup) => cleanup())
  }

  return true
}

function schedulePrototypeBinding() {
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

/**
 * 大屏加载完成后预热离开大屏时最常访问的后台页面。
 * 动态 import 会同时缓存 Layout、表格等依赖分包，点击入口时只需完成路由渲染。
 */
function prefetchBackendEntries() {
  backendPrefetchPromise ??= Promise.allSettled([
    import('@/layout/Layout.vue'),
    import('@/views/Lad/Incident/HistoryEvent.vue'),
    import('@/views/Lad/Message/MessageCenterList.vue')
  ])
  return backendPrefetchPromise
}

function scheduleBackendPrefetch() {
  const idleWindow = window as IdleCapableWindow
  window.clearTimeout(backendPrefetchTimer)
  if (backendPrefetchIdleId !== undefined) {
    idleWindow.cancelIdleCallback?.(backendPrefetchIdleId)
    backendPrefetchIdleId = undefined
  }

  if (idleWindow.requestIdleCallback) {
    backendPrefetchIdleId = idleWindow.requestIdleCallback(
      () => {
        backendPrefetchIdleId = undefined
        void prefetchBackendEntries()
      },
      { timeout: 1500 }
    )
    return
  }

  backendPrefetchTimer = window.setTimeout(() => {
    void prefetchBackendEntries()
  }, 500)
}

function onFrameLoad() {
  frameLoaded.value = true
  normalizePrototypeSurface()
  scheduleBackendPrefetch()
  void nextTick(() => {
    updateStageScale()
    schedulePrototypeBinding()
  })
}

onMounted(() => {
  updateStageScale()

  const container = containerRef.value
  if (container && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateStageScale())
    resizeObserver.observe(container)
  }

  window.addEventListener('resize', updateStageScale)
})

onBeforeUnmount(() => {
  const idleWindow = window as IdleCapableWindow
  cleanupPrototypeBindings?.()
  cleanupPrototypeBindings = undefined
  resizeObserver?.disconnect()
  resizeObserver = undefined
  window.clearTimeout(bindRetryTimer)
  window.clearTimeout(backendPrefetchTimer)
  if (backendPrefetchIdleId !== undefined) {
    idleWindow.cancelIdleCallback?.(backendPrefetchIdleId)
    backendPrefetchIdleId = undefined
  }
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
          @load="onFrameLoad"
        ></iframe>
      </div>
    </div>

    <div v-if="!frameLoaded" class="lad-data-screen__loading">
      <span class="lad-data-screen__loading-ring"></span>
      <p>数据大屏加载中...</p>
    </div>
  </section>
</template>

<style scoped>
.lad-data-screen {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #f0f2f5;
}

.lad-data-screen__viewport {
  position: relative;
  flex-shrink: 0;
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
  background: #f0f2f5;
}

.lad-data-screen__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  color: #606266;
  background: rgba(240, 242, 245, 0.92);
}

.lad-data-screen__loading p {
  margin: 0;
  font-size: 14px;
}

.lad-data-screen__loading-ring {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(0, 0, 0, 0.08);
  border-top-color: #02a7f0;
  border-radius: 50%;
  animation: lad-data-screen-spin 0.8s linear infinite;
}

@keyframes lad-data-screen-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
