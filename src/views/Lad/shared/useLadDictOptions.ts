import { getDictEntriesByCodeApi } from '@/api/lad/system'
import type { DictEntryItem } from '@/api/lad/system/types'
import { onMounted, ref } from 'vue'

export function useLadDictOptions(dictCode: string, loadOnMount = true) {
  const entries = ref<DictEntryItem[]>([])
  const loading = ref(false)

  async function reload() {
    loading.value = true
    try {
      const res = await getDictEntriesByCodeApi(dictCode)
      entries.value = res.data ?? []
    } catch {
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  if (loadOnMount) {
    onMounted(reload)
  }

  return { entries, loading, reload }
}
