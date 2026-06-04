<script setup lang="tsx">
import { deleteAreaRegionApi, getAreaRegionListApi } from '@/api/lad/area'
import type { AreaRegion } from '@/api/lad/area/types'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import {
  AREA_REGION_TYPE_META,
  AREA_REGION_TYPE_OPTIONS,
  AREA_SEARCH_COL,
  regionTypeLabel
} from './areaConstants'
import { ElLink, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { reactive, ref, unref } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'LadAreaList' })

const { push } = useRouter()
const ids = ref<string[]>([])
const searchParams = ref<Recordable>({})

const alarmOptions = [
  { label: '全部', value: '' },
  { label: '是', value: 'true' },
  { label: '否', value: 'false' }
]

const setSearchParams = (params: Recordable) => {
  searchParams.value = {
    name: params.name,
    regionType: params.regionType || undefined,
    alarmEnabled:
      params.alarmEnabled === '' || params.alarmEnabled === undefined
        ? undefined
        : params.alarmEnabled
  }
  currentPage.value = 1
  getList()
}

const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getAreaRegionListApi({
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    })
    return { list: res.data.list, total: res.data.total }
  },
  fetchDelApi: async () => {
    for (const id of unref(ids)) {
      await deleteAreaRegionApi(id)
    }
    return true
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList, delList } = tableMethods
const delLoading = ref(false)

function onSelectionChange(rows: AreaRegion[]) {
  ids.value = rows.map((r) => r.id)
}

function openCreate() {
  push('/lad/area/add')
}

function openEdit(row: AreaRegion) {
  push(`/lad/area/edit/${row.id}`)
}

async function delData(row: AreaRegion | null) {
  if (row) {
    try {
      await ElMessageBox.confirm(`确认删除区域「${row.name}」吗？`, '删除确认', {
        type: 'warning'
      })
    } catch {
      return
    }
    await deleteAreaRegionApi(row.id)
    ids.value = ids.value.filter((id) => id !== row.id)
    ElMessage.success('删除成功')
    getList()
    return
  }
  if (!ids.value.length) {
    ElMessage.warning('请先勾选需要删除的区域')
    return
  }
  delLoading.value = true
  await delList(unref(ids).length).finally(() => {
    delLoading.value = false
    ids.value = []
  })
}

const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'selection',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: { type: 'selection' }
  },
  {
    field: 'index',
    label: '序号',
    type: 'index',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'name',
    label: '区域名称',
    minWidth: 140,
    search: {
      component: 'Input',
      colProps: AREA_SEARCH_COL,
      componentProps: {
        placeholder: '请输入区域名称',
        clearable: true,
        style: { width: '100%' }
      }
    },
    table: {
      showOverflowTooltip: true,
      slots: {
        default: ({ row }: { row: AreaRegion }) => (
          <ElLink type="primary" underline={false} onClick={() => openEdit(row)}>
            {row.name}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'regionType',
    label: '区域类型',
    minWidth: 120,
    search: {
      component: 'Select',
      colProps: AREA_SEARCH_COL,
      componentProps: {
        options: [{ label: '全部', value: '' }, ...AREA_REGION_TYPE_OPTIONS],
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: AreaRegion }) => (
          <ElTag
            type={AREA_REGION_TYPE_META[row.regionType].tagType || 'info'}
            size="small"
            effect="light"
          >
            {regionTypeLabel(row.regionType)}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'clipPriority',
    label: '区域优先级',
    minWidth: 100,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: AreaRegion }) => <span>P{row.clipPriority}</span>
      }
    }
  },
  {
    field: 'color',
    label: '区域颜色',
    minWidth: 100,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: AreaRegion }) => (
          <span class="area-list-color">
            <i class="area-list-color__swatch" style={{ background: row.color }} />
          </span>
        )
      }
    }
  },
  {
    field: 'alarmEnabled',
    label: '参与告警',
    minWidth: 96,
    search: {
      component: 'Select',
      colProps: AREA_SEARCH_COL,
      componentProps: {
        options: alarmOptions,
        clearable: true,
        placeholder: '全部',
        style: { width: '100%' }
      }
    },
    table: {
      slots: {
        default: ({ row }: { row: AreaRegion }) => (
          <ElTag type={row.alarmEnabled ? 'success' : 'info'} size="small" effect="light">
            {row.alarmEnabled ? '是' : '否'}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'shapeCount',
    label: '范围图形',
    minWidth: 96,
    search: { hidden: true },
    table: {
      slots: {
        default: ({ row }: { row: AreaRegion }) => `${row.shapes.length} 个`
      }
    }
  },
  {
    field: 'updatedAt',
    label: '更新时间',
    minWidth: 168,
    search: { hidden: true },
    table: { showOverflowTooltip: true }
  },
  {
    field: 'action',
    label: '操作',
    width: '200px',
    fixed: 'right',
    search: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true },
    table: {
      slots: {
        default: (data: { row: AreaRegion }) => (
          <>
            <BaseButton type="primary" onClick={() => openEdit(data.row)}>
              编辑
            </BaseButton>
            <BaseButton type="danger" onClick={() => delData(data.row)}>
              删除
            </BaseButton>
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
    <Search
      :schema="allSchemas.searchSchema"
      is-col
      label-width="100px"
      :expand-rows="2"
      :expand-default="false"
      @search="setSearchParams"
      @reset="setSearchParams"
    />

    <div class="mb-10px">
      <BaseButton type="primary" @click="openCreate">新增区域</BaseButton>
      <BaseButton type="danger" :loading="delLoading" @click="delData(null)">批量删除</BaseButton>
    </div>

    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :columns="allSchemas.tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="{ total }"
      :scrollbar-always-on="true"
      @register="tableRegister"
      @selection-change="onSelectionChange"
    />
  </ContentWrap>
</template>

<style scoped lang="less">
.area-list-color {
  display: inline-flex;
  align-items: center;
}

.area-list-color__swatch {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
</style>
