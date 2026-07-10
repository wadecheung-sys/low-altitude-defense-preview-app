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
