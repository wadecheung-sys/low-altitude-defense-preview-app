<script setup lang="tsx">
import { Form, FormSchema, FormSetProps } from '@/components/Form'
import { PropType, computed, unref, ref, watch, onMounted } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { useForm } from '@/hooks/web/useForm'
import { findIndex } from '@/utils'
import { cloneDeep, set } from 'lodash-es'
import { initModel } from '@/components/Form/src/helper'
import ActionButton from './components/ActionButton.vue'
import { SearchProps } from './types'
import { FormItemProp } from 'element-plus'
import { isObject, isEmptyVal } from '@/utils/is'

/** WEB 两行布局：首行 4 个筛选项（span=6），次行左侧续排、右侧查询/重置/展开 */
const ROW1_COUNT = 4
const DEFAULT_FIELD_SPAN = 6
const ACTION_SPAN = 9

const props = defineProps({
  schema: {
    type: Array as PropType<FormSchema[]>,
    default: () => []
  },
  isCol: propTypes.bool.def(false),
  labelWidth: propTypes.oneOfType([String, Number]).def('auto'),
  layout: propTypes.string.validate((v: string) => ['inline', 'bottom'].includes(v)).def('inline'),
  buttonPosition: propTypes.string
    .validate((v: string) => ['left', 'center', 'right'].includes(v))
    .def('center'),
  showSearch: propTypes.bool.def(true),
  showReset: propTypes.bool.def(true),
  showExpand: propTypes.bool.def(false),
  expandField: propTypes.string.def(''),
  expandRows: propTypes.number.def(0),
  expandDefault: propTypes.bool.def(true),
  inline: propTypes.bool.def(true),
  removeNoValueItem: propTypes.bool.def(true),
  model: {
    type: Object as PropType<Recordable>,
    default: () => ({})
  },
  searchLoading: propTypes.bool.def(false),
  resetLoading: propTypes.bool.def(false)
})

const emit = defineEmits(['search', 'reset', 'register', 'validate'])

const visible = ref(props.expandDefault)
const formModel = ref<Recordable>(props.model)

const getFieldSpan = (item: FormSchema) => Number(item.colProps?.span) || DEFAULT_FIELD_SPAN

const normalizeFieldCol = (item: FormSchema): FormSchema => {
  const span = getFieldSpan(item)
  return {
    ...item,
    hidden: false,
    colProps: { span, xs: 24, sm: 12, md: span, lg: span, xl: span }
  }
}

/** 收起时第二行左侧最多占用的栅格（为右侧操作钮预留 ACTION_SPAN） */
const getTwoRowCollapseCount = (schema: FormSchema[]) => {
  const row2Cap = 24 - ACTION_SPAN
  let count = Math.min(ROW1_COUNT, schema.length)
  let row2Used = 0
  for (let i = ROW1_COUNT; i < schema.length; i++) {
    const span = getFieldSpan(schema[i])
    if (row2Used + span > row2Cap) break
    row2Used += span
    count++
  }
  return count
}

const resolveCollapseIndex = (schema: FormSchema[], expandField: string, expandRows: number) => {
  if (expandRows === 2 && expandField === '') {
    return getTwoRowCollapseCount(schema)
  }
  if (expandField) {
    const index = findIndex(schema, (v: FormSchema) => v.field === expandField)
    return index >= 0 ? index : schema.length
  }
  if (expandRows > 0) {
    const maxSpan = expandRows * 24
    let used = 0
    for (let i = 0; i < schema.length; i++) {
      const span = getFieldSpan(schema[i])
      if (used + span > maxSpan) return i
      used += span
      if (used >= maxSpan) return i + 1
    }
  }
  return schema.length
}

const createActionField = (
  offset: number,
  propsComputed: Recordable,
  useExpand: boolean,
  canCollapse: boolean
): FormSchema => ({
  field: 'action',
  colProps: {
    span: ACTION_SPAN,
    offset,
    xs: 24,
    sm: 24,
    md: ACTION_SPAN,
    lg: ACTION_SPAN,
    xl: ACTION_SPAN
  } as FormSchema['colProps'],
  formItemProps: {
    labelWidth: '0px',
    style: { marginBottom: '18px' },
    slots: {
      default: () => (
        <div class="search-form__action-btns">
          <ActionButton
            showSearch={propsComputed.showSearch}
            showReset={propsComputed.showReset}
            showExpand={useExpand && canCollapse}
            searchLoading={propsComputed.searchLoading}
            resetLoading={propsComputed.resetLoading}
            visible={visible.value}
            onExpand={setVisible}
            onReset={reset}
            onSearch={search}
          />
        </div>
      ),
      label: () => <span>&nbsp;</span>
    }
  }
})

/** 两行 WEB 布局：查询/重置/展开 与末行筛选项同一行，不单独占一行 */
const buildTwoRowSearchSchema = (
  filters: FormSchema[],
  collapsed: boolean,
  collapseCount: number,
  propsComputed: Recordable,
  useExpand: boolean,
  canCollapse: boolean
): FormSchema[] => {
  const visibleFilters = collapsed ? filters.slice(0, collapseCount) : filters
  const out: FormSchema[] = []

  visibleFilters.slice(0, ROW1_COUNT).forEach((item) => {
    out.push(normalizeFieldCol(item))
  })

  const tailFilters = visibleFilters.slice(ROW1_COUNT)
  let rowUsed = 0
  const pending: FormSchema[] = []

  const flushRow = (withAction: boolean) => {
    pending.forEach((item) => {
      out.push(normalizeFieldCol(item))
      rowUsed += getFieldSpan(item)
    })
    pending.length = 0
    if (withAction) {
      const offset = Math.max(0, 24 - ACTION_SPAN - rowUsed)
      out.push(createActionField(offset, propsComputed, useExpand, canCollapse))
    }
    rowUsed = 0
  }

  tailFilters.forEach((item, index) => {
    const span = getFieldSpan(item)
    const isLast = index === tailFilters.length - 1

    if (rowUsed > 0 && rowUsed + span > 24) {
      flushRow(false)
    }

    pending.push(item)
    rowUsed += span

    if (!isLast) return

    if (rowUsed + ACTION_SPAN <= 24) {
      flushRow(true)
      return
    }

    const last = pending.pop()!
    rowUsed -= getFieldSpan(last)
    flushRow(false)
    pending.push(last)
    rowUsed = getFieldSpan(last)
    flushRow(true)
  })

  if (!tailFilters.length) {
    out.push(createActionField(Math.max(0, 24 - ACTION_SPAN), propsComputed, useExpand, canCollapse))
  }

  return out
}

const newSchema = computed(() => {
  const propsComputed = unref(getProps)
  const filters: FormSchema[] = cloneDeep(propsComputed.schema)
  const collapseIndex = resolveCollapseIndex(
    filters,
    propsComputed.expandField,
    propsComputed.expandRows
  )
  const canCollapse = collapseIndex < filters.length
  const useExpand =
    propsComputed.showExpand || (propsComputed.expandRows > 0 && canCollapse)
  const collapsed = useExpand && canCollapse && !unref(visible)
  const useTwoRowLayout = propsComputed.isCol && propsComputed.expandRows === 2

  if (propsComputed.layout !== 'inline') {
    return filters
  }

  if (useTwoRowLayout) {
    return buildTwoRowSearchSchema(
      filters,
      collapsed,
      collapseIndex,
      propsComputed,
      useExpand,
      canCollapse
    )
  }

  let schema = filters
  if (useExpand && canCollapse && collapsed) {
    schema = schema.map((v, i) => {
      v.hidden = i >= collapseIndex
      return v
    })
  } else if (useExpand && canCollapse) {
    schema = schema.map((v) => {
      v.hidden = false
      return v
    })
  }

  const visibleSpan = schema
    .filter((v) => !v.hidden)
    .reduce((sum, v) => sum + getFieldSpan(v), 0)
  const tailSpan = visibleSpan % 24

  return schema.concat([
    createActionField(
      propsComputed.isCol ? Math.max(0, 24 - ACTION_SPAN - tailSpan) : 0,
      propsComputed,
      useExpand,
      canCollapse
    )
  ])
})

const { formRegister, formMethods } = useForm()
const { getElFormExpose, getFormData, getFormExpose } = formMethods

const outsideProps = ref<SearchProps>({})
const mergeProps = ref<SearchProps>({})

const getProps = computed(() => {
  const propsObj = { ...props }
  Object.assign(propsObj, unref(mergeProps))
  return propsObj
})

const setProps = (props: SearchProps = {}) => {
  mergeProps.value = Object.assign(unref(mergeProps), props)
  outsideProps.value = props
}

const schemaRef = ref<FormSchema[]>([])

watch(
  () => unref(newSchema),
  async (schema = []) => {
    formModel.value = initModel(schema, unref(formModel))
    schemaRef.value = schema
  },
  { immediate: true, deep: true }
)

const filterModel = async () => {
  const model = await getFormData()
  if (unref(getProps).removeNoValueItem) {
    return Object.keys(model).reduce((prev, next) => {
      const value = model[next]
      if (!isEmptyVal(value)) {
        if (isObject(value)) {
          if (Object.keys(value).length > 0) prev[next] = value
        } else {
          prev[next] = value
        }
      }
      return prev
    }, {} as Recordable)
  }
  return model
}

const search = async () => {
  const elFormExpose = await getElFormExpose()
  await elFormExpose?.validate(async (isValid) => {
    if (isValid) {
      emit('search', await filterModel())
    }
  })
}

const reset = async () => {
  const elFormExpose = await getElFormExpose()
  elFormExpose?.resetFields()
  emit('reset', await filterModel())
}

const bottomButtonStyle = computed(() => ({
  textAlign: unref(getProps).buttonPosition as 'left' | 'center' | 'right'
}))

const setVisible = () => {
  visible.value = !unref(visible)
}

const setSchema = (schemaProps: FormSetProps[]) => {
  const { schema } = unref(getProps)
  for (const v of schema) {
    for (const item of schemaProps) {
      if (v.field === item.field) set(v, item.path, item.value)
    }
  }
}

const setValues = async (data: Recordable = {}) => {
  formModel.value = Object.assign(props.model, unref(formModel), data)
  const formExpose = await getFormExpose()
  formExpose?.setValues(data)
}

const delSchema = (field: string) => {
  const { schema } = unref(getProps)
  const index = findIndex(schema, (v: FormSchema) => v.field === field)
  if (index > -1) schema.splice(index, 1)
}

const addSchema = (formSchema: FormSchema, index?: number) => {
  const { schema } = unref(getProps)
  if (index !== void 0) schema.splice(index, 0, formSchema)
  else schema.push(formSchema)
}

const defaultExpose = {
  getElFormExpose,
  setProps,
  setSchema,
  setValues,
  delSchema,
  addSchema,
  getFormData
}

onMounted(() => emit('register', defaultExpose))
defineExpose(defaultExpose)

const onFormValidate = (prop: FormItemProp, isValid: boolean, message: string) => {
  emit('validate', prop, isValid, message)
}
</script>

<template>
  <Form
    class="search-form"
    :model="formModel"
    :is-custom="false"
    :label-width="getProps.labelWidth"
    hide-required-asterisk
    :inline="getProps.inline"
    :is-col="getProps.isCol"
    :schema="schemaRef"
    @register="formRegister"
    @validate="onFormValidate"
  />

  <template v-if="layout === 'bottom'">
    <div :style="bottomButtonStyle">
      <ActionButton
        :show-reset="getProps.showReset"
        :show-search="getProps.showSearch"
        :show-expand="getProps.showExpand"
        :search-loading="getProps.searchLoading"
        :reset-loading="getProps.resetLoading"
        :visible="visible"
        @expand="setVisible"
        @reset="reset"
        @search="search"
      />
    </div>
  </template>
</template>

<style scoped lang="less">
.search-form {
  :deep(.el-form-item:has(.search-form__action-btns)) {
    .el-form-item__content {
      justify-content: flex-end;
    }
  }

  :deep(.search-form__action-btns) {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    gap: 8px;
  }
}
</style>
