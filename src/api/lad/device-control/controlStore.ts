import type { DeviceCommandLogEntry, DeviceCommandRequest, DeviceCommandResult } from './types'
import { isDemoExecutableDeviceModel } from '@/constants/deviceCatalog'

const commandLog: DeviceCommandLogEntry[] = []

let commandSeq = 0

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function nextCommandId() {
  commandSeq += 1
  return `cmd-${Date.now()}-${commandSeq}`
}

function buildMessage(req: DeviceCommandRequest): string {
  const name = req.deviceName || req.deviceModel || req.deviceRecordId
  return `指令「${req.actionLabel}」已提交至供应商上报链路，目标：${name}`
}

function buildPrecheckMessage(req: DeviceCommandRequest): string {
  const name = req.deviceName || req.deviceModel || req.deviceRecordId
  return `设备「${name}」指令预检未通过，请检查设备链路与安全联锁状态`
}

export function dispatchDeviceCommand(req: DeviceCommandRequest): DeviceCommandResult {
  const dispatchedAt = formatNow()
  const commandId = nextCommandId()
  const channel = req.channel ?? 'supplier'
  const accepted = isDemoExecutableDeviceModel(req.deviceModel)
  const status = accepted ? 'accepted' : 'precheck_failed'
  const message = accepted ? buildMessage(req) : buildPrecheckMessage(req)

  const entry: DeviceCommandLogEntry = {
    ...req,
    id: commandId,
    channel,
    accepted,
    status,
    message,
    dispatchedAt
  }
  commandLog.unshift(entry)
  if (commandLog.length > 200) commandLog.length = 200

  return {
    accepted,
    commandId,
    status,
    message,
    channel,
    dispatchedAt
  }
}

export function queryDeviceCommandLog(limit = 50): DeviceCommandLogEntry[] {
  return commandLog.slice(0, limit)
}
