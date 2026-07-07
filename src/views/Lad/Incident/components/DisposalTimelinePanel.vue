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
      :key="node.nodeId"
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
        <template v-if="node.summaries?.length">
          <p
            v-for="(line, index) in node.summaries"
            :key="`${node.nodeId}-summary-${index}`"
            class="disposal-timeline__summary"
          >
            {{ line }}
          </p>
        </template>
        <p v-else class="disposal-timeline__summary">{{ node.summary }}</p>
        <details
          v-if="
            node.key !== 'result' &&
            (node.detailGroups?.length || node.details?.length)
          "
          class="disposal-timeline__details"
        >
          <summary>阶段详情</summary>
          <div v-if="node.detailGroups?.length" class="disposal-timeline__detail-cards">
            <div
              v-for="(group, groupIndex) in node.detailGroups"
              :key="`${node.nodeId}-detail-group-${groupIndex}`"
              class="disposal-timeline__detail-card"
            >
              <div v-if="group.title" class="disposal-timeline__detail-card-title">
                {{ group.title }}
              </div>
              <dl class="disposal-timeline__detail-list">
                <div
                  v-for="item in group.items"
                  :key="`${node.nodeId}-detail-${groupIndex}-${item.label}`"
                  class="disposal-timeline__detail-item"
                >
                  <dt>{{ item.label }}</dt>
                  <dd>{{ item.value || '--' }}</dd>
                </div>
              </dl>
            </div>
          </div>
          <dl v-else class="disposal-timeline__detail-list">
            <div
              v-for="item in node.details"
              :key="`${node.nodeId}-detail-${item.label}`"
              class="disposal-timeline__detail-item"
            >
              <dt>{{ item.label }}</dt>
              <dd>{{ item.value || '--' }}</dd>
            </div>
          </dl>
        </details>
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
    margin: 0 0 6px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-regular);

    &:last-of-type {
      margin-bottom: 8px;
    }
  }

  &__details {
    max-width: 560px;
    padding: 8px 10px;
    margin: 8px 0;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;

    summary {
      width: fit-content;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }

  &__detail-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  &__detail-card {
    padding: 8px 10px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
  }

  &__detail-card-title {
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__detail-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
  }

  &__detail-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-width: 0;
    margin: 0;

    dt {
      flex: 0 0 72px;
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
}
</style>
