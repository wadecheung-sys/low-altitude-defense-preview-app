const PROTOTYPE_ROOT_ID = 'base'
const AXURE_PLAYER_FRAME_ID = 'mainFrame'

/** 解析数据大屏 iframe 内的 Axure 页面文档（兼容 index.html 外壳与直链页面） */
export function resolvePrototypeDocument(iframe: HTMLIFrameElement | undefined): Document | null {
  const shellDoc = iframe?.contentDocument ?? null
  if (!shellDoc) return null

  if (shellDoc.getElementById(PROTOTYPE_ROOT_ID)) return shellDoc

  const mainFrame = shellDoc.getElementById(AXURE_PLAYER_FRAME_ID) as HTMLIFrameElement | null
  const pageDoc = mainFrame?.contentDocument ?? null
  if (pageDoc?.getElementById(PROTOTYPE_ROOT_ID)) return pageDoc

  return null
}

export function isPrototypeDocumentReady(iframe: HTMLIFrameElement | undefined): boolean {
  return Boolean(resolvePrototypeDocument(iframe)?.getElementById(PROTOTYPE_ROOT_ID))
}

/** 监听 Axure 播放器外壳与 mainFrame 加载完成 */
export function observePrototypeDocument(
  iframe: HTMLIFrameElement | undefined,
  onReady: () => void
): () => void {
  let disposed = false
  const cleanups: Array<() => void> = []

  const notifyIfReady = () => {
    if (!disposed && isPrototypeDocumentReady(iframe)) onReady()
  }

  const attachMainFrameListener = () => {
    const shellDoc = iframe?.contentDocument
    if (!shellDoc || shellDoc.getElementById(PROTOTYPE_ROOT_ID)) return

    const mainFrame = shellDoc.getElementById(AXURE_PLAYER_FRAME_ID) as HTMLIFrameElement | null
    if (!mainFrame) return

    const onMainFrameLoad = () => notifyIfReady()
    mainFrame.addEventListener('load', onMainFrameLoad)
    cleanups.push(() => mainFrame.removeEventListener('load', onMainFrameLoad))
  }

  const onOuterLoad = () => {
    attachMainFrameListener()
    notifyIfReady()
  }

  if (iframe) {
    iframe.addEventListener('load', onOuterLoad)
    cleanups.push(() => iframe.removeEventListener('load', onOuterLoad))
  }

  attachMainFrameListener()
  notifyIfReady()

  return () => {
    disposed = true
    cleanups.forEach((cleanup) => cleanup())
  }
}
