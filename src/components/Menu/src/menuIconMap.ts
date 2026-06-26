import type { Component } from 'vue'
import {
  Bell,
  Clock,
  Connection,
  DataBoard,
  Document,
  Location,
  Menu as MenuIcon,
  Setting,
  SetUp,
  UserFilled
} from '@element-plus/icons-vue'

/** LAD 路由 meta.icon → Element Plus 内置图标（生产构建不依赖 @iconify/json） */
const MENU_ICON_MAP: Record<string, Component> = {
  'vi-ant-design:fund-projection-screen-outlined': DataBoard,
  'vi-ant-design:history-outlined': Clock,
  'vi-ant-design:file-protect-outlined': Document,
  'vi-ant-design:cluster-outlined': Connection,
  'vi-ant-design:environment-outlined': Location,
  'vi-ant-design:alert-outlined': Bell,
  'vi-ant-design:deployment-unit-outlined': SetUp,
  'vi-ant-design:setting-outlined': Setting,
  'vi-eos-icons:role-binding': UserFilled
}

export function resolveMenuIcon(icon?: string): Component {
  if (!icon) return MenuIcon
  return MENU_ICON_MAP[icon] ?? MenuIcon
}
