import type {
  DeviceCommandLogEntry,
  DeviceCommandRequest,
  DeviceCommandResult
} from './types'

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

export function dispatchDeviceCommand(req: DeviceCommandRequest): DeviceCommandResult {
  const dispatchedAt = formatNow()
  const commandId = nextCommandId()
  const channel = req.channel ?? 'supplier'
  const message = buildMessage(req)

  const entry: DeviceCommandLogEntry = {
    ...req,
    id: commandId,
    channel,
    accepted: true,
    message,
    dispatchedAt
  }
  commandLog.unshift(entry)
  if (commandLog.length > 200) commandLog.length = 200

  return {
    accepted: true,
    commandId,
    message,
    channel,
    dispatchedAt
  }
}

export function queryDeviceCommandLog(limit = 50): DeviceCommandLogEntry[] {
  return commandLog.slice(0, limit)
}
