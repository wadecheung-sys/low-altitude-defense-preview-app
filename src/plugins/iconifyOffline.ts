import { addCollection } from '@iconify/vue'
import antDesignIcons from '@iconify-json/ant-design/icons.json'
import biIcons from '@iconify-json/bi/icons.json'
import epIcons from '@iconify-json/ep/icons.json'
import zmdiIcons from '@iconify-json/zmdi/icons.json'

/** 生产构建（VITE_USE_ONLINE_ICON=false）时注入本地图标集，避免动态 class 无法被 UnoCSS 扫描 */
export function setupIconifyOffline() {
  if (import.meta.env.VITE_USE_ONLINE_ICON === 'true') return

  addCollection(epIcons)
  addCollection(antDesignIcons)
  addCollection(zmdiIcons)
  addCollection(biIcons)
}
