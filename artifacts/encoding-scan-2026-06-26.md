# 中文文案扫描报告

- 扫描时间：2026-06-26
- 范围：`preview-app/src/**`、`mock/**`、`types/**`（ts/vue/tsx/json/md）
- 方法：mojibake 特征（璇/鍐/锟/� 等）+ Latin-1 混入检测

## 结论

**未发现新的乱码字符串。**

## 已修复（本轮瘦身）

| 文件 | 原问题 | 修复 |
|------|--------|------|
| `src/views/Lad/Plan/components/PlanFormDialog.vue` | `璇峰～鍐欓...` | `请填写预案编号与名称` |

## 已抽查正常

- `src/router/ladRoutes.ts` — 路由 title 中文正常
- `src/router/ladRouteMeta.ts` — phaseNote 中文正常
- `src/api/lad/auth/permissionSeed.ts` — 权限名称正常
- `src/locales/zh-CN.ts` — 无 mojibake

## 建议

- 提交前保持 `.gitattributes`（LF），避免 CRLF 假 diff
- 业务迭代后可用同样规则定期复扫
