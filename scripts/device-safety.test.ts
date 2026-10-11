import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  queryDeviceArchiveDetail,
  queryDeviceArchiveList,
  saveDeviceArchiveRecord,
  deleteDeviceArchiveRecords
} from '../src/api/lad/device/archiveStore'
import {
  queryDeviceInfoDetail,
  saveDeviceInfoRecord,
  deleteDeviceInfoRecords
} from '../src/api/lad/device-info/infoStore'
import type { DeviceClass } from '../src/api/lad/device/types'
import {
  buildPlanExecutionPayload,
  getPlan,
  queryPlanList,
  savePlan,
  simulatePlan,
  deletePlans
} from '../src/api/lad/plan/planStore'

test('档案必须明确选择类别，档案自身不再保存时长', () => {
  const original = queryDeviceArchiveDetail('da-10001')!
  for (const value of [undefined, null, '', 'counter', 1]) {
    assert.throws(
      () => saveDeviceArchiveRecord({ ...original, deviceClass: value as DeviceClass }),
      /请选择设备类别/
    )
    assert.equal(queryDeviceArchiveDetail(original.id)?.deviceClass, 'countermeasure')
  }
  for (const deviceClass of ['detection', 'countermeasure'] as const) {
    const row = saveDeviceArchiveRecord({ ...original, id: undefined, deviceClass })
    const saved = queryDeviceArchiveDetail(row.id)!
    assert.equal(saved.deviceClass, deviceClass)
    assert.equal(Object.hasOwn(saved, 'maxDisposalSeconds'), false)
    assert.equal(
      queryDeviceArchiveList({ pageSize: 100 }).list.find((item) => item.id === row.id)
        ?.deviceClass,
      deviceClass
    )
    deleteDeviceArchiveRecords([row.id])
  }
})

test('已有示例初始化分类，时长只属于单台反制设备', () => {
  for (const deviceType of ['强光驱离', '无线电干扰', '导航诱骗', '高功率微波', '激光打击']) {
    const rows = queryDeviceArchiveList({ deviceType, pageSize: 100 }).list
    assert.ok(rows.length > 0)
    assert.ok(rows.every((row) => row.deviceClass === 'countermeasure'))
  }
  assert.equal(queryDeviceInfoDetail('di-10001')?.maxDisposalSeconds, 30)
  assert.equal(Object.hasOwn(queryDeviceInfoDetail('di-10002')!, 'maxDisposalSeconds'), false)
})

test('同一档案下不同设备分别保存时长，编辑回显不互相覆盖', () => {
  const original = queryDeviceInfoDetail('di-10001')!
  const first = saveDeviceInfoRecord({ ...original, id: undefined, maxDisposalSeconds: 17 })
  const second = saveDeviceInfoRecord({ ...original, id: undefined, maxDisposalSeconds: 23 })
  saveDeviceInfoRecord({ ...original, id: first.id, maxDisposalSeconds: 47 })
  assert.equal(queryDeviceInfoDetail(first.id)?.maxDisposalSeconds, 47)
  assert.equal(queryDeviceInfoDetail(second.id)?.maxDisposalSeconds, 23)
  assert.equal(
    Object.hasOwn(queryDeviceArchiveDetail(original.archiveId!)!, 'maxDisposalSeconds'),
    false
  )
  deleteDeviceInfoRecords([first.id, second.id])
})

test('反制设备保存严格校验时长，失败不修改设备；档案缺失不能绕过校验', () => {
  const original = queryDeviceInfoDetail('di-10001')!
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
      () => saveDeviceInfoRecord({ ...original, maxDisposalSeconds: value as number }),
      /单次最大处置时长须为大于 0 的整数秒/
    )
    assert.equal(
      queryDeviceInfoDetail(original.id)?.maxDisposalSeconds,
      original.maxDisposalSeconds
    )
  }
  for (const archiveId of [undefined, '', 'deleted-archive']) {
    assert.throws(() => saveDeviceInfoRecord({ ...original, archiveId }), /请选择有效的基础档案/)
  }
})

test('级联依据档案显式类别，切换侦测档案清理时长且不能从设备类型绕过校验', () => {
  const original = queryDeviceInfoDetail('di-10001')!
  const archive = saveDeviceArchiveRecord({
    ...queryDeviceArchiveDetail('da-10001')!,
    id: undefined,
    deviceClass: 'detection'
  })
  const device = saveDeviceInfoRecord({
    ...original,
    id: undefined,
    archiveId: archive.id,
    maxDisposalSeconds: 17
  })
  assert.equal(Object.hasOwn(queryDeviceInfoDetail(device.id)!, 'maxDisposalSeconds'), false)
  // 同一设备类型改为反制类别后，必须补填该设备时长。
  saveDeviceArchiveRecord({
    ...queryDeviceArchiveDetail(archive.id)!,
    deviceClass: 'countermeasure'
  })
  const reclassified = queryDeviceInfoDetail(device.id)!
  assert.equal(reclassified.linkedArchive?.deviceClass, 'countermeasure')
  assert.equal(reclassified.maxDisposalSeconds, undefined)
  assert.throws(
    () => saveDeviceInfoRecord({ ...reclassified, deviceType: '雷达' }),
    /单次最大处置时长/
  )
  saveDeviceInfoRecord({ ...reclassified, maxDisposalSeconds: 19 })
  assert.equal(queryDeviceInfoDetail(device.id)?.maxDisposalSeconds, 19)
  saveDeviceInfoRecord({ ...reclassified, archiveId: 'da-10003', maxDisposalSeconds: 19 })
  assert.equal(Object.hasOwn(queryDeviceInfoDetail(device.id)!, 'maxDisposalSeconds'), false)
  assert.throws(
    () => saveDeviceInfoRecord({ ...queryDeviceInfoDetail(device.id)!, archiveId: archive.id }),
    /单次最大处置时长/
  )
  deleteDeviceInfoRecords([device.id])
  deleteDeviceArchiveRecords([archive.id])
})

test('两种预案模式均无需时长，列表、详情、模拟及执行参数不再携带旧字段', () => {
  const original = getPlan('plan-001')!
  for (const disposalMode of ['auto', 'manual'] as const) {
    const saved = savePlan({
      ...original,
      id: undefined,
      planCode: `ARCHIVE-SAFETY-${disposalMode}`,
      disposalMode,
      priority: 999,
      threatLevel: '全部',
      triggerRules: [
        { ...original.triggerRules[0], areaLevel: [], weatherConditions: [], weatherFactor: '全部' }
      ]
    })
    const detail = getPlan(saved.id)!
    const simulation = simulatePlan({ threatLevel: '高危' })
    assert.equal(simulation.planCode, saved.planCode)
    const execution = buildPlanExecutionPayload(detail)
    assert.equal(execution.requiresManualConfirm, disposalMode === 'manual')
    for (const result of [
      saved,
      detail,
      simulation,
      execution,
      ...queryPlanList({ pageSize: 100 }).list
    ]) {
      assert.equal(Object.hasOwn(result, 'maxDisposalSeconds'), false)
    }
    deletePlans([saved.id])
  }
})
