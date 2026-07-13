import { defineStore } from 'pinia'
import { store } from '../index'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useStorage } from '@/hooks/web/useStorage'
import { LocaleDropdownType } from '@/components/LocaleDropdown'

const { getStorage, setStorage } = useStorage('localStorage')

const DEFAULT_LANG = 'zh-CN' as const

/** 低空防御平台统一中文界面，忽略历史英文偏好。 */
function resolveLang(stored?: string | null): LocaleType {
  if (stored !== DEFAULT_LANG) {
    setStorage('lang', DEFAULT_LANG)
  }
  return DEFAULT_LANG
}

const elLocaleMap = {
  'zh-CN': zhCn,
  en: en
}
interface LocaleState {
  currentLocale: LocaleDropdownType
  localeMap: LocaleDropdownType[]
}

export const useLocaleStore = defineStore('locales', {
  state: (): LocaleState => {
    return {
      currentLocale: {
        lang: resolveLang(getStorage('lang')),
        elLocale: elLocaleMap[DEFAULT_LANG]
      },
      // 多语言
      localeMap: [
        {
          lang: 'zh-CN',
          name: '简体中文'
        }
      ]
    }
  },
  getters: {
    getCurrentLocale(): LocaleDropdownType {
      return this.currentLocale
    },
    getLocaleMap(): LocaleDropdownType[] {
      return this.localeMap
    }
  },
  actions: {
    setCurrentLocale(localeMap: LocaleDropdownType) {
      const lang = resolveLang(localeMap?.lang)
      this.currentLocale.lang = lang
      this.currentLocale.elLocale = elLocaleMap[lang]
      setStorage('lang', lang)
    }
  }
})

export const useLocaleStoreWithOut = () => {
  return useLocaleStore(store)
}
