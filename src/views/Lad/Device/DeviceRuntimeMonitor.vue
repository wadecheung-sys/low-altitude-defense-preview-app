<script setup lang="ts">
import { getDeviceMonitorListApi } from '@/api/lad/device-monitor'
import type { DeviceMonitorItem } from '@/api/lad/device-monitor/types'
import DeviceMonitorCard from './components/DeviceMonitorCard.vue'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  DEVICE_MONITOR_SEARCH_COL,
  deviceMonitorTypeOptions,
  onlineStatusOptions
} from './deviceMonitorConstants'
import { reactive, ref, unref } from 'vue'
import { useRouter } from 'vue-router'
import { ElEmpty, ElPagination } from 'element-plus'

defineOptions({ name: 'LadDeviceRuntimeMonitor' })

const { push } = useRouter()

const loading = ref(false)
const dataList = ref<DeviceMonitorItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const searchParams = ref<Recordable>({})

const searchFieldStyle = { width: '100%' }

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    deviceName: params.deviceName,
    deviceType: params.deviceType || undefined,
    deployLocation: params.deployLocation,
    onlineStatus: params.onlineStatus || undefined
  }
  currentPage.value = 1
  getList()
}

async function getList() {
  loading.value = true
  try {
    const res = await getDeviceMonitorListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    dataList.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function goDetail(row: DeviceMonitorItem) {
  push(`/lad/device/monitor/detail/${row.id}`)
}

getList()

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'deviceName',
    label: '设备名称',
    search: {
      component: 'Input',
      colProps: DEVICE_MONITOR_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入设备名称',
        style: searchFieldStyle
      }
    }
  },
  {
    field: 'deviceType',
    label: '设备类型',
    search: {
      component: 'Select',
      colProps: DEVICE_MONITOR_SEARCH_COL,
      componentProps: {
        options: [{ label: '全部', value: '' }, ...deviceMonitorTypeOptions],
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    }
  },
  {
    field: 'deployLocation',
    label: '部署位置',
    search: {
      component: 'Input',
      colProps: DEVICE_MONITOR_SEARCH_COL,
      componentProps: {
        clearable: true,
        placeholder: '请输入部署位置',
        style: searchFieldStyle
      }
    }
  },
  {
    field: 'onlineStatus',
    label: '运行状态',
    search: {
      component: 'Select',
      colProps: DEVICE_MONITOR_SEARCH_COL,
      componentProps: {
        options: onlineStatusOptions,
        clearable: true,
        placeholder: '全部',
        style: searchFieldStyle
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)
</script>

<template>
  <ContentWrap>
    <Search
      :schema="allSchemas.searchSchema"
      is-col
      label-width="100px"
      :expand-rows="2"
      :expand-default="false"
      @search="setSearchParams"
      @reset="setSearchParams"
    />

    <div v-loading="loading" class="device-monitor-list mb-10px">
      <div v-if="dataList.length" class="device-monitor-list__grid">
        <DeviceMonitorCard
          v-for="item in dataList"
          :key="item.id"
          :item="item"
          @detail="goDetail"
        />
      </div>
      <ElEmpty v-else-if="!loading" description="暂无设备数据" />
    </div>

    <ElPagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      class="device-monitor-list__pager"
      :total="total"
      :page-sizes="[12, 24, 36, 48]"
      layout="sizes, prev, pager, next, jumper, ->, total"
      @current-change="getList"
      @size-change="
        () => {
          currentPage = 1
          getList()
        }
      "
    />
  </ContentWrap>
</template>

<style scoped lang="less">
.device-monitor-list {
  min-height: 160px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 720px) {
      grid-template-columns: 1fr;
    }
  }

  &__pager {
    margin-top: 4px;
  }
}
</style>
