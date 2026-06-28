<script lang="tsx">
import { ElBreadcrumb, ElBreadcrumbItem, ElIcon } from 'element-plus'
import { ref, watch, computed, unref, defineComponent, TransitionGroup, h } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import { resolveBreadcrumbTrail, getBreadcrumbLinkPath } from './helper'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useI18n } from '@/hooks/web/useI18n'
import { resolveMenuIcon } from '@/components/Menu/src/menuIconMap'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('breadcrumb')

const appStore = useAppStore()

// 面包屑图标
const breadcrumbIcon = computed(() => appStore.getBreadcrumbIcon)

export default defineComponent({
  name: 'Breadcrumb',
  setup() {
    const { currentRoute } = useRouter()

    const { t } = useI18n()

    const levelList = ref<AppRouteRecordRaw[]>([])

    const permissionStore = usePermissionStore()

    const getBreadcrumb = () => {
      try {
        levelList.value = resolveBreadcrumbTrail(
          currentRoute.value,
          permissionStore.getRouters || []
        )
      } catch (error) {
        console.error('[Breadcrumb] resolve failed:', error)
        levelList.value = []
      }
    }

    const renderBreadcrumb = () => {
      const breadcrumbList = unref(levelList)
      return breadcrumbList.map((v, index) => {
        const meta = v.meta
        const linkPath = getBreadcrumbLinkPath(v, index, breadcrumbList.length)
        return (
          <ElBreadcrumbItem to={{ path: linkPath }} key={`${String(v.name || v.path)}-${index}`}>
            {meta?.icon && breadcrumbIcon.value ? (
              <>
                {h(
                  ElIcon,
                  { class: 'mr-[5px]', size: 16 },
                  { default: () => h(resolveMenuIcon(meta.icon as string)) }
                )}{' '}
                {t(v?.meta?.title || '')}
              </>
            ) : (
              t(v?.meta?.title || '')
            )}
          </ElBreadcrumbItem>
        )
      })
    }

    watch(
      () => currentRoute.value,
      (route: RouteLocationNormalizedLoaded) => {
        if (route.path.startsWith('/redirect/')) {
          return
        }
        getBreadcrumb()
      },
      {
        immediate: true
      }
    )

    return () => (
      <ElBreadcrumb separator="/" class={`${prefixCls} flex items-center h-full ml-[10px]`}>
        <TransitionGroup appear enter-active-class="animate__animated animate__fadeInRight">
          {renderBreadcrumb()}
        </TransitionGroup>
      </ElBreadcrumb>
    )
  }
})
</script>

<style lang="less" scoped>
@prefix-cls: ~'@{elNamespace}-breadcrumb';

.@{prefix-cls} {
  :deep(&__item) {
    display: flex;
    .@{prefix-cls}__inner {
      display: flex;
      align-items: center;
      color: var(--top-header-text-color);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(&__item):not(:last-child) {
    .@{prefix-cls}__inner {
      color: var(--top-header-text-color);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(&__item):last-child {
    .@{prefix-cls}__inner {
      color: var(--el-text-color-placeholder);

      &:hover {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
