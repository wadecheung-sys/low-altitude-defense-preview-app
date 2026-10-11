# 低空防御综合管控平台 — 前端（preview-app）

基于 Vue 3 + Element Plus + Vite 的管理端，由 `reference/vue-element-plus-admin` 脚手架初始化，并按 `raw/` 原型持续定制。

> **体积说明**：本地 `node_modules` 约 1 GB 属正常（未进 Git）。结构说明见 [`docs/STRUCTURE.md`](docs/STRUCTURE.md)。

## 环境要求

- Node.js **>= 18**
- **npm**（`.npmrc` 已配置 `legacy-peer-deps`）

## 快速开始

```bash
cd preview-app
npm install
npm run dev
```

浏览器访问：**http://localhost:4000/**

### Mock 登录

| 用户名 | 密码  |
| ------ | ----- |
| admin  | admin |
| test   | test  |

### 忘记密码（Mock）

| 绑定手机号          | 演示验证码 |
| ------------------- | ---------- |
| admin → 13800138000 | 123456     |
| test → 13900139000  | 123456     |

## 常用脚本（均为 npm，不依赖 pnpm）

| 命令                  | 说明                     |
| --------------------- | ------------------------ |
| `npm run dev`         | 本地开发（默认端口见下） |
| `npm run clean:dist`  | 删除 dist / stats 等构建产物 |
| `npm run clean:cache` | 删除 Vite 预构建缓存 |
| `npm run build:pro`   | 生产构建                 |
| `npm run build:dev`   | 开发模式构建             |
| `npm run serve:pro`   | 预览生产构建产物         |
| `npm run ts:check`    | TypeScript 检查          |
| `npm run lint:eslint` | ESLint 修复              |

## 开发端口与代理

- **前端开发端口**：`4000`（在 `vite.config.ts` → `server.port` 中配置，可按团队习惯修改，非生产端口）
- **API 代理**：`/api` → `http://127.0.0.1:8000`（后端未启动时 Mock 仍可登录）

修改端口示例（`vite.config.ts`）：

```ts
server: {
  port: 5173, // 或任意未被占用的端口
  // strictPort: true, // 端口被占用时报错，不自动换端口
}
```

## 包管理说明

- 本目录**仅使用 npm**（`package-lock.json` 为准）。
- `.npmrc` 已设置 `legacy-peer-deps=true`，直接 `npm install` 即可。
- `node_modules` 不提交 Git；克隆后需重新 `npm install`。

## 当前状态

各业务模块按展示原型持续迭代，接口采用 Mock 数据。登录首页为 `/lad/data-screen`，控制台首页为 `/lad/incident/history`。当前代码与 Git 历史是实现状态的依据。

设备档案的“基本信息”新增必填“设备类别”（`deviceClass`：`detection` 侦测类设备 / `countermeasure` 反制类设备），独立于设备类型及档案树分类维护。已有示例档案按五类反制类型（强光、无线电干扰、导航诱骗、高功率微波、激光打击）初始化类别；新增及编辑以用户明确选择为准。档案不再保存“单次最大处置时长”。

“设备信息”关联基础档案后，显示继承的设备类别。仅反制类档案级联展开“单次最大处置时长”数值输入框（`maxDisposalSeconds`，单位秒，必填正整数），该值单独保存在每台设备中，同一档案下不同设备可以分别填写。新增或切换档案后必须明确填写，不自动带入其他档案的值；侦测类设备不显示、不保存该字段。已有示例设备的 30 秒仅为演示数据，旧档案时长不直接当作每台设备的配置。预案列表、表单、详情、模拟结果和执行参数不再携带该字段。

配置含义为本设备在预案反制和人工触发场景下共用的时长上限。当前仅实现设备类别、级联表单、Mock 保存及展示，没有真实设备控制服务，也未实现运行时计时或停止回执；实际约束须由设备控制服务统一接入，不能依赖页面是否打开。Mock 数据仅保留于当前运行实例，刷新或重启后恢复示例数据。

## GitHub 发布

本目录已是独立 Git 仓库，远程仓库为 [low-altitude-defense-preview-app](https://github.com/wadecheung-sys/low-altitude-defense-preview-app)。推送 `main` 会触发 `.github/workflows/deploy-pages.yml`，构建并发布 GitHub Pages。

[在线预览](https://wadecheung-sys.github.io/low-altitude-defense-preview-app/)

## 文档与资源

开发结构见 [docs/STRUCTURE.md](docs/STRUCTURE.md)。`public/export-templates/` 和 `public/prototypes/` 是运行所需资源。

历史交接报告、文档修订稿及渲染输出已于 2026-09-21 移出日常目录，归档位于完整工作区的 `_archive/documents-20260921/`；归档不随本仓库发布。`artifacts/` 保留文档生成脚本，重建旧文档前需恢复对应输入。
