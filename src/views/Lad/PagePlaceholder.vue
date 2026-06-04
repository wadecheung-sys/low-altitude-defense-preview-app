<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ContentWrap } from '@/components/ContentWrap'
import { getLadPageMeta, LAD_DEFERRED_MODULES } from '@/router/ladRouteMeta'

const route = useRoute()

const pageTitle = computed(() => (route.meta?.title as string) || '页面')
const pageKey = computed(() => (route.meta?.pageKey as string) || String(route.name || route.path))
const meta = computed(() => getLadPageMeta(pageKey.value))

const pageTypeLabel = computed(() => {
  const map: Record<string, string> = {
    list: '列表页',
    detail: '详情页',
    form: '配置/表单页',
    hub: '综合枢纽页',
    map: '地图联动页'
  }
  return map[(route.meta?.pageType as string) || ''] || '—'
})

const deferredModules = [...LAD_DEFERRED_MODULES]
</script>

<template>
  <ContentWrap :title="pageTitle">
    <div class="lad-page-placeholder py-16px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="第一阶段 · 框架占位"
        description="菜单与路由已按需求清单与 raw 原型对齐；第二阶段将按 style-kernel 替换为真实页面。"
        class="mb-20px max-w-900px mx-auto"
      />

      <el-descriptions :column="1" border class="max-w-720px mx-auto text-left mb-24px">
        <el-descriptions-item label="页面标识">
          <code>{{ pageKey }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="需求模块">
          {{ route.meta?.reqModule || meta?.reqModule || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="页面形态">
          {{ pageTypeLabel }}
          <span v-if="route.meta?.pageType" class="text-[var(--el-text-color-secondary)]">
            （{{ route.meta.pageType }}）
          </span>
        </el-descriptions-item>
        <el-descriptions-item v-if="route.meta?.prototypeRef || meta?.prototypeRef" label="原型参考">
          {{ route.meta?.prototypeRef || meta?.prototypeRef }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="(route.meta?.styleKernel as string[])?.length || meta?.styleKernel?.length"
          label="style-kernel"
        >
          <el-tag
            v-for="doc in (route.meta?.styleKernel as string[]) || meta?.styleKernel || []"
            :key="doc"
            size="small"
            class="mr-6px mb-4px"
          >
            {{ doc }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="route.meta?.phaseNote || meta?.phaseNote" label="备注">
          {{ route.meta?.phaseNote || meta?.phaseNote }}
        </el-descriptions-item>
        <el-descriptions-item label="当前路径">
          <code>{{ route.fullPath }}</code>
        </el-descriptions-item>
      </el-descriptions>

      <el-collapse class="max-w-720px mx-auto">
        <el-collapse-item title="本阶段未纳入菜单的模块（预留）" name="deferred">
          <el-table :data="deferredModules" size="small" stripe>
            <el-table-column prop="reqModule" label="需求序号" width="88" />
            <el-table-column prop="title" label="模块" width="140" />
            <el-table-column prop="prototypeRef" label="原型" min-width="160" />
            <el-table-column prop="note" label="说明" min-width="200" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </ContentWrap>
</template>
