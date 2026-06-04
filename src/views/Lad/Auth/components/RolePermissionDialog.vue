<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { getAuthPermissionTreeApi, saveAuthRoleApi } from '@/api/lad/auth'
import type { AuthPermissionNode, AuthRole } from '@/api/lad/auth/types'
import { ElMessage, ElTree } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  row?: AuthRole
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const treeData = ref<AuthPermissionNode[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()
const checkedKeys = ref<string[]>([])

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.row) return
    const res = await getAuthPermissionTreeApi()
    treeData.value = res.data || []
    checkedKeys.value = [...props.row.permissionIds]
    setTimeout(() => {
      treeRef.value?.setCheckedKeys(checkedKeys.value)
    }, 0)
  }
)

async function onSave() {
  if (!props.row) return
  const keys = (treeRef.value?.getCheckedKeys(false) || []) as string[]
  const half = (treeRef.value?.getHalfCheckedKeys() || []) as string[]
  const permissionIds = [...new Set([...keys, ...half])]
  loading.value = true
  try {
    await saveAuthRoleApi({
      id: props.row.id,
      roleCode: props.row.roleCode,
      roleName: props.row.roleName,
      userType: props.row.userType,
      status: props.row.status,
      permissionIds,
      remark: props.row.remark
    })
    ElMessage.success('权限已更新')
    emit('success')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model="visible" title="分配功能权限" width="560px" max-height="75vh">
    <p v-if="row" class="lad-role-perm-hint">角色：{{ row.roleName }}（{{ row.roleCode }}）</p>
    <ElTree
      ref="treeRef"
      :data="treeData"
      node-key="id"
      show-checkbox
      default-expand-all
      :props="{ label: 'name', children: 'children' }"
      class="lad-role-perm-tree"
    />
    <template #footer>
      <BaseButton type="primary" :loading="loading" @click="onSave">保存</BaseButton>
      <BaseButton @click="visible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped>
.lad-role-perm-hint {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.lad-role-perm-tree {
  max-height: 50vh;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 8px;
}
</style>
