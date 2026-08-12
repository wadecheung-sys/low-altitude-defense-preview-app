/**
 * 081 搜索跟踪雷达对外 UDP 协议。
 *
 * 协议约定：多字节字段高字节在前；长度字段表示整帧字节数；帧尾为
 * 从帧头到正文末尾所有字节累加和的低 16 位。
 */

export const RADAR_PROTOCOL = {
  model: 'RADAR-081',
  transport: 'UDP / IEEE 802.3',
  radarAddress: 0x81,
  superiorAddress: 0x21,
  startFlag: 0xca,
  reportRateHz: 10,
  endpoint: '200.200.10.71:8181',
  superiorEndpoint: '200.168.10.102:10001'
} as const

export const RADAR_MESSAGE_TYPES = {
  0x8a: '系统控制报',
  0x8b: '搜索航迹报',
  0x8c: '跟踪航迹报',
  0x8d: '雷达阵面状态报',
  0x8e: '雷达处理状态报'
} as const

export type RadarMessageType = keyof typeof RADAR_MESSAGE_TYPES

export interface RadarFrame {
  source: number
  destination: number
  length: number
  type: RadarMessageType
  payload: Uint8Array
  checksum: number
  checksumValid: boolean
}

export interface RadarTrackReport {
  messageType: 0x8b | 0x8c
  messageName: '搜索航迹报' | '跟踪航迹报'
  targetId: number
  longitude: number
  latitude: number
  altitudeM: number
  rangeM: number
  azimuthMil: number
  elevationMil: number
  radarLongitude: number
  radarLatitude: number
  radarAltitudeM: number
  hour: number
  minute: number
  millisecond: number
  speedMps: number
  targetTypeCode: number
  targetType: '鸟类' | '无人机' | '不明'
  intensity: number
  extrapolated: boolean
}

export interface RadarArrayStatus {
  arrayNo: number
  mobile: boolean
  searchTrackMode: '搜索' | '跟踪' | '手控' | '搜跟'
  workMode: '常规模式' | '增程模式' | '测试模式' | '无效'
  frequencyPoint: number
  synthesizerFault: boolean
  synthesizerFaultStatus: boolean
  receiverFault: boolean
  arrayPowerFault: boolean
  adBoardFault: boolean
  transmitting: boolean
}

export interface RadarProcessingStatus {
  mobile: boolean
  searchTrackMode: '搜索' | '跟踪' | '手控' | '搜跟'
  workMode: '常规模式' | '增程模式' | '测试模式' | '无效'
  storageBoardFault: boolean
  gpuBoardFault: boolean
  cpuBoardFault: boolean
  interfaceBoardFault: boolean
  networkFault: boolean
  clock10MFault: boolean
  attitudeFault: boolean
  timingFault: boolean
  secondPulseFault: boolean
  panelFiberFaults: boolean[]
  panelTransmitting: boolean[]
  powerFaults: string[]
}

function readU16(bytes: Uint8Array, offset: number) {
  return (bytes[offset]! << 8) | bytes[offset + 1]!
}

function readI16(bytes: Uint8Array, offset: number) {
  const value = readU16(bytes, offset)
  return value & 0x8000 ? value - 0x10000 : value
}

function readI32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getInt32(0, false)
}

export function radarChecksum(bytes: Uint8Array, endExclusive = bytes.length): number {
  let sum = 0
  for (let index = 0; index < endExclusive; index += 1) sum = (sum + bytes[index]!) & 0xffff
  return sum
}

export function parseRadarFrame(bytes: Uint8Array): RadarFrame {
  if (bytes.length < 7) throw new Error('雷达报文长度不足')
  if (bytes[0] !== RADAR_PROTOCOL.startFlag) throw new Error('雷达报文起始标识不是 0xCA')

  const length = bytes[3]!
  if (length !== bytes.length)
    throw new Error(`雷达报文长度不一致：声明 ${length}，实际 ${bytes.length}`)

  const type = bytes[4] as RadarMessageType
  if (!RADAR_MESSAGE_TYPES[type]) throw new Error(`不支持的雷达报文类别 0x${type.toString(16)}`)

  const checksum = readU16(bytes, bytes.length - 2)
  return {
    source: bytes[1]!,
    destination: bytes[2]!,
    length,
    type,
    payload: bytes.slice(5, -2),
    checksum,
    checksumValid: checksum === radarChecksum(bytes, bytes.length - 2)
  }
}

export function encodeRadarFrame(
  type: RadarMessageType,
  payload: Uint8Array,
  source: number = RADAR_PROTOCOL.superiorAddress,
  destination: number = RADAR_PROTOCOL.radarAddress
): Uint8Array {
  const length = payload.length + 7
  if (length > 0xff) throw new Error('雷达报文超过单字节长度字段上限')
  const bytes = new Uint8Array(length)
  bytes.set([RADAR_PROTOCOL.startFlag, source, destination, length, type], 0)
  bytes.set(payload, 5)
  const checksum = radarChecksum(bytes, length - 2)
  bytes[length - 2] = checksum >> 8
  bytes[length - 1] = checksum & 0xff
  return bytes
}

function resolveSearchTrackMode(value: number): RadarArrayStatus['searchTrackMode'] {
  return (['搜索', '跟踪', '手控', '搜跟'] as const)[value & 0x03]
}

function resolveWorkMode(value: number): RadarArrayStatus['workMode'] {
  return (['常规模式', '增程模式', '测试模式'] as const)[value] ?? '无效'
}

export function parseRadarTrack(frame: RadarFrame): RadarTrackReport {
  if (frame.type !== 0x8b && frame.type !== 0x8c) throw new Error('当前报文不是航迹报')
  if (frame.length !== 0x34 || frame.payload.length !== 45) throw new Error('航迹报长度应为 0x34')
  const data = frame.payload
  const targetTypeCode = data[38]!
  return {
    messageType: frame.type,
    messageName: frame.type === 0x8b ? '搜索航迹报' : '跟踪航迹报',
    targetId: readU16(data, 0),
    longitude: readI32(data, 2) / 10_000_000,
    latitude: readI32(data, 6) / 10_000_000,
    altitudeM: readI32(data, 10) / 100,
    rangeM: readU16(data, 14),
    azimuthMil: readU16(data, 16),
    elevationMil: readI16(data, 18),
    radarLongitude: readI32(data, 20) / 10_000_000,
    radarLatitude: readI32(data, 24) / 10_000_000,
    radarAltitudeM: readI32(data, 28) / 100,
    hour: data[32]!,
    minute: data[33]!,
    millisecond: readU16(data, 34),
    speedMps: readU16(data, 36),
    targetTypeCode,
    targetType: targetTypeCode === 0 ? '鸟类' : targetTypeCode === 1 ? '无人机' : '不明',
    intensity: readU16(data, 39),
    extrapolated: data[41] === 0
  }
}

export function parseRadarArrayStatus(frame: RadarFrame): RadarArrayStatus {
  if (frame.type !== 0x8d || frame.length !== 0x18)
    throw new Error('当前报文不是 0x18 字节阵面状态报')
  const data = frame.payload
  return {
    arrayNo: (data[0]! >> 5) & 0x07,
    mobile: Boolean(data[0]! & 0x10),
    searchTrackMode: resolveSearchTrackMode((data[0]! >> 2) & 0x03),
    workMode: resolveWorkMode(data[1]! & 0x0f),
    synthesizerFault: data[2] !== 0,
    frequencyPoint: data[3]! & 0x3f,
    synthesizerFaultStatus: data[4] !== 0,
    receiverFault: data[5] !== 0,
    arrayPowerFault: data[6] !== 0,
    adBoardFault: data[7] !== 0,
    transmitting: data[8] !== 0
  }
}

export function parseRadarProcessingStatus(frame: RadarFrame): RadarProcessingStatus {
  if (frame.type !== 0x8e || frame.length !== 0x1c)
    throw new Error('当前报文不是 0x1C 字节处理状态报')
  const data = frame.payload
  const bit = data[2]!
  const link = data[3]!
  const panel12 = data[4]!
  const panel34 = data[5]!
  const tx = data[6]!
  const power = data[7]!
  return {
    mobile: Boolean(data[0]! & 0x10),
    searchTrackMode: resolveSearchTrackMode((data[0]! >> 2) & 0x03),
    workMode: resolveWorkMode(data[1]! & 0x0f),
    storageBoardFault: Boolean(bit & 0x08),
    gpuBoardFault: Boolean(bit & 0x04),
    cpuBoardFault: Boolean(bit & 0x02),
    interfaceBoardFault: Boolean(bit & 0x01),
    networkFault: Boolean(link & 0x10),
    clock10MFault: Boolean(link & 0x08),
    attitudeFault: Boolean(link & 0x04),
    timingFault: Boolean(link & 0x02),
    secondPulseFault: Boolean(link & 0x01),
    panelFiberFaults: [panel12 >> 4, panel12 & 0x0f, panel34 >> 4, panel34 & 0x0f].map(
      (value) => value !== 0
    ),
    panelTransmitting: [0, 1, 2, 3].map((index) => Boolean(tx & (1 << index))),
    powerFaults: ['220V输入', '数字220V输出', '28V1', '28V2', '28V3', '28V4'].filter((_, index) =>
      Boolean(power & (1 << index))
    )
  }
}
