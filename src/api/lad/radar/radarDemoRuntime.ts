import type { DeviceRuntimeMetric, RadarRuntimeProtocol } from '../device-monitor/types'
import {
  RADAR_PROTOCOL,
  encodeRadarFrame,
  parseRadarArrayStatus,
  parseRadarFrame,
  parseRadarProcessingStatus,
  parseRadarTrack
} from './radarProtocol'

function setU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, false)
}

function setI16(view: DataView, offset: number, value: number) {
  view.setInt16(offset, value, false)
}

function setI32(view: DataView, offset: number, value: number) {
  view.setInt32(offset, value, false)
}

function metric(
  key: string,
  label: string,
  value: string | number,
  unit?: string,
  level: DeviceRuntimeMetric['level'] = 'normal'
): DeviceRuntimeMetric {
  return { key, label, value, unit, level }
}

export function buildRadarDemoRuntime(
  seed: number,
  tick: number
): {
  workStatus: string
  workMode: string
  metrics: DeviceRuntimeMetric[]
  radar: RadarRuntimeProtocol
} {
  const offset = seed + tick
  const messageType = offset % 4 === 0 ? 0x8b : 0x8c
  const targetId = (offset % 1024) + 1
  const longitude = 116.397128 + (offset % 13) * 0.000012
  const latitude = 39.916527 + (offset % 9) * 0.00001

  const trackPayload = new Uint8Array(45)
  const trackView = new DataView(trackPayload.buffer)
  setU16(trackView, 0, targetId)
  setI32(trackView, 2, Math.round(longitude * 10_000_000))
  setI32(trackView, 6, Math.round(latitude * 10_000_000))
  setI32(trackView, 10, (118 + (offset % 35)) * 100)
  setU16(trackView, 14, 3200 + (offset % 1600))
  setU16(trackView, 16, 1200 + (offset % 900))
  setI16(trackView, 18, 85 + (offset % 80))
  setI32(trackView, 20, Math.round(116.397128 * 10_000_000))
  setI32(trackView, 24, Math.round(39.916527 * 10_000_000))
  setI32(trackView, 28, 6200)
  trackPayload[32] = new Date().getHours()
  trackPayload[33] = new Date().getMinutes()
  setU16(trackView, 34, new Date().getMilliseconds())
  setU16(trackView, 36, 18 + (offset % 14))
  trackPayload[38] = offset % 5 === 0 ? 0 : 1
  setU16(trackView, 39, 46 + (offset % 25))
  trackPayload[41] = offset % 7 === 0 ? 0 : 1

  const trackFrame = parseRadarFrame(encodeRadarFrame(messageType, trackPayload, 0x81, 0x21))
  const track = parseRadarTrack(trackFrame)

  const arrayPayload = new Uint8Array(17)
  arrayPayload.set([0b00101100, 0x00, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x00, 0x01])
  const arrayStatus = parseRadarArrayStatus(
    parseRadarFrame(encodeRadarFrame(0x8d, arrayPayload, 0x81, 0x21))
  )

  const processingPayload = new Uint8Array(21)
  processingPayload.set([0b00001100, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0f, 0x00])
  const processingStatus = parseRadarProcessingStatus(
    parseRadarFrame(encodeRadarFrame(0x8e, processingPayload, 0x81, 0x21))
  )

  const boardFault =
    processingStatus.storageBoardFault ||
    processingStatus.gpuBoardFault ||
    processingStatus.cpuBoardFault ||
    processingStatus.interfaceBoardFault
  const interfaceFault =
    processingStatus.networkFault ||
    processingStatus.clock10MFault ||
    processingStatus.attitudeFault ||
    processingStatus.timingFault ||
    processingStatus.secondPulseFault

  return {
    workStatus: arrayStatus.transmitting ? '搜跟运行' : '接收待机',
    workMode: `${arrayStatus.searchTrackMode} · ${arrayStatus.workMode}`,
    metrics: [
      metric('connection', 'UDP链路', '在线', undefined, 'normal'),
      metric(
        'work_status',
        '工作状态',
        arrayStatus.transmitting ? '搜跟运行' : '接收待机',
        undefined,
        'running'
      ),
      metric(
        'report_type',
        '最新报文',
        `0x${track.messageType.toString(16).toUpperCase()} ${track.messageName}`
      ),
      metric('target_id', '目标批次号', track.targetId),
      metric('target_type', '目标类型', track.targetType),
      metric('target_range', '目标距离', track.rangeM, 'm'),
      metric('target_speed', '目标速度', track.speedMps, 'm/s'),
      metric(
        'target_position',
        '目标经纬度',
        `${track.longitude.toFixed(7)}, ${track.latitude.toFixed(7)}`
      ),
      metric('target_altitude', '目标海拔', track.altitudeM.toFixed(2), 'm'),
      metric('frequency_point', '当前频点', `F${arrayStatus.frequencyPoint || 11}`),
      metric(
        'transmit',
        '阵面发射',
        arrayStatus.transmitting ? '开启' : '关闭',
        undefined,
        arrayStatus.transmitting ? 'running' : 'normal'
      ),
      metric(
        'checksum',
        '报文校验',
        trackFrame.checksumValid ? '16位累加和通过' : '校验失败',
        undefined,
        trackFrame.checksumValid ? 'normal' : 'fault'
      )
    ],
    radar: {
      transport: RADAR_PROTOCOL.transport,
      endpoint: RADAR_PROTOCOL.endpoint,
      reportRateHz: RADAR_PROTOCOL.reportRateHz,
      sourceAddress: '0x81',
      destinationAddress: '0x21',
      lastMessageType: `0x${track.messageType.toString(16).toUpperCase()}` as '0x8B' | '0x8C',
      checksumValid: trackFrame.checksumValid,
      track: {
        messageType: `0x${track.messageType.toString(16).toUpperCase()}` as '0x8B' | '0x8C',
        messageName: track.messageName,
        targetId: track.targetId,
        targetType: track.targetType,
        longitude: track.longitude,
        latitude: track.latitude,
        altitudeM: track.altitudeM,
        rangeM: track.rangeM,
        azimuthMil: track.azimuthMil,
        elevationMil: track.elevationMil,
        speedMps: track.speedMps,
        intensity: track.intensity,
        pointKind: track.extrapolated ? '外推点' : '真实点'
      },
      health: [
        {
          label: '阵面组件',
          normal:
            !arrayStatus.synthesizerFaultStatus &&
            !arrayStatus.receiverFault &&
            !arrayStatus.arrayPowerFault &&
            !arrayStatus.adBoardFault,
          detail: '频综 / 接收机 / 阵面电源 / AD采集板'
        },
        { label: '处理板卡', normal: !boardFault, detail: '存储板 / GPU板 / CPU板 / 接口板' },
        {
          label: '外部接口',
          normal: !interfaceFault,
          detail: '网络 / 10M时钟 / 姿态 / 授时 / 秒脉冲'
        },
        {
          label: '阵面光纤',
          normal: processingStatus.panelFiberFaults.every((fault) => !fault),
          detail: '阵面1～4光纤链路'
        },
        {
          label: '电源箱',
          normal: processingStatus.powerFaults.length === 0,
          detail: processingStatus.powerFaults.length
            ? processingStatus.powerFaults.join('、')
            : '220V输入及28V1～4正常'
        }
      ]
    }
  }
}
