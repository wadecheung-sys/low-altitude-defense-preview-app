import type { RouteMeta } from 'vue-router'
import { h } from 'vue'
import { ElIcon } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { resolveMenuIcon } from '../menuIconMap'

export const useRenderMenuTitle = () => {
  const renderMenuTitle = (meta: RouteMeta) => {
    const { t } = useI18n()
    const { title = 'Please set title', icon } = meta
    const IconComponent = icon ? resolveMenuIcon(icon as string) : null

    return (
      <>
        {IconComponent
          ? h(ElIcon, { class: 'v-menu__icon', size: 16 }, { default: () => h(IconComponent) })
          : null}
        <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
          {t(title as string)}
        </span>
      </>
    )
  }

  return {
    renderMenuTitle
  }
}
