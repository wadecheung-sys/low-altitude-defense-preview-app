<script setup lang="ts">
import { ElDialog, ElScrollbar } from 'element-plus'
import { propTypes } from '@/utils/propTypes'
import { computed, useAttrs, ref, unref, useSlots, watch, nextTick } from 'vue'
import { isNumber } from '@/utils/is'

const slots = useSlots()

const props = defineProps({
  modelValue: propTypes.bool.def(false),
  title: propTypes.string.def('Dialog'),
  fullscreen: propTypes.bool.def(true),
  maxHeight: propTypes.oneOfType([String, Number]).def('400px')
})

const hasFooter = computed(() => !!slots.footer)

const getBindValue = computed(() => {
  const delArr: string[] = ['fullscreen', 'title', 'maxHeight']
  const attrs = useAttrs()
  const obj = { ...attrs, ...props }
  for (const key in obj) {
    if (delArr.indexOf(key) !== -1) {
      delete obj[key]
    }
  }
  return obj
})

const isFullscreen = ref(false)

const toggleFull = () => {
  isFullscreen.value = !unref(isFullscreen)
}

const dialogMaxHeight = ref('400px')

/** 视口内滚动区上限（扣除标题、底部按钮、内外边距） */
function buildViewportCap(withFooter: boolean) {
  const footer = withFooter ? 63 : 0
  // 48 视口留白 + 54 标题 + 30 body 内边距 + 32 dialog 内边距 + footer + 2 边框
  return `calc(100vh - ${48 + 54 + 30 + 32 + footer + 2}px)`
}

function resolveMaxHeight(raw: string | number, withFooter: boolean) {
  const cap = buildViewportCap(withFooter)
  const rawStr = isNumber(raw) ? `${raw}px` : String(raw)

  if (!rawStr || rawStr === 'auto') {
    return cap
  }

  return `min(${rawStr}, ${cap})`
}

function syncDialogMaxHeight() {
  if (isFullscreen.value) {
    const windowHeight = document.documentElement.offsetHeight
    dialogMaxHeight.value = `${windowHeight - 55 - 60 - (hasFooter.value ? 63 : 0)}px`
    return
  }
  dialogMaxHeight.value = resolveMaxHeight(props.maxHeight, hasFooter.value)
}

watch(
  () => [isFullscreen.value, hasFooter.value] as const,
  async () => {
    await nextTick()
    syncDialogMaxHeight()
  },
  { immediate: true }
)

watch(
  () => props.maxHeight,
  () => {
    syncDialogMaxHeight()
  }
)
</script>

<template>
  <ElDialog
    v-bind="getBindValue"
    :fullscreen="isFullscreen"
    destroy-on-close
    lock-scroll
    draggable
    top="0"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header="{ close }">
      <div class="flex justify-between items-center h-54px pl-15px pr-15px relative">
        <slot name="title">
          {{ title }}
        </slot>
        <div
          class="h-54px flex justify-between items-center absolute top-[50%] right-15px translate-y-[-50%]"
        >
          <Icon
            v-if="fullscreen"
            class="cursor-pointer is-hover !h-54px mr-10px"
            :icon="isFullscreen ? 'vi-zmdi:fullscreen-exit' : 'vi-zmdi:fullscreen'"
            color="var(--el-color-info)"
            hover-color="var(--el-color-primary)"
            @click="toggleFull"
          />
          <Icon
            class="cursor-pointer is-hover !h-54px"
            icon="vi-ep:close"
            hover-color="var(--el-color-primary)"
            color="var(--el-color-info)"
            @click="close"
          />
        </div>
      </div>
    </template>

    <!-- 使用 max-height prop（非 style height），内容少时不撑满，超出时可滚动 -->
    <ElScrollbar :max-height="dialogMaxHeight">
      <div class="app-dialog__scroll-content">
        <slot></slot>
      </div>
    </ElScrollbar>

    <template v-if="hasFooter" #footer>
      <slot name="footer"></slot>
    </template>
  </ElDialog>
</template>

<style lang="less">
.@{elNamespace}-overlay-dialog {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
  box-sizing: border-box;
}

.@{elNamespace}-dialog {
  margin: 0 !important;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    height: 54px;
    padding: 0;
    margin-right: 0 !important;
    border-bottom: 1px solid var(--el-border-color);
    flex-shrink: 0;
  }

  &__body {
    padding: 15px !important;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__footer {
    border-top: 1px solid var(--el-border-color);
    flex-shrink: 0;
  }

  &__headerbtn {
    top: 0;
  }
}

.app-dialog__scroll-content {
  padding-bottom: 12px;
}
</style>
