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
  if (status === 'pending') return '未开始'
  return '未触发'
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
        <dl v-if="node.details?.length" class="disposal-timeline__details">
          <div
            v-for="item in node.details"
            :key="item.label"
            class="disposal-timeline__detail-item"
          >
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value || '--' }}</dd>
          </div>
        </dl>
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

  &__details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 14px;
    padding: 8px 10px;
    margin: 8px 0;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
  }

  &__detail-item {
    display: flex;
    gap: 6px;
    min-width: 0;
    margin: 0;

    dt {
      flex: 0 0 auto;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    dd {
      min-width: 0;
      margin: 0;
      overflow-wrap: anywhere;
      font-size: 12px;
      color: var(--el-text-color-primary);
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

@media (max-width: 768px) {
  .disposal-timeline {
    &__details {
      grid-template-columns: 1fr;
    }
  }
}
</style>
