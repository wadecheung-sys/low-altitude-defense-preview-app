# preview-app 代码结构

> 对照 `reference/vue-element-plus-admin-master`（上游脚手架，只读）与 LAD 定制后的实际布局。

## 资源与文档管理

依赖安装在 `node_modules/`，不进 Git；体积随安装版本变化。`public/prototypes/` 含多个历史大屏资源版本，体积随导入增长，不再采用早期“约 4 MB”的估计。

`public/export-templates/` 为运行时导出模板。文档清理不删除上述资源、源代码或设备原始资料。历史文档移入完整工作区 `_archive/documents-20260921/`，`artifacts/` 仅保留生成脚本。

清理构建缓存可使用 `npm run clean:cache`；清理构建产物可使用 `npm run clean:dist`。

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
├── artifacts/            ← 保留的文档生成脚本（非运行时）
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
