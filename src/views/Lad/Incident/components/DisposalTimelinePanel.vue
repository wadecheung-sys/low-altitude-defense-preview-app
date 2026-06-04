<script setup lang="ts">
import type { DisposalTimelineNode } from '@/api/lad/incident/types'
import { ElTag, ElTimeline, ElTimelineItem } from 'element-plus'

defineProps<{
  nodes: DisposalTimelineNode[]
}>()

function itemType(status: DisposalTimelineNode['status']) {
  if (status === 'done') return 'success' as const
  if (status === 'current') return 'primary' as const
  if (status === 'pending') return 'info' as const
  return 'info' as const
}

function itemHollow(status: DisposalTimelineNode['status']) {
  return status === 'pending' || status === 'skipped'
}

function statusLabel(status: DisposalTimelineNode['status']) {
  if (status === 'done') return '已完成'
  if (status === 'current') return '进行中'
  if (status === 'pending') return '待发生'
  return '已跳过'
}
</script>

<template>
  <ElTimeline class="disposal-timeline">
    <ElTimelineItem
      v-for="node in nodes"
      :key="node.key"
      :timestamp="node.time"
      :type="itemType(node.status)"
      :hollow="itemHollow(node.status)"
      placement="top"
    >
      <div class="disposal-timeline__card">
        <div class="disposal-timeline__head">
          <span class="disposal-timeline__title">{{ node.title }}</span>
          <ElTag size="small" :type="itemType(node.status)" effect="light">
            {{ statusLabel(node.status) }}
          </ElTag>
        </div>
        <p class="disposal-timeline__summary">{{ node.summary }}</p>
        <p v-if="node.detail" class="disposal-timeline__detail">{{ node.detail }}</p>
        <div v-if="node.tags?.length" class="disposal-timeline__tags">
          <ElTag v-for="tag in node.tags" :key="tag" size="small" type="info" effect="plain">
            {{ tag }}
          </ElTag>
        </div>
      </div>
    </ElTimelineItem>
  </ElTimeline>
</template>

<style scoped lang="less">
.disposal-timeline {
  padding: 4px 0 0 2px;

  &__card {
    padding-bottom: 4px;
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 6px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__summary {
    margin: 0 0 4px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
  }

  &__detail {
    margin: 0 0 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}
</style>
