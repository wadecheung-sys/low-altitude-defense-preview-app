<script setup lang="ts">
import type { AreaSiteTreeNode } from '@/api/lad/area/types'
import { regionTypeLabel } from '../areaConstants'

defineOptions({ name: 'SiteArchitectureTree' })

withDefaults(
  defineProps<{
    nodes: AreaSiteTreeNode[]
    level?: number
  }>(),
  { level: 1 }
)
</script>

<template>
  <ul class="site-architecture-tree">
    <li v-for="node in nodes" :key="node.id">
      <div class="site-node-card">
        <div class="site-node-card__head">{{ level }}级场地</div>
        <div class="site-node-card__body">
          <strong>{{ node.label }}</strong>
          <span>{{ node.siteCode }} · {{ regionTypeLabel(node.regionType) }}</span>
        </div>
      </div>
      <SiteArchitectureTree v-if="node.children.length" :nodes="node.children" :level="level + 1" />
    </li>
  </ul>
</template>

<style scoped lang="less">
.site-architecture-tree {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 28px 0 0;
  list-style: none;
}

.site-architecture-tree .site-architecture-tree::before {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 28px;
  border-left: 2px solid #56a6cf;
  content: '';
}

li {
  position: relative;
  padding: 28px 14px 0;
  text-align: center;
}

li::before,
li::after {
  position: absolute;
  top: 0;
  right: 50%;
  width: 50%;
  height: 28px;
  border-top: 2px solid #56a6cf;
  content: '';
}

li::after {
  right: auto;
  left: 50%;
  border-left: 2px solid #56a6cf;
}

li:only-child::before,
li:only-child::after {
  display: none;
}

li:only-child {
  padding-top: 0;
}

li:first-child::before,
li:last-child::after {
  border: 0 none;
}

li:last-child::before {
  border-right: 2px solid #56a6cf;
  border-radius: 0 8px 0 0;
}

li:first-child::after {
  border-radius: 8px 0 0;
}

.site-node-card {
  display: inline-flex;
  width: 190px;
  overflow: hidden;
  border: 1px solid #cfe4ee;
  border-radius: 4px;
  background: #f3fbf8;
  box-shadow: 0 8px 20px rgb(31 83 102 / 8%);
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
  flex-direction: column;
}

.site-node-card:hover {
  box-shadow: 0 12px 26px rgb(31 83 102 / 16%);
  transform: translateY(-2px);
}

.site-node-card__head {
  padding: 7px 12px;
  background: #178f60;
  color: #fff;
  font-size: 13px;
}

.site-node-card__body {
  display: flex;
  min-height: 72px;
  padding: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
}

.site-node-card__body strong {
  color: var(--el-text-color-primary);
  font-size: 15px;
}

.site-node-card__body span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
