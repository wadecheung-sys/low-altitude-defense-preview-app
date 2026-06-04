<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { getIntegrationListApi, probeIntegrationApi, reconnectIntegrationApi } from '@/api/lad/integration'
import type { IntegrationEndpoint, IntegrationRunStatus } from '@/api/lad/integration/types'
import IntegrationDetailDialog from './components/IntegrationDetailDialog.vue'
import { UI, runStatusLabel, runStatusOptions, runStatusTagType } from './integrationConstants'
import { reactive, ref, unref } from 'vue'
import { ElMessage, ElTag } from 'element-plus'

defineOptions({ name: 'LadSystemIntegration' })

const searchParams = ref<Recordable>({})
const detailVisible = ref(false)
const detailId = ref<string>()
const probingAll = ref(false)
const reconnectingId = ref<string | null>(null)

function canReconnect(status: IntegrationRunStatus) {
  return status === 'stopped' || status === 'error' || status === 'unknown'
}

const setSearchParams = (params: Recordable) => {
  const range = params.dataUpdatedAtRange as string[] | undefined
  searchParams.value = {
    linkCode: params.linkCode,
    description: params.description,
    runStatus: params.runStatus,
    dataUpdatedAtStart: range?.[0],
    dataUpdatedAtEnd: range?.[1]
  }
  currentPage.value = 1
  getList()
}

const openDetail = (row: IntegrationEndpoint) => {
  detailId.value = row.id
  detailVisible.value = true
}

async function onReconnect(row: IntegrationEndpoint) {
  reconnectingId.value = row.id
  try {
    const res = await reconnectIntegrationApi({ id: row.id })
    if (res.data.success) {
      ElMessage.success(res.data.message)
    } else {
      ElMessage.error(res.data.message)
    }
    getList()
  } finally {
    reconnectingId.value = null
  }
}

async function probeAll() {
  probingAll.value = true
  try {
    const res = await probeIntegrationApi({})
    const failed = res.data.filter((r) => !r.success).length
    ElMessage.success(failed > 0 ? UI.probeAllPartial : UI.probeAllDone)
    getList()
  } finally {
    probingAll.value = false
  }
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getIntegrationListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'index',
    label: UI.colIndex,
    type: 'index',
    search: { hidden: true }
  },
  {
    field: 'linkCode',
    label: UI.colLinkCode,
    search: {
      component: 'Input',
      componentProps: { placeholder: UI.placeholderLinkCode, clearable: true }
    },
    table: { minWidth: 140, showOverflowTooltip: true }
  },
  {
    field: 'description',
    label: UI.colDescription,
    search: {
      component: 'Input',
      componentProps: { placeholder: UI.placeholderDescription, clearable: true }
    },
    table: { minWidth: 220, showOverflowTooltip: true }
  },
  {
    field: 'runStatus',
    label: UI.colRunStatus,
    search: {
      component: 'Select',
      componentProps: { options: runStatusOptions, clearable: true }
    },
    table: {
      width: 110,
      slots: {
        default: (data: { row: IntegrationEndpoint }) => (
          <ElTag type={runStatusTagType[data.row.runStatus]} effect="light" round>
            {runStatusLabel[data.row.runStatus]}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'dataUpdatedAtRange',
    label: UI.searchTimeRange,
    search: {
      component: 'DatePicker',
      componentProps: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: '\u5f00\u59cb\u65e5\u671f',
        endPlaceholder: '\u7ed3\u675f\u65e5\u671f'
      }
    },
    table: { hidden: true }
  },
  {
    field: 'heartbeatText',
    label: UI.colHeartbeat,
    search: { hidden: true },
    table: { width: 150, showOverflowTooltip: true }
  },
  {
    field: 'dataUpdatedAt',
    label: UI.colDataUpdatedAt,
    search: { hidden: true },
    table: { width: 180 }
  },
  {
    field: 'action',
    label: UI.colAction,
    search: { hidden: true },
    table: {
      width: 180,
      fixed: 'right',
      slots: {
        default: (data: { row: IntegrationEndpoint }) => (
          <>
            <BaseButton type="primary" onClick={() => openDetail(data.row)}>
              {UI.btnView}
            </BaseButton>
            {canReconnect(data.row.runStatus) ? (
              <BaseButton
                type="primary"
                class="ml-8px"
                loading={reconnectingId.value === data.row.id}
                onClick={() => onReconnect(data.row)}
              >
                {UI.btnReconnect}
              </BaseButton>
            ) : null}
          </>
        )
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)
</script>

<template>
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
    <div class="mb-10px">
      <BaseButton type="primary" :loading="probingAll" @click="probeAll">{{ UI.btnProbeAll }}</BaseButton>
    </div>
    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      @register="tableRegister"
    />
    <IntegrationDetailDialog
      v-model="detailVisible"
      :endpoint-id="detailId"
      @probed="getList"
    />
  </ContentWrap>
</template>
