<script setup lang="ts">
import { ref, watch, computed, onMounted, unref } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('logo')

const appStore = useAppStore()

const show = ref(true)

/** 侧栏 Logo 展示用标题；浏览器标题仍用 VITE_APP_TITLE */
const logoTitle = import.meta.env.VITE_APP_TITLE_SHORT || '低空防御指挥控制平台'
const logoTitleLines = computed(() => [
  '低空防御',
  logoTitle.replace('低空防御', '') || '指挥控制平台'
])

const layout = computed(() => appStore.getLayout)

const collapse = computed(() => appStore.getCollapse)

onMounted(() => {
  if (unref(collapse)) show.value = false
})

watch(
  () => collapse.value,
  (collapsed: boolean) => {
    if (unref(layout) === 'topLeft' || unref(layout) === 'cutMenu') {
      show.value = true
      return
    }
    show.value = !collapsed
  }
)

watch(
  () => layout.value,
  (currentLayout) => {
    if (currentLayout === 'top' || currentLayout === 'cutMenu') {
      show.value = true
    } else if (unref(collapse)) {
      show.value = false
    } else {
      show.value = true
    }
  }
)
</script>

<template>
  <div>
    <router-link
      :class="[
        prefixCls,
        layout !== 'classic' ? `${prefixCls}__Top` : '',
        'flex !h-[var(--logo-height)] items-center cursor-pointer pl-8px relative decoration-none overflow-hidden'
      ]"
      to="/"
    >
      <img
        src="@/assets/imgs/logo.png"
        class="w-[calc(var(--logo-height)-10px)] h-[calc(var(--logo-height)-10px)]"
      />
      <div
        v-if="show"
        :class="[
          'ml-8px min-w-0 max-w-145px text-16px font-700 leading-18px tracking-1px',
          {
            'text-[var(--logo-title-text-color)]': layout === 'classic',
            'text-[var(--top-header-text-color)]':
              layout === 'topLeft' || layout === 'top' || layout === 'cutMenu'
          }
        ]"
      >
        <span v-for="line in logoTitleLines" :key="line" class="block truncate whitespace-nowrap">
          {{ line }}
        </span>
      </div>
    </router-link>
  </div>
</template>
