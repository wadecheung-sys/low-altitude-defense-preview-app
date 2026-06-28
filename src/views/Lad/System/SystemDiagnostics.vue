<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { ElMessage, ElProgress, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { ref } from 'vue'

defineOptions({ name: 'LadSystemDiagnostics' })

interface DiagItem {
  module: string
  status: 'ok' | 'warn' | 'error'
  message: string
  checkedAt: string
}

const checking = ref(false)
const items = ref<DiagItem[]>([
  { module: '数据库连接', status: 'ok', message: '连接池正常', checkedAt: '2026-05-20 14:00:00' },
  {
    module: '消息队列',
    status: 'ok',
    message: '消费延迟 < 50ms',
    checkedAt: '2026-05-20 14:00:00'
  },
  {
    module: '雷达接入网关',
    status: 'ok',
    message: '3/3 节点在线',
    checkedAt: '2026-05-20 14:00:01'
  },
  {
    module: '无线电侦测',
    status: 'warn',
    message: '1 路心跳超时',
    checkedAt: '2026-05-20 14:00:01'
  },
  {
    module: '反制指令通道',
    status: 'ok',
    message: 'TCP 通道可用',
    checkedAt: '2026-05-20 14:00:02'
  },
  {
    module: '光电流媒体',
    status: 'ok',
    message: 'RTSP 转码正常',
    checkedAt: '2026-05-20 14:00:02'
  },
  { module: '授时同步', status: 'ok', message: 'NTP 偏差 8ms', checkedAt: '2026-05-20 14:00:03' },
  {
    module: '磁盘空间',
    status: 'warn',
    message: '数据分区使用率 78%',
    checkedAt: '2026-05-20 14:00:03'
  }
])

const healthPercent = ref(92)

function statusTag(s: DiagItem['status']) {
  if (s === 'ok') return 'success'
  if (s === 'warn') return 'warning'
  return 'danger'
}

function statusLabel(s: DiagItem['status']) {
  if (s === 'ok') return '正常'
  if (s === 'warn') return '告警'
  return '异常'
}

async function runCheck() {
  checking.value = true
  await new Promise((r) => setTimeout(r, 800))
  healthPercent.value = 94
  items.value = items.value.map((row) => ({
    ...row,
    checkedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    status: row.module === '无线电侦测' ? 'warn' : row.status
  }))
  checking.value = false
  ElMessage.success('系统自诊断完成，请查看各子系统检测结果')
}
</script>

<template>
  <ContentWrap title="系统自诊断">
    <div class="system-diagnostics__head">
      <div>
        <p class="system-diagnostics__hint"> 一键检测各子系统与服务健康状态。 </p>
        <ElProgress :percentage="healthPercent" :stroke-width="14" />
      </div>
      <BaseButton type="primary" :loading="checking" @click="runCheck">立即诊断</BaseButton>
    </div>
    <ElTable :data="items" border stripe>
      <ElTableColumn type="index" label="序号" width="65" align="center" />
      <ElTableColumn prop="module" label="检测项" min-width="160" />
      <ElTableColumn label="状态" width="100">
        <template #default="{ row }">
          <ElTag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="message" label="说明" min-width="220" show-overflow-tooltip />
      <ElTableColumn prop="checkedAt" label="检测时间" width="180" />
    </ElTable>
  </ContentWrap>
</template>

<style scoped lang="less">
.system-diagnostics__head {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.system-diagnostics__hint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
