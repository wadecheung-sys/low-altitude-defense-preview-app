import type { MessageDescriptionSegment } from './types'

function seg(text: string, highlight = false): MessageDescriptionSegment {
  return highlight ? { text, highlight: true } : { text }
}

const PLACEHOLDER_RE = /\{([^}]+)\}/g

/** 按事件属性消息模板渲染描述片段（占位符高亮） */
export function renderMessageDescriptionSegments(
  template: string,
  values: Record<string, string>
): MessageDescriptionSegment[] {
  const segments: MessageDescriptionSegment[] = []
  let lastIndex = 0

  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const [full, key] = match
    const index = match.index ?? 0
    if (index > lastIndex) {
      segments.push(seg(template.slice(lastIndex, index)))
    }
    segments.push(seg(values[key] ?? `{${key}}`, true))
    lastIndex = index + full.length
  }

  if (lastIndex < template.length) {
    segments.push(seg(template.slice(lastIndex)))
  }

  return segments
}

export function messageDescriptionText(segments: MessageDescriptionSegment[]): string {
  return segments.map((segment) => segment.text).join('')
}
