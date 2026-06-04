# 低空防御综合管控平台 — 前端（preview-app）

基于 Vue 3 + Element Plus + Vite 的管理端，由 `reference/vue-element-plus-admin` 脚手架初始化，并按 `raw/` 原型持续定制。

## 环境要求

- Node.js **>= 18**
- **npm**（推荐，脚本已统一为 npm 友好；无需安装 pnpm）

可选：若团队已使用 pnpm，仍可 `pnpm install` / `pnpm dev`，与 `pnpm-lock.yaml` 一致。

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

- 本目录脚本**不再调用 `pnpm`**，避免本机未安装 pnpm 时报错。
- 根目录 `.npmrc` 已设置 `legacy-peer-deps=true`，直接 `npm install` 即可。
- 仓库内保留 `pnpm-lock.yaml` 仅作上游参照；以 **npm + package.json** 为准维护依赖。

## 当前进度

- [x] 登录页（对齐 `raw/登录页.png`）
- [ ] 业务模块页面（按需求迭代）

## GitHub 协作发布

建议把 `preview-app` 单独作为一个 GitHub 仓库维护，这样研发同事可以直接拉取、对比、提 PR，不需要反复收前端压缩包。

这个目录已经预留了 GitHub Pages 自动部署工作流：

- 推送到 `main` 分支后，会自动构建并发布一个在线预览页
- 预览地址格式通常为：`https://<GitHub用户名>.github.io/<仓库名>/`
- 如果仓库开启了 GitHub Pages，部署成功后同事可以直接点链接查看当前页面效果

推荐发布步骤：

```bash
cd preview-app
git init -b main
git add .
git commit -m "chore: initialize preview app repository"
git remote add origin <你的GitHub仓库地址>
git push -u origin main
```

首次推送后，到 GitHub 仓库的 `Settings -> Pages` 确认使用 GitHub Actions 进行部署即可。
