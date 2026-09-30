import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildPlanExecutionPayload,
  deletePlans,
  getPlan,
  listPlanOptions,
  queryPlanList,
  savePlan,
  simulatePlan,
  togglePlanEnabled
} from '../src/api/lad/plan/planStore'
import { normalizeMaxDisposalSeconds } from '../src/api/lad/plan/planSafety'

test('旧预案补齐安全时长，保留已有明确时长', () => {
  assert.equal(getPlan('plan-001')?.maxDisposalSeconds, 30)
  assert.equal(getPlan('plan-008')?.maxDisposalSeconds, 60)
  assert.equal(getPlan('plan-010')?.maxDisposalSeconds, 45)
  assert.equal(normalizeMaxDisposalSeconds(undefined), 30)
  assert.equal(normalizeMaxDisposalSeconds(0), 30)
})

test('新增、编辑、读取、模拟及执行参数保留两种处置模式的安全时长', () => {
  const original = getPlan('plan-001')!
  for (const disposalMode of ['auto', 'manual'] as const) {
    const saved = savePlan({
      ...original,
      disposalMode,
      manualResponseSeconds: disposalMode === 'auto' ? 0 : 10,
      maxDisposalSeconds: disposalMode === 'auto' ? 17 : 23,
      priority: 999,
      threatLevel: '全部',
      triggerRules: [
        {
          ...original.triggerRules[0],
          areaLevel: [],
          weatherConditions: [],
          weatherFactor: '全部'
        }
      ]
    })
    listPlanOptions()
    const listed = queryPlanList({ pageSize: 100 }).list.find((p) => p.id === saved.id)!
    assert.equal(listed.maxDisposalSeconds, saved.maxDisposalSeconds)
    const detail = getPlan(saved.id)!
    assert.equal(detail.maxDisposalSeconds, saved.maxDisposalSeconds)
    assert.equal(detail.disposalMode, disposalMode)
    assert.equal(detail.manualResponseSeconds, 0)
    const simulation = simulatePlan({ threatLevel: '高危' })
    assert.equal(simulation.planCode, saved.planCode)
    assert.equal(simulation.maxDisposalSeconds, saved.maxDisposalSeconds)
    const execution = buildPlanExecutionPayload(detail)
    assert.equal(execution.maxDisposalSeconds, saved.maxDisposalSeconds)
    assert.equal(execution.requiresManualConfirm, disposalMode === 'manual')
  }
  const created = savePlan({
    ...original,
    id: undefined,
    planCode: 'SAFETY-TEST',
    maxDisposalSeconds: 1
  })
  assert.equal(getPlan(created.id)?.maxDisposalSeconds, 1)
  deletePlans([created.id])
  assert.equal(getPlan(created.id), null)
  togglePlanEnabled(original.id, false)
  assert.equal(getPlan(original.id)?.enabled, false)
  deletePlans([original.id])
  assert.equal(getPlan(original.id), null)
  assert.ok(!listPlanOptions().some((p) => p.id === original.id))
})

test('保存入口拒绝缺失、零、负数、小数及非数字时长', () => {
  const original = getPlan('plan-002')!
  for (const value of [
    undefined,
    null,
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    '',
    '30',
    Number.MAX_SAFE_INTEGER + 1
  ]) {
    assert.throws(
      () => savePlan({ ...original, maxDisposalSeconds: value as number }),
      /单次最大处置时长须为大于 0 的整数秒/
    )
  }
  assert.equal(getPlan(original.id)?.maxDisposalSeconds, original.maxDisposalSeconds)
})
