import { addCollection } from '@iconify/vue'
import antDesignIcons from '@iconify-json/ant-design/icons.json'
import biIcons from '@iconify-json/bi/icons.json'
import epIcons from '@iconify-json/ep/icons.json'
import zmdiIcons from '@iconify-json/zmdi/icons.json'

/** 启动时注入本地图标集（ep / ant-design / zmdi / bi），避免依赖 Iconify CDN。
 *  业务代码请仅使用 vi-ep / vi-ant-design / vi-zmdi / vi-bi 前缀的 vi-* 图标。 */
export function setupIconifyOffline() {
  addCollection(epIcons)
  addCollection(antDesignIcons)
  addCollection(zmdiIcons)
  addCollection(biIcons)
}
