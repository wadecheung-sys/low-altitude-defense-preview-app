import type { CSSProperties } from 'vue'
import { RawAxiosRequestHeaders } from 'axios'
declare global {
  declare interface Fn<T = any> {
    (...arg: T[]): T
  }

  declare type Nullable<T> = T | null

  declare type ElRef<T extends HTMLElement = HTMLDivElement> = Nullable<T>

  declare type Recordable<T = any, K = string> = Record<K extends null | undefined ? string : K, T>

  declare type RemoveReadonly<T> = {
    -readonly [P in keyof T]: T[P]
  }

  declare type ComponentRef<T> = InstanceType<T>

  declare type LocaleType = 'zh-CN' | 'en'

  declare type TimeoutHandle = ReturnType<typeof setTimeout>
  declare type IntervalHandle = ReturnType<typeof setInterval>

  declare type ElementPlusInfoType = 'success' | 'info' | 'warning' | 'danger'

  declare type LayoutType = 'classic' | 'topLeft' | 'top' | 'cutMenu'

  declare type AxiosContentType =
    | 'application/json'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'text/plain'

  declare type AxiosMethod = 'get' | 'post' | 'delete' | 'put'

  declare type AxiosResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

  declare interface AxiosConfig {
    params?: any
    data?: any
    url?: string
    method?: AxiosMethod
    headers?: RawAxiosRequestHeaders
    responseType?: AxiosResponseType
  }

  declare interface IResponse<T = any> {
    code: number
    data: T extends any ? T : T & any
  }

  declare interface ThemeTypes {
    elColorPrimary?: string
    leftMenuBorderColor?: string
    leftMenuBgColor?: string
    leftMenuBgLightColor?: string
    leftMenuBgActiveColor?: string
    leftMenuCollapseBgActiveColor?: string
    leftMenuTextColor?: string
    leftMenuTextActiveColor?: string
    logoTitleTextColor?: string
    logoBorderColor?: string
    topHeaderBgColor?: string
    topHeaderTextColor?: string
    topHeaderHoverColor?: string
    topToolBorderColor?: string
  }

  declare interface ImportMetaEnv {
    readonly VITE_NODE_ENV: string
    readonly VITE_APP_TITLE: string
    readonly VITE_APP_TITLE_SHORT: string
    readonly VITE_API_BASE_PATH: string
    readonly VITE_BASE_PATH: string
    readonly VITE_DROP_DEBUGGER: string
    readonly VITE_DROP_CONSOLE: string
    readonly VITE_SOURCEMAP: string
    readonly VITE_OUT_DIR: string
    readonly VITE_USE_BUNDLE_ANALYZER: string
    readonly VITE_USE_ALL_ELEMENT_PLUS_STYLE: string
    readonly VITE_USE_MOCK: string
    readonly VITE_USE_CSS_SPLIT: string
    readonly VITE_USE_ONLINE_ICON: string
    readonly VITE_ICON_PREFIX: string
    readonly VITE_HIDE_GLOBAL_SETTING: string
    /** 高德地图 JS API Key */
    readonly VITE_AMAP_KEY: string
    /** 高德安全密钥（2021 年后申请的 Key 通常需要） */
    readonly VITE_AMAP_SECURITY_CODE: string
    /** Cesium Ion Access Token（指挥控制中心） */
    readonly VITE_CESIUM_ION_TOKEN: string
    readonly VITE_CITY_DEMO_LNG?: string
    readonly VITE_CITY_DEMO_LAT?: string
    readonly VITE_CAMPUS_TILESET_URL?: string
    readonly VITE_DEMO_SHOW_IMAGERY?: string
  }
}
