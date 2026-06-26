# preview-app 代码结构

> 对照 `reference/vue-element-plus-admin-master`（上游脚手架，只读）与 LAD 定制后的实际布局。

## 体积说明

| 路径 | 典型大小 | 是否进 Git | 说明 |
|------|----------|------------|------|
| `node_modules/` | **~900 MB–1 GB** | 否 | `npm install` 本地生成；Element Plus + 图标集 + 地图 + 编辑器等 |
| `src/` | ~7 MB | 是 | 业务与共享组件源码 |
| `public/` | ~4 MB | 是 | 静态资源；含指挥大屏 Axure 原型 |
| `reference/`（工作区） | ~2 MB | 否 | 上游参照，不含 node_modules |

**GitHub 仓库体积**仅含源码（约数 MB），不含 `node_modules`。本地 1 GB+ 主要来自依赖安装，属正常现象。

### node_modules 主要占用（参考）

| 包 | 约占用 | 用途 |
|----|--------|------|
| `@iconify/json` | 按需临时安装 | `npm run icon` 时 `npm i -D @iconify/json` |
| `monaco-editor` | ~95 MB | Form 基础设施（CodeEditor） |
| `echarts` | ~50 MB | 图表组件（共享组件库保留） |
| `element-plus` | ~40 MB | UI 框架 |
| `leaflet` / `@amap/*` | 较小 | LAD 区域/设备 GIS |
| ~~`cesium`~~ | 已移除 | 原 v3 大屏试验，当前未引用 |

清理本地缓存：`npm run clean:cache` · 清理构建产物：`npm run clean:dist`

---

## 目录对照（reference → LAD）

```
preview-app/
├── src/
│   ├── api/
│   │   ├── lad/          ← LAD 业务 API + Mock Store（核心）
│   │   ├── login/        ← 登录 Mock
│   │   ├── table/        ← Example 综合示例用
│   │   └── common/       ← 共享
│   ├── views/
│   │   ├── Lad/          ← 全部业务页面（核心）
│   │   ├── Example/      ← style-kernel 参照（非业务路由）
│   │   ├── Login/        ← 登录
│   │   ├── Personal/     ← 个人中心
│   │   ├── Error/        ← 403/404/500
│   │   └── Redirect/     ← 路由重定向
│   ├── components/       ← 共享 UI（Form/Table/Dialog…，继承自 reference）
│   ├── layout/           ← 框架布局
│   ├── router/
│   │   ├── index.ts      ← 常量路由 + 静态 lad 注入
│   │   ├── ladRoutes.ts  ← LAD 业务路由树
│   │   └── ladRouteMeta.ts
│   ├── store/            ← Pinia（permission 固定 static）
│   └── permission.ts     ← 路由守卫
├── mock/
│   ├── lad/              ← LAD 业务 Mock
│   ├── user/             ← 登录 Mock
│   ├── table/            ← Example Mock
│   └── role/             ← 空壳（动态路由已禁用）
├── artifacts/            ← 交接文档、规格脚本（非运行时）
└── public/prototypes/    ← 指挥大屏 iframe 原型
```

### 已从 reference 剥离（不再维护）

| 类别 | 原 reference 路径 | 原因 |
|------|-------------------|------|
| Demo 页面 | `views/Dashboard`, `Components`, `Authorization`, `Level`, `Function`, `Guide`, `hooks` | 未接入 `ladRoutes` |
| Demo API | `api/dashboard`, `department`, `role`, `menu`, `request` | 仅 demo 使用 |
| Demo Mock | `mock/analysis`, `workplace`, `department`, `menu`, `dict`, `request` | 静态路由不需要 |
| 上游文档 | `CHANGELOG.md`, `README.zh-CN.md`, Docker 文件 | 与 LAD 无关 |

### 保留的 reference 遗产（基础设施）

- `src/components/**` — Form/Table/Search/Dialog 等，LAD 页面依赖
- `src/views/Example/**` — 与 `style-kernel/example-page-reference.md` 对齐
- `src/hooks/web/**` — 框架 hooks

---

## 路由策略

- **静态路由**：`permission.ts` → `generateRoutes('static')` → `ladAsyncRouterMap`
- **包装路由面包屑**：`meta.breadcrumbWrap: true`（设备信息、字典管理）
- **动态路由开关**：设置面板已隐藏，避免误开 upstream demo 菜单

---

## 与 reference 的差异原则

1. 业务只写在 `views/Lad/` + `api/lad/` + `mock/lad/`
2. 不改 `reference/` 文件夹；需要对照时只读打开
3. 新页面结构先查 `style-kernel/`，再查 `views/Example/`
4. 不恢复 upstream demo 路由 unless 明确需要
