# 设备选型内容对齐 — 分步实施计划

> 版本：V1.0 · 2026-07-08  
> 用途：按步骤完善设备展示与操作内容；**每步完成后记录实际改动文件**，便于回滚与验收。  
> 约束：**设备组管理逻辑不变**（主设备 ↔ 监控摄像头关联）；名称保持现状。

---

## 0. 已确认原则（来自产品决策）

| 编号 | 决策 |
|------|------|
| P1 | **PL671F**、**RDS200** 均保留，为已确定选型 |
| P2 | **EXD55-LS（ADS-B）** 仅作周边/辅助设备，在「设备信息」可见即可，不进设备组主设备、不进大屏弹窗主列表 |
| P3 | **迫降** → 导航诱骗（DY506F）；**压制** → 无线电干扰（FG310F），效果以自动返航为主 |
| P4 | **光电 / 激光 / 微波** 为必要选型，供应商待定；先用占位档案 + 原型面板，待文档到位再替换 |
| P5 | 设备操作走**供应商上报链路**为原始设计；具体 API 待后续明确，本阶段只做展示与演示指令 |
| P6 | 数据大屏仍以 **Axure 原型交互为主**；「查看更多」(u170) 弹窗 (u299) 内容逐步与后台设备数据对齐 |
| P7 | 说明书原件放在仓库根目录 **`device-docs/`**，开发侧通过 **`deviceCatalog.ts` 结构化索引** 引用，不直接解析 PDF |
| P8 | 档案指标拆为 **设备规格**（说明书固定，只读）与 **可配置项**（`device` 级在设备信息设定；`runtime` 级如转台角度仅指挥大屏控制） |

---

## 1. 设备选型清单（单一事实来源目标）

### 1.1 已确认型号（有说明书）

| 系统类型 | 型号 | 厂商 | 说明书路径（放入 device-docs 后） |
|----------|------|------|-----------------------------------|
| 无线电侦测 | PL671F | 凡双 | `device-docs/PL671F-固定式无线电侦测-使用说明书.pdf` |
| Remote-ID 监视 | RDS200 | 凡双 | `device-docs/RDS200-远程识别监视设备-使用说明书.pdf` |
| 导航诱骗 | DY506F | 凡双 | `device-docs/DY506F-固定式反无人机导航主动防御-使用说明书.pdf` |
| 无线电干扰 | FG310F | 凡双 | `device-docs/FG310F-固定式转台无线电压制-使用说明书.pdf` |
| ADS-B 监视（周边） | EXD55-LS | 亿思德 | `device-docs/EXD55-LS-ADS-B接收机手册.pdf` |

参考：`device-docs/Remote-ID协议.docx`（目标识别字段，供 PL671F / RDS200 展示）

### 1.2 待供应商文档（占位）

| 系统类型 | 占位型号 | 状态 |
|----------|----------|------|
| 光电跟踪 | TBD-EO | 选型中 |
| 激光打击 | TBD-LSR | 选型中 |
| 高功率微波 | TBD-HPM | 选型中 |
| 雷达 | TBD-RAD | 可选；大屏原型仍有雷达 tab，暂保留占位 |

### 1.3 不动项

- **设备组管理**：`DeviceGroupManagement.vue`、`groupStore.ts`、`deviceGroupCatalog.ts` 的 **关联逻辑、UI 流程不改**；仅更新 seed 中的设备名称/编码与新型号一致。
- **监控摄像头**：仍为关联设备，不进主设备类型列表。

---

## 2. 分步计划（按顺序执行）

每步包含：**目标 · 改动文件 · 不改文件 · 验收 · 你的确认项**

---

### 步骤 0 — 文档与索引基建

**目标**  
- 将说明书放入 `device-docs/`  
- 建立代码内设备目录，供档案 / 信息 / 大屏共用  

**改动文件**

| 文件 | 动作 |
|------|------|
| `device-docs/*` | 复制 6 份说明书 + Remote-ID 协议 |
| `preview-app/src/constants/deviceCatalog.ts` | **新建**：型号、厂商、类型、能力标签、文档路径、是否大屏主列表、是否可进设备组 |
| `preview-app/artifacts/device-selection-rollout-plan.md` | 本文件；每步完成后更新「完成记录」 |

**不改**  
任何 Vue 页面、mock 数据、原型 HTML  

**验收**  
- [ ] `device-docs/` 内 6 个文件齐全  
- [ ] `deviceCatalog.ts` 导出 `CONFIRMED_DEVICES`、`PENDING_DEVICES`、`PERIPHERAL_DEVICES`  

**请你确认**  
- RDS200 在系统中显示类型名：**「Remote-ID 监视」** 还是仍显示「无线电侦测」但用型号区分？（建议前者，列表更清晰）

---

### 步骤 1 — 设备档案（Archive）对齐选型

**目标**  
档案列表/详情体现真实型号与指标；去掉「同方威视 + LAD-*」占位为主数据的印象。

**改动文件**

| 文件 | 动作 |
|------|------|
| `src/constants/deviceCatalog.ts` | 补充各型号 `archiveIndicators` 模板 |
| `src/api/lad/device/archiveStore.ts` | 重写 `seedRows`：5 个确认型号 + 3 个待定型号 + 保留少量分页 demo |
| `src/views/Lad/Device/constants.ts` | `deviceArchiveTypeOptions` 增加「Remote-ID 监视」「ADS-B 监视」；厂商增加凡双、亿思德 |
| `src/api/lad/device/types.ts` | 如有 category 枚举，补充 `remote-id` / `ads-b` 分类（可选） |

**不改**  
- `DeviceArchive.vue` / `DeviceArchiveDetail.vue` **页面结构**（除非类型选项不够）  
- 设备组相关文件  

**验收**  
- [ ] 档案列表可见 PL671F、RDS200、DY506F、FG310F 及 TBD 光电/激光/微波  
- [ ] 详情页指标含说明书关键参数（频段、距离、功耗等）  
- [ ] EXD55-LS 档案存在且类型为 ADS-B 监视  

**页面影响**  
- `/lad/device/archive` 列表内容变化  
- `/lad/device/archive/detail/:id` 指标内容变化  

---

### 步骤 2 — 设备信息（Info）对齐部署数据

**目标**  
「设备信息」模块展示与选型一致的台账；EXD55 仅在此模块出现。

**改动文件**

| 文件 | 动作 |
|------|------|
| `src/api/lad/device-info/infoStore.ts` | 重写 `seedRows`：与档案 ID 关联；型号/名称/IP/部署位置与 catalog 一致 |
| `src/api/lad/device-info/types.ts` | `DeviceInfoKind` 增加 `Remote-ID 监视`、`ADS-B 监视` |
| `src/views/Lad/Device/deviceInfoConstants.ts` | 类型选项、图标映射同步 |
| `src/api/lad/device-info/deviceSelfCheck.ts` | 新型号自检项（只读展示，不接真机） |

**不改**  
- `DeviceInfoList.vue` / `DeviceInfoDetail.vue` 表单结构  
- 设备组页面  

**验收**  
- [ ] 5+3+1 台演示设备名称、型号、档案链接正确  
- [ ] EXD55-LS 在列表可搜到，类型 ADS-B 监视  
- [ ] 随机生成的 20 条 bulk 数据可降为 0 或标记为「历史测试数据」（建议减少干扰）  

**页面影响**  
- `/lad/device/info/list`  
- `/lad/device/info/detail/:id`  

---

### 步骤 3 — 设备组 seed 同步（逻辑不变）

**目标**  
演示数据中的主设备名称/编码与步骤 2 一致；关联摄像头链条不变。

**改动文件**

| 文件 | 动作 |
|------|------|
| `src/api/lad/device-group/groupStore.ts` | 仅更新 `deviceName`、`deviceCode`、`masterDeviceId` 引用 |
| `src/api/lad/device-info/infoStore.ts` | 同步 `di-*` id（若步骤 2 调整了 id） |

**不改**  
- `DeviceGroupManagement.vue`  
- `deviceGroupCatalog.ts` 中 `deriveGroupType`、`MASTER_DEVICE_TYPES` **逻辑**  
- 可选：在 `MASTER_DEVICE_TYPES` **末尾追加** `Remote-ID 监视`（若步骤 0 确认），不改变原有类型推导规则  

**验收**  
- [ ] 设备组 CRUD、主设备 autocomplete、摄像头 transfer 与改前一致  
- [ ] 列表展示名称已为 FG310F / PL671F 等  

**页面影响**  
- `/lad/device/group` 仅数据文字变化  

---

### 步骤 4 — 运行监控（Monitor）按类型展示

**目标**  
监控卡片体现各型号关键状态字段（只读）；摄像头仍可通过组关联查看，但主列表优先展示反制/探测主设备。

**改动文件**

| 文件 | 动作 |
|------|------|
| `src/api/lad/device-monitor/monitorStore.ts` | 按 `deviceModel` 生成差异化 `runtimeText` / `metrics` |
| `src/views/Lad/Device/components/DeviceMonitorCard.vue` | 展示 `metrics`（当前已算未显示） |
| `src/constants/deviceCatalog.ts` | 各型号 `monitorFields` 定义 |

**不改**  
- `DeviceRuntimeMonitor.vue` 布局  
- 在线状态算法可仍为 demo，但文案需型号化  

**验收**  
- [ ] PL671F 卡片含探测数/测向状态类字段  
- [ ] RDS200 卡片含 RID 目标数  
- [ ] DY506F 含搜星/发射状态；FG310F 含转台方位/压制状态  

**页面影响**  
- `/lad/device/monitor`  

---

### 步骤 5 — 预案与反制语义对齐

**目标**  
系统内「迫降 / 压制 / 驱离」与选型设备对应关系文档化并在 UI 标签体现。

**改动文件**

| 文件 | 动作 |
|------|------|
| `src/api/lad/plan/planDeviceCatalog.ts` | 注释 + 动作说明映射；反制组动作 tooltip 文案 |
| 系统字典 seed（如有 `countermeasure_action`） | 确认：导航诱骗=迫降，无线电干扰=压制返航 |

**不改**  
- 预案页面交互流程  

**验收**  
- [ ] 预案配置中反制动作与设备类型对应关系清晰  

**页面影响**  
- `/lad/plan/index` 文案/说明  

---

### 步骤 6 — 设备操作面板（后台，演示级）

**目标**  
按型号展示操作项（对接供应商链路的 UI 壳层）；不接真 API。

**改动文件**

| 文件 | 动作 |
|------|------|
| `src/views/Lad/shared/DeviceRemoteControlPanel.vue` | 按 `deviceModel` 分支：DY506F（禁飞/驱离/发射）、FG310F（转台/频段/联动）、PL671F/RDS200（只读监视） |
| `src/views/Lad/Device/DeviceInfoDetail.vue` | 底部挂载控制面板（仅主设备类型，不含摄像头/ADS-B） |
| `src/constants/deviceCatalog.ts` | `operationCapabilities[]` |

**不改**  
- 数据大屏 CommandScreen（本步）  

**验收**  
- [ ] 打开 DY506F 详情可见诱骗相关按钮（演示 toast）  
- [ ] 打开 FG310F 可见压制相关按钮  
- [ ] ADS-B / 摄像头无操作面板  

**页面影响**  
- `/lad/device/info/detail/:id`  

---

### 步骤 7 — 数据大屏「查看更多」弹窗内容对齐（重点）

**目标**  
点击 u170 → 弹出 u299：左侧设备 tab、右侧 u311 控制面板与**步骤 2 设备台账**一致。

**原型结构（勿改交互逻辑）**

| 元素 | 作用 |
|------|------|
| u170 | 「查看更多」按钮 |
| u299 | 弹窗容器 |
| u308–u310, … | 左侧设备 tab（当前：雷达/光电/激光/微波…） |
| u311 | 右侧多态面板（微波/光电/激光/雷达） |
| u563 | 设备详情子弹窗 |
| u653/u654 | 安全锁（保持 Axure 原样） |

**改动策略（分 7a / 7b）**

#### 7a — 静态文案同步（低风险，优先）

| 文件 | 动作 |
|------|------|
| `public/prototypes/data-screen-03/index.html` | 仅改 `<span>` 内设备名、型号标签 |
| `public/prototypes/data-screen-03/数据大屏03.html` | 同上（保持双份一致） |

建议 tab 映射：

| 原型 tab | 对齐设备 |
|----------|----------|
| 1#雷达-LD | 占位雷达 TBD-RAD（或暂保留演示名） |
| 1#光电-GD | TBD-EO 占位 |
| 1#激光-JG | TBD-LSR 占位 |
| 1#高功率微波-WB | TBD-HPM 占位 |
| （若原型可增 tab） | PL671F、RDS200、DY506F、FG310F |

> 若 Axure 面板数不够，**不强行加交互**；确认型号优先在 u299 列表文字和 u563 详情中体现。

#### 7b — 可选：iframe 数据注入（中风险，你确认后再做）

| 文件 | 动作 |
|------|------|
| `src/views/Lad/Command/CommandScreen.vue` | 仅增加「读取 deviceCatalog + infoStore → 写入 iframe 文本节点」 |
| `src/views/Lad/Command/dataScreenDeviceSync.ts` | **新建**：u308–u310 等 id 映射表 |

**不改**  
- u653/u654 安全锁流程  
- 地图目标/card 选中同步（仍不做）  
- u103/u206/u18 三个跳转  

**验收**  
- [ ] 点击「查看更多」弹窗内设备名与后台「设备信息」一致  
- [ ] 光电/激光/微波/雷达 tab 仍可按原型切换  
- [ ] 确认型号 PL671F/RDS200/DY506F/FG310F 在弹窗中有对应展示位  

**页面影响**  
- `/lad/data-screen` 弹窗内容  

---

### 步骤 8 — 供应商链路预留（后续迭代，本阶段只建接口形状）

**目标**  
为将来对接凡双/亿思德上报链路留 HTTP 壳，不接真机。

**改动文件**

| 文件 | 动作 |
|------|------|
| `src/api/lad/device-control/types.ts` | **新建** CommandRequest / CommandResult / DeviceTelemetry |
| `src/api/lad/device-control/index.ts` | mock POST `/device-control/command` |
| `DeviceRemoteControlPanel.vue` | 从直接 ElMessage 改为调 mock API |

**不改**  
- 大屏 Axure 内操作（仍走原型）  

---

## 3. 步骤依赖关系

```
步骤0 → 步骤1 → 步骤2 → 步骤3
              ↘ 步骤4
步骤2 → 步骤5
步骤2 → 步骤6
步骤2 → 步骤7a → (可选)7b
步骤6 → 步骤8
```

建议发布节奏：**0 → 1 → 2 → 3** 为第一里程碑（后台台账可信）；**7a** 为第二里程碑（大屏弹窗可读）；**4–6** 第三；**7b、8** 待你确认后再动。

---

## 4. 每步完成记录（实施时填写）

| 步骤 | 状态 | 完成日期 | 实际改动文件 | 备注 |
|------|------|----------|--------------|------|
| 0 | 完成 | 2026-07-08 | `device-docs/`（6 文件已确认）、`src/constants/deviceCatalog.ts` | RDS200 采用「Remote-ID 监视」 |
| 1 | 完成 | 2026-07-08 | `archiveStore.ts`、`Device/constants.ts` | 移除 bulk 随机档案 |
| 2 | 完成 | 2026-07-08 | `infoStore.ts`、`device-info/types.ts`、`deviceInfoConstants.ts`、`deviceSelfCheck.ts` | EXD55 仅设备信息 |
| 3 | 完成 | 2026-07-08 | `groupStore.ts`、`deviceGroupCatalog.ts` | 组逻辑未改，仅 seed |
| 4 | 完成 | 2026-07-08 | `monitorStore.ts`、`types.ts`、`DeviceMonitorCard.vue` | 监控页排除 ADS-B/摄像头 |
| 5 | 完成 | 2026-07-08 | `planDeviceCatalog.ts`、`PlanFormDialog.vue` | 反制动作 → 设备提示 |
| 6 | 完成 | 2026-07-08 | `DeviceRemoteControlPanel.vue`、`DeviceInfoDetail.vue` | 按型号演示操作 |
| 7a | 完成 | 2026-07-08 | `data-screen-03/index.html`、`数据大屏03.html` | 四 tab 占位 + 已部署摘要 |
| 7b | 完成 | 2026-07-08 | `dataScreenDeviceSync.ts`、`CommandScreen.vue` | iframe 注入 u308–u551/u563，型号可点选 |
| 8 | 完成 | 2026-07-08 | `device-control/*`、`index.mock.ts`、`DeviceRemoteControlPanel.vue`、`DeviceInfoDetail.vue` | 供应商链路 mock POST |
| 9 | 完成 | 2026-07-08 | `archiveStore.ts`、`infoStore.ts`、`groupStore.ts`、`planStore.ts`、`planTrigger.ts`、`DeviceRemoteControlPanel.vue` | 审查修复：档案 ID 映射、预案组对齐、RDS200/TBD 组、供应商字段 |
| 10 | 完成 | 2026-07-09 | `device/types.ts`、`deviceCatalog.ts`、`archiveStore.ts`、`infoStore.ts`、`DeviceArchiveDetail.vue`、`DeviceInfoDetail.vue`、`DeviceMonitorCard.vue`、`monitorStore.ts`、`DeviceRemoteControlPanel.vue` | **设备规格 vs 可配置项**：规格为说明书固定参数（如功率、频段范围）；可配置项分 `device`（设备信息可设）与 `runtime`（转台角度等仅指挥大屏控制） |

---

## 4.1 设备规格与可配置项（步骤 10 补充说明）

### 概念划分

| 类型 | 含义 | 示例（FG310F） | 维护位置 | 单台设备是否可改 |
|------|------|----------------|----------|------------------|
| **设备规格** | 说明书固定参数，随型号/档案确定 | 设备功率 ≤600W、工作频段、水平/俯仰**范围** | 设备档案 → 设备规格表 | 否（只读） |
| **可配置项 · 设备级** | 部署时可设定的业务参数 | 默认压制频段、联动跟踪模式 | 设备信息 → 基础档案下方 | 是 |
| **可配置项 · 运行时** | 作战/演示时实时控制 | 转台方位角、转台俯仰角 | 指挥大屏（`dataScreenDeviceSync`） | 是（不在设备信息表单） |

### 已确认型号配置项一览

| 型号 | 设备规格（节选） | 设备级可配置项 | 运行时可配置项 |
|------|------------------|----------------|----------------|
| FG310F | 功率、频段、转角/俯仰**范围**、拦截距离 | 默认压制频段、联动跟踪模式 | 转台方位角、转台俯仰角 |
| DY506F | 频率、防御距离、功耗 | 默认证诱骗模式、发射功率档位 | — |
| PL671F | 频率范围、侦测半径 | 侦测灵敏度、平台上报周期 | — |
| RDS200 | 频段、探测半径 | 监测刷新策略 | — |
| EXD55-LS | 接收频段、覆盖半径 | 数据输出格式 | — |
| TBD-EO | 跟踪距离、视场角 | 跟踪模式、预置位编号 | 转台方位角、转台俯仰角 |

### 页面验收（FG310F 演示设备 `DEV-FG310-01`）

- [ ] `/lad/device/archive/detail/D-LAD-JAM0001`：设备规格含功率/频段；可配置项表中转台角度标记为「运行时（大屏）」
- [ ] `/lad/device/info/detail/DEV-FG310-01`：基础档案下方仅显示「默认压制频段」「联动跟踪模式」；提示转台由大屏控制
- [ ] 右侧 Tab「设备规格」只读展示档案规格，不含当前转台角度值
- [ ] 指挥大屏 FG310F 面板仍可联动方位（`dataScreenDeviceSync.ts`）

### 数据模型

- `DeviceArchiveIndicator` → 档案 **specifications**（`item / unit / value`）
- `DeviceArchiveConfigurableItem` → **configurableItems**（`key / label / unit / scope / hint / defaultValue?`）
- 设备台账 **deviceConfigValues**: `Record<string, string>`，仅存 `scope === 'device'` 的键值

---

## 5. 风险与防错清单

1. **不要**为对齐数据去改 `DeviceGroupManagement.vue` 的表单校验、transfer、保存逻辑。  
2. **不要**在步骤 7 之前改 CommandScreen 的地图/安全锁/z-index 逻辑。  
3. 改原型 HTML 时 **index.html 与 数据大屏03.html 同步**，避免 iframe 与直连不一致。  
4. 调整 `infoStore` 的 `di-*` id 时，**必须同步** `groupStore` 的 `masterDeviceId` / `linkedDeviceIds`。  
5. 新增设备类型时，检查：`types.ts`、`constants.ts`、`deviceSelfCheck.ts`、`MASTER_DEVICE_TYPES`（若需进组）五处一致。  
6. bulk 随机生成数据建议逐步关闭，避免与「真实选型演示集」混淆。

---

## 6. 你需要配合的事项

| 时机 | 事项 |
|------|------|
| 步骤 0 前 | 将 6 份 PDF/DOCX 放入 `device-docs/` |
| 步骤 0 | 确认 RDS200 界面类型名称 |
| 步骤 1 后 | 验收档案指标是否与说明书一致 |
| 步骤 2 后 | 提供 1 套演示用 IP/部署位置（若与默认不同） |
| 步骤 7a 前 | 确认大屏弹窗 4 个 tab 与 8 台设备的展示优先级 |
| 步骤 8 前 | 供应商上报接口文档 / 凡双平台 API 说明 |

---

## 7. 相关代码路径速查

| 模块 | 路径 |
|------|------|
| 设备档案 | `src/views/Lad/Device/DeviceArchive*.vue` |
| 设备信息 | `src/views/Lad/Device/DeviceInfo*.vue` |
| 设备组 | `src/views/Lad/Device/DeviceGroupManagement.vue` |
| 运行监控 | `src/views/Lad/Device/DeviceRuntimeMonitor.vue` |
| 数据大屏 | `src/views/Lad/Command/CommandScreen.vue` |
| 原型弹窗 | `public/prototypes/data-screen-03/index.html` → u299/u311 |
| 说明书 | `device-docs/`（仓库根目录） |
