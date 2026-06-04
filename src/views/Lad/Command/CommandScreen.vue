<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LAD_BACKEND_HOME_PATH } from '@/constants/lad'

defineOptions({ name: 'LadDataScreen' })

interface Target {
  id: string
  name: string
  model: string
  tag: string
  severity: 'critical' | 'safe' | 'normal' | 'unknown'
  severityText: string
  time: string
  sn: string
  speed: string
  altitude: string
  distance: string
  targetId: string
  azimuth: string
  pitch: string
  realtimeAzimuthError: string
  realtimePitchError: string
  usedAzimuthError: string
  usedPitchError: string
  coordinate: string
  confidence: string
  trackStatus: string
  source: string
  x: number
  y: number
}

interface Device {
  id: string
  name: string
  shortName: string
  type: 'monitor' | 'counter'
  status: 'running' | 'offline' | 'fault' | 'active'
  statusText: string
  x: number
  y: number
  azimuth: string
  pitch: string
  channel: string
  range: string
  deviceTypeText: string
  deployLocation: string
  code: string
  manufacturer: string
  ip: string
  protocol: string
  controlMode: string
  lockStatus: string
  gpsStatus: string
  lastHeartbeat: string
  linkedTarget: string
  health: string
}

const router = useRouter()

const strategyEnabled = ref(true)
const fusionEnabled = ref(true)
const selectedTargetId = ref('uav-a320-01')
const selectedDeviceId = ref('rf-jam-01')
const targetDetailVisible = ref(false)
const deviceDetailVisible = ref(true)
const activeAction = ref('')
const isEnteringBackend = ref(false)
const disposalActions = ['干扰驱离', '诱导迫降', '打击杀伤', '解除反制']
let disposalTimer: number | undefined
let backendWarmupTimer: number | undefined
let backendEntryPromise: Promise<unknown> | undefined

const targets: Target[] = [
  {
    id: 'uav-a320-01',
    name: '未知无人机 A320',
    model: 'A320',
    tag: '黑名单',
    severity: 'critical',
    severityText: '严重',
    time: '2026.06.01 14:32:08',
    sn: 'SN-A320-9F21',
    speed: '18m/s',
    altitude: '132m',
    distance: '0.82km',
    targetId: '11001011',
    azimuth: '354.073°',
    pitch: '20.896°',
    realtimeAzimuthError: '-376.392°',
    realtimePitchError: '-21.252°',
    usedAzimuthError: '-357.024°',
    usedPitchError: '-1.206°',
    coordinate: 'E116.4012, N39.9180',
    confidence: '92%',
    trackStatus: '光电持续跟踪',
    source: '雷达 + 无线电融合',
    x: 57,
    y: 46
  },
  {
    id: 'uav-a320-02',
    name: '白名单巡检机',
    model: 'A320',
    tag: '白名单',
    severity: 'safe',
    severityText: '安全',
    time: '2026.06.01 14:29:12',
    sn: 'SN-WL-2031',
    speed: '9m/s',
    altitude: '96m',
    distance: '1.46km',
    targetId: 'WL2031007',
    azimuth: '38.642°',
    pitch: '12.408°',
    realtimeAzimuthError: '2.104°',
    realtimePitchError: '0.842°',
    usedAzimuthError: '1.928°',
    usedPitchError: '0.511°',
    coordinate: 'E116.4077, N39.9254',
    confidence: '98%',
    trackStatus: '白名单放行监测',
    source: 'ADS-B + 白名单库',
    x: 70,
    y: 26
  },
  {
    id: 'uav-unknown-03',
    name: '未识别低慢小目标',
    model: '未知',
    tag: '未知',
    severity: 'normal',
    severityText: '一般',
    time: '2026.06.01 14:27:46',
    sn: '待解析',
    speed: '12m/s',
    altitude: '78m',
    distance: '1.92km',
    targetId: 'TEMP-0327',
    azimuth: '86.311°',
    pitch: '9.574°',
    realtimeAzimuthError: '-12.486°',
    realtimePitchError: '-3.218°',
    usedAzimuthError: '-8.031°',
    usedPitchError: '-2.104°',
    coordinate: 'E116.4218, N39.9136',
    confidence: '76%',
    trackStatus: '待复核跟踪',
    source: '无线电侦测',
    x: 82,
    y: 54
  },
  {
    id: 'uav-unknown-04',
    name: '边界徘徊目标',
    model: '四旋翼',
    tag: '未知',
    severity: 'unknown',
    severityText: '关注',
    time: '2026.06.01 14:20:15',
    sn: '待解析',
    speed: '7m/s',
    altitude: '105m',
    distance: '2.31km',
    targetId: 'TEMP-0415',
    azimuth: '302.184°',
    pitch: '15.660°',
    realtimeAzimuthError: '-6.220°',
    realtimePitchError: '1.482°',
    usedAzimuthError: '-5.013°',
    usedPitchError: '0.804°',
    coordinate: 'E116.3849, N39.9291',
    confidence: '69%',
    trackStatus: '边界观察',
    source: '雷达弱目标',
    x: 43,
    y: 23
  }
]

const devices: Device[] = [
  {
    id: 'radar-01',
    name: '北区低空监视雷达',
    shortName: '雷达',
    type: 'monitor',
    status: 'running',
    statusText: '运行',
    x: 45,
    y: 60,
    azimuth: '128°',
    pitch: '18°',
    channel: 'S 波段',
    range: '3.5km',
    deviceTypeText: '监测设备 / 低空监视雷达',
    deployLocation: '北区制高点 A-01',
    code: 'RADAR-N-001',
    manufacturer: '华北雷达研究所',
    ip: '10.18.12.21',
    protocol: 'UDP / ASTERIX',
    controlMode: '自动扫描',
    lockStatus: '未锁定',
    gpsStatus: '正常',
    lastHeartbeat: '14:32:10',
    linkedTarget: '未知无人机 A320',
    health: '96%'
  },
  {
    id: 'eo-01',
    name: '光电跟踪转台 01',
    shortName: '光电',
    type: 'monitor',
    status: 'running',
    statusText: '跟踪',
    x: 53,
    y: 57,
    azimuth: '210°',
    pitch: '30°',
    channel: '可见光/红外',
    range: '2.8km',
    deviceTypeText: '监测设备 / 光电跟踪转台',
    deployLocation: '综合楼楼顶 EO-03',
    code: 'EO-PTZ-003',
    manufacturer: '星海光电',
    ip: '10.18.12.33',
    protocol: 'RTSP / ONVIF',
    controlMode: '自动跟踪',
    lockStatus: '已锁定',
    gpsStatus: '正常',
    lastHeartbeat: '14:32:11',
    linkedTarget: '未知无人机 A320',
    health: '98%'
  },
  {
    id: 'rf-detect-01',
    name: '无线电探测站',
    shortName: '侦测',
    type: 'monitor',
    status: 'running',
    statusText: '运行',
    x: 50,
    y: 45,
    azimuth: '184°',
    pitch: '12°',
    channel: '2.4G/5.8G',
    range: '4.0km',
    deviceTypeText: '监测设备 / 无线电探测',
    deployLocation: '东侧围界 RF-02',
    code: 'RF-DET-002',
    manufacturer: '天穹电子',
    ip: '10.18.12.42',
    protocol: 'TCP / Spectrum',
    controlMode: '频谱巡检',
    lockStatus: '未锁定',
    gpsStatus: '正常',
    lastHeartbeat: '14:32:08',
    linkedTarget: 'A320 频段指纹',
    health: '94%'
  },
  {
    id: 'rf-jam-01',
    name: '无线电干扰设备 01',
    shortName: '干扰',
    type: 'counter',
    status: 'active',
    statusText: '做功',
    x: 58,
    y: 62,
    azimuth: '210°',
    pitch: '30°',
    channel: '定向压制',
    range: '1.6km',
    deviceTypeText: '反制设备 / 无线电干扰',
    deployLocation: '核心区西南侧 J-01',
    code: 'RF-JAM-001',
    manufacturer: '安盾低空',
    ip: '10.18.13.11',
    protocol: 'TCP / 私有控制协议',
    controlMode: '人工打击',
    lockStatus: '未锁定',
    gpsStatus: '正常',
    lastHeartbeat: '14:32:12',
    linkedTarget: '未知无人机 A320',
    health: '91%'
  },
  {
    id: 'laser-01',
    name: '激光打击单元',
    shortName: '激光',
    type: 'counter',
    status: 'offline',
    statusText: '离线',
    x: 61,
    y: 53,
    azimuth: '196°',
    pitch: '24°',
    channel: '近距毁伤',
    range: '1.2km',
    deviceTypeText: '反制设备 / 激光打击',
    deployLocation: '南门机动平台 L-01',
    code: 'LASER-M-001',
    manufacturer: '光盾智能',
    ip: '10.18.13.24',
    protocol: 'TCP / ONVIF',
    controlMode: '待机',
    lockStatus: '未锁定',
    gpsStatus: '正常',
    lastHeartbeat: '14:21:03',
    linkedTarget: '无',
    health: '离线'
  },
  {
    id: 'microwave-01',
    name: '高功率微波打击车',
    shortName: '微波',
    type: 'counter',
    status: 'fault',
    statusText: '故障',
    x: 67,
    y: 58,
    azimuth: '232°',
    pitch: '16°',
    channel: '面域压制',
    range: '1.8km',
    deviceTypeText: '反制设备 / 高功率微波',
    deployLocation: '西区机动点 M-02',
    code: 'HPM-M-002',
    manufacturer: '凌空电磁',
    ip: '10.18.13.37',
    protocol: 'TCP / 私有控制协议',
    controlMode: '禁止发射',
    lockStatus: '未锁定',
    gpsStatus: '异常',
    lastHeartbeat: '14:18:44',
    linkedTarget: '无',
    health: '故障待检'
  }
]

const logs = [
  '【无人机驱离】A320 已进入无线电干扰扇区',
  '【无人机入侵】未登记无人机进入防控区域',
  '【黑名单入侵】黑名单无人机 A320 进入核心管制区',
  '【设备故障】无线电干扰设备 01 完成故障自检',
  '【策略联动】自动处置策略已下发至反制设备'
]

const selectedTarget = computed(() => {
  return targets.find((item) => item.id === selectedTargetId.value) || targets[0]
})

const selectedDevice = computed(() => {
  return devices.find((item) => item.id === selectedDeviceId.value) || devices[0]
})

const criticalCount = computed(() => targets.filter((item) => item.severity === 'critical').length)

function clearDisposalTimer() {
  if (disposalTimer) {
    window.clearTimeout(disposalTimer)
    disposalTimer = undefined
  }
}

function warmBackendEntry() {
  if (!backendEntryPromise) {
    backendEntryPromise = import('@/views/Lad/Incident/HistoryEvent.vue')
  }
  return backendEntryPromise
}

function clearBackendWarmup() {
  if (backendWarmupTimer) {
    window.clearTimeout(backendWarmupTimer)
    backendWarmupTimer = undefined
  }
}

function scheduleBackendWarmup() {
  clearBackendWarmup()
  backendWarmupTimer = window.setTimeout(() => {
    backendWarmupTimer = undefined
    void warmBackendEntry()
  }, 300)
}

async function goBackend() {
  if (isEnteringBackend.value) return

  isEnteringBackend.value = true
  try {
    await Promise.all([warmBackendEntry(), router.push(LAD_BACKEND_HOME_PATH)])
  } finally {
    isEnteringBackend.value = false
  }
}

function selectTarget(id: string) {
  selectedTargetId.value = id
  targetDetailVisible.value = true
}

function selectDevice(id: string) {
  selectedDeviceId.value = id
  deviceDetailVisible.value = true
}

function triggerAction(action: string) {
  clearDisposalTimer()

  if (action === '解除反制') {
    activeAction.value = ''
    targetDetailVisible.value = false
    return
  }

  activeAction.value = action
  disposalTimer = window.setTimeout(() => {
    activeAction.value = ''
    targetDetailVisible.value = false
  }, 10000)
}

onMounted(scheduleBackendWarmup)

onUnmounted(() => {
  clearDisposalTimer()
  clearBackendWarmup()
})
</script>

<template>
  <div class="command-screen">
    <header class="command-header">
      <div>
        <p class="command-header__eyebrow">低空防御综合管控平台</p>
        <h1>指挥控制中心</h1>
      </div>
      <div class="command-header__status">
        <div class="weather">
          <span class="weather__cloud"></span>
          <strong>12:00</strong>
          <span>2026.06.01 星期一</span>
        </div>
        <button
          type="button"
          class="primary-command"
          :disabled="isEnteringBackend"
          @mouseenter="warmBackendEntry"
          @focus="warmBackendEntry"
          @click="goBackend"
        >
          {{ isEnteringBackend ? '正在进入...' : '进入控制台' }}
        </button>
      </div>
    </header>

    <main class="command-layout">
      <aside class="left-rail">
        <section class="panel stat-panel">
          <div class="panel__head">
            <h2>告警架次</h2>
            <button type="button">名单管理</button>
          </div>
          <div class="stat-grid">
            <div>
              <strong>{{ criticalCount }}/{{ targets.length }}</strong>
              <span>今日架/次</span>
            </div>
            <div>
              <strong>18/126</strong>
              <span>本月架/次</span>
            </div>
            <div>
              <strong>42/319</strong>
              <span>合计架/次</span>
            </div>
          </div>
        </section>

        <section class="panel alert-panel">
          <div class="panel__head">
            <h2>告警列表</h2>
            <button type="button">历史事件</button>
          </div>

          <div class="switch-row">
            <span>多源数据融合</span>
            <button
              type="button"
              :class="{ active: fusionEnabled }"
              @click="fusionEnabled = !fusionEnabled"
            >
              {{ fusionEnabled ? '开' : '关' }}
            </button>
            <strong>123</strong>
          </div>
          <div class="switch-row">
            <span>自动化处置</span>
            <button
              type="button"
              :class="{ active: strategyEnabled }"
              @click="strategyEnabled = !strategyEnabled"
            >
              {{ strategyEnabled ? '开' : '关' }}
            </button>
            <strong>123</strong>
          </div>

          <div class="filter-row">
            <span>全部设备</span>
            <span>全部等级</span>
            <span>时间范围</span>
          </div>

          <div class="target-list">
            <article
              v-for="target in targets"
              :key="target.id"
              class="target-card"
              :class="[target.severity, { selected: target.id === selectedTarget.id }]"
              @click="selectTarget(target.id)"
            >
              <div class="target-card__icon">无人机</div>
              <div>
                <div class="target-card__title">
                  <strong>型号：{{ target.model }}</strong>
                  <span>{{ target.tag }}</span>
                </div>
                <p>发现时间：{{ target.time }}</p>
                <div class="target-card__actions">
                  <button type="button">轨迹</button>
                  <button type="button">移出黑名单</button>
                </div>
              </div>
              <b>{{ target.severityText }}</b>
            </article>
          </div>
        </section>

        <section class="panel log-panel">
          <div class="panel__head">
            <h2>日志</h2>
            <button type="button">事件详情</button>
          </div>
          <ul>
            <li v-for="item in logs" :key="item">
              <span>{{ item }}</span>
              <time>2026.06.01 14:32:00</time>
            </li>
          </ul>
        </section>
      </aside>

      <section class="situation-map">
        <div class="map-toolbar">
          <div>
            <strong>地图态势</strong>
            <span>地理环境 / 管制范围 / 监测反制部署 / 无人机航迹</span>
          </div>
          <div class="map-legend">
            <span><i class="monitor"></i>监测设备</span>
            <span><i class="counter"></i>反制设备</span>
            <span><i class="target"></i>入侵目标</span>
          </div>
        </div>

        <div class="map-canvas">
          <div class="terrain terrain--core">核心管制区</div>
          <div class="terrain terrain--warning">预警缓冲区</div>
          <div class="range range--outer"></div>
          <div class="range range--middle"></div>
          <div class="range range--inner"></div>

          <svg
            class="track-layer"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 86 52 C 72 53, 68 43, 57 46" />
            <path class="scan-line" d="M 51 57 L 57 46 L 80 28" />
            <circle cx="57" cy="46" r="1.2" />
          </svg>

          <button
            v-for="device in devices"
            :key="device.id"
            type="button"
            class="map-device"
            :class="[device.type, device.status, { selected: device.id === selectedDevice.id }]"
            :style="{ left: `${device.x}%`, top: `${device.y}%` }"
            @click="selectDevice(device.id)"
          >
            {{ device.shortName }}
          </button>

          <button
            v-for="target in targets"
            :key="target.id"
            type="button"
            class="map-target"
            :class="[target.severity, { selected: target.id === selectedTarget.id }]"
            :style="{ left: `${target.x}%`, top: `${target.y}%` }"
            @click="selectTarget(target.id)"
          >
            无人机
          </button>

          <div
            v-if="targetDetailVisible"
            class="target-detail"
            :style="{ left: `${selectedTarget.x}%`, top: `${selectedTarget.y}%` }"
          >
            <div class="detail-card__head">
              <strong>无人机详情</strong>
              <button type="button" @click="targetDetailVisible = false">×</button>
            </div>
            <dl>
              <dt>基本信息</dt>
              <dd
                ><span>目标ID：</span><strong>{{ selectedTarget.targetId }}</strong></dd
              >
              <dd
                ><span>型号：</span><strong>{{ selectedTarget.model }}</strong></dd
              >
              <dd
                ><span>名单属性：</span><strong>{{ selectedTarget.tag }}</strong></dd
              >
              <dd
                ><span>方位角度：</span><strong>{{ selectedTarget.azimuth }}</strong></dd
              >
              <dd
                ><span>俯仰角度：</span><strong>{{ selectedTarget.pitch }}</strong></dd
              >
              <dd
                ><span>距离：</span><strong>{{ selectedTarget.distance }}</strong></dd
              >
              <dd
                ><span>高度/速度：</span
                ><strong>{{ selectedTarget.altitude }} / {{ selectedTarget.speed }}</strong></dd
              >
              <dd
                ><span>坐标：</span><strong>{{ selectedTarget.coordinate }}</strong></dd
              >
              <dd
                ><span>识别置信度：</span><strong>{{ selectedTarget.confidence }}</strong></dd
              >
              <dd
                ><span>跟踪状态：</span><strong>{{ selectedTarget.trackStatus }}</strong></dd
              >
              <dt>实时偏差</dt>
              <dd
                ><span>方位偏差：</span
                ><strong>{{ selectedTarget.realtimeAzimuthError }}</strong></dd
              >
              <dd
                ><span>俯仰偏差：</span><strong>{{ selectedTarget.realtimePitchError }}</strong></dd
              >
              <dt>使用偏差</dt>
              <dd
                ><span>方位偏差：</span><strong>{{ selectedTarget.usedAzimuthError }}</strong></dd
              >
              <dd
                ><span>俯仰偏差：</span><strong>{{ selectedTarget.usedPitchError }}</strong></dd
              >
              <dd
                ><span>数据来源：</span><strong>{{ selectedTarget.source }}</strong></dd
              >
            </dl>
          </div>
        </div>

        <div class="dispose-dock">
          <button
            v-for="action in disposalActions"
            :key="action"
            type="button"
            :class="{ active: activeAction === action }"
            @click="triggerAction(action)"
          >
            {{ action }}
          </button>
        </div>
      </section>

      <aside class="right-rail">
        <section class="panel optic-panel">
          <div class="panel__head">
            <h2>光电展示</h2>
            <span>{{ selectedTarget.name }}</span>
          </div>
          <div class="optic-feed optic-feed--visible">
            <div class="optic-feed__mountain"></div>
            <span class="optic-feed__sun"></span>
            <b>可见光</b>
            <i></i>
          </div>
          <div class="optic-feed optic-feed--ir">
            <div class="optic-feed__mountain"></div>
            <span class="optic-feed__sun"></span>
            <b>红外</b>
            <i></i>
          </div>
        </section>

        <section class="panel device-panel">
          <div class="panel__head">
            <h2>设备列表</h2>
            <div class="device-legend">
              <span class="running">运行</span>
              <span class="offline">离线</span>
              <span class="fault">故障</span>
              <span class="active">做功</span>
            </div>
          </div>

          <div class="device-grid">
            <button
              v-for="device in devices"
              :key="device.id"
              type="button"
              :class="[device.status, { selected: device.id === selectedDevice.id }]"
              @click="selectDevice(device.id)"
            >
              <span>{{ device.shortName }}</span>
              <i></i>
            </button>
          </div>

          <div v-if="deviceDetailVisible" class="device-detail">
            <div class="detail-card__head">
              <strong>设备信息详情</strong>
              <button type="button" @click="deviceDetailVisible = false">×</button>
            </div>
            <dl>
              <dd
                ><span>设备名称：</span><strong>{{ selectedDevice.name }}</strong></dd
              >
              <dd
                ><span>设备类型：</span><strong>{{ selectedDevice.deviceTypeText }}</strong></dd
              >
              <dd
                ><span>设备编号：</span><strong>{{ selectedDevice.code }}</strong></dd
              >
              <dd
                ><span>部署位置：</span><strong>{{ selectedDevice.deployLocation }}</strong></dd
              >
              <dd
                ><span>生产厂商：</span><strong>{{ selectedDevice.manufacturer }}</strong></dd
              >
              <dd
                ><span>IP 地址：</span><strong>{{ selectedDevice.ip }}</strong></dd
              >
              <dd
                ><span>接入协议：</span><strong>{{ selectedDevice.protocol }}</strong></dd
              >
              <dd
                ><span>运行工况：</span><strong>{{ selectedDevice.statusText }}</strong></dd
              >
              <dd
                ><span>控制模式：</span><strong>{{ selectedDevice.controlMode }}</strong></dd
              >
              <dd
                ><span>锁定状态：</span><strong>{{ selectedDevice.lockStatus }}</strong></dd
              >
              <dd
                ><span>关联目标：</span><strong>{{ selectedDevice.linkedTarget }}</strong></dd
              >
              <dd
                ><span>方位角：</span><strong>{{ selectedDevice.azimuth }}</strong></dd
              >
              <dd
                ><span>俯仰角：</span><strong>{{ selectedDevice.pitch }}</strong></dd
              >
              <dd
                ><span>工作通道：</span><strong>{{ selectedDevice.channel }}</strong></dd
              >
              <dd
                ><span>有效范围：</span><strong>{{ selectedDevice.range }}</strong></dd
              >
              <dd
                ><span>GPS状态：</span><strong>{{ selectedDevice.gpsStatus }}</strong></dd
              >
              <dd
                ><span>心跳时间：</span><strong>{{ selectedDevice.lastHeartbeat }}</strong></dd
              >
              <dd
                ><span>健康度：</span><strong>{{ selectedDevice.health }}</strong></dd
              >
            </dl>
          </div>
          <div v-else class="detail-empty">点击上方设备卡片或地图设备点位查看详情</div>

          <div class="strike-control">
            <button type="button" class="strike-control__power" @click="triggerAction('一键处置')">
              <span></span>
            </button>
            <div>
              <button type="button" class="active" @click="triggerAction('人工打击')"
                >人工打击</button
              >
              <button type="button" @click="triggerAction('锁定打击')">锁定打击</button>
            </div>
          </div>

          <div class="device-tabs">
            <button type="button">控制台</button>
            <button type="button">详情</button>
            <button type="button">操作台</button>
            <button type="button">配置</button>
          </div>
        </section>
      </aside>
    </main>
  </div>
</template>

<style scoped lang="less">
.command-screen {
  --bg: #07131f;
  --panel: rgba(11, 31, 48, 0.86);
  --panel-strong: rgba(18, 45, 67, 0.94);
  --line: rgba(118, 202, 255, 0.28);
  --cyan: #27d6ff;
  --blue: #318dff;
  --green: #43d18b;
  --yellow: #ffc857;
  --red: #ff405c;
  --violet: #8b4dff;
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  color: #d9efff;
  background:
    radial-gradient(circle at 50% 46%, rgba(47, 124, 144, 0.3), transparent 34%),
    linear-gradient(180deg, #0b1d2c 0%, #06111c 100%);
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

button {
  font: inherit;
}

.command-header {
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(90deg, rgba(10, 31, 47, 0.96), rgba(21, 47, 64, 0.78));
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.26);

  h1,
  p {
    margin: 0;
  }

  h1 {
    margin-top: 2px;
    font-size: 28px;
    letter-spacing: 0.08em;
    color: #f4fbff;
  }
}

.command-header__eyebrow {
  font-size: 14px;
  color: #7fd8ff;
}

.command-header__status,
.weather,
.map-toolbar,
.panel__head,
.device-legend,
.device-tabs,
.strike-control,
.target-card__title,
.target-card__actions {
  display: flex;
  align-items: center;
}

.command-header__status {
  gap: 24px;
}

.weather {
  gap: 10px;
  color: #d8e8f7;

  strong {
    font-size: 32px;
    color: #fff;
  }

  span:last-child {
    max-width: 82px;
    line-height: 1.2;
    font-size: 13px;
  }
}

.weather__cloud {
  width: 44px;
  height: 24px;
  display: inline-block;
  border-radius: 22px;
  background: #dcefff;
  box-shadow:
    12px -9px 0 -2px #dcefff,
    25px 1px 0 -6px #dcefff;
}

.primary-command,
.panel__head button,
.switch-row button,
.target-card__actions button,
.device-tabs button,
.strike-control button {
  border: 1px solid rgba(112, 198, 255, 0.35);
  color: #dcf6ff;
  background: rgba(34, 112, 185, 0.42);
  border-radius: 4px;
  cursor: pointer;
}

.primary-command {
  height: 40px;
  padding: 0 26px;
  background: linear-gradient(135deg, #246bff, #18b9ff);
  border-color: rgba(156, 225, 255, 0.68);
  font-weight: 700;

  &:disabled {
    cursor: wait;
    opacity: 0.78;
  }
}

.command-layout {
  height: calc(100vh - 82px);
  min-height: 740px;
  display: grid;
  grid-template-columns: 420px minmax(620px, 1fr) 430px;
  gap: 16px;
  padding: 16px;
}

.left-rail,
.right-rail {
  min-height: 0;
  display: grid;
  gap: 14px;
}

.left-rail {
  grid-template-rows: 174px minmax(330px, 1fr) 230px;
}

.right-rail {
  grid-template-rows: 500px minmax(330px, 1fr);
}

.panel {
  min-width: 0;
  min-height: 0;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow:
    inset 0 0 28px rgba(39, 214, 255, 0.08),
    0 14px 30px rgba(0, 0, 0, 0.22);
}

.panel__head {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  h2 {
    margin: 0;
    font-size: 16px;
    color: #f5fbff;
  }

  button {
    padding: 5px 10px;
    color: #6fd4ff;
    background: transparent;
  }

  span {
    color: #8bb3c8;
    font-size: 12px;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  div {
    height: 104px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(112, 198, 255, 0.25);
    background:
      linear-gradient(135deg, transparent 49%, rgba(112, 198, 255, 0.18) 50%, transparent 51%),
      rgba(255, 255, 255, 0.04);
  }

  strong {
    font-size: 30px;
    color: #fff;
  }

  span {
    font-size: 12px;
    color: #abc4d4;
  }
}

.switch-row {
  display: grid;
  grid-template-columns: 1fr 56px 48px;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 4px;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 6px;

  button {
    height: 24px;
    border-radius: 14px;
    background: rgba(118, 135, 148, 0.42);
  }

  button.active {
    background: #239cff;
  }

  strong {
    text-align: right;
    color: #fff;
  }
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 12px 0;

  span {
    height: 36px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(151, 196, 226, 0.24);
    color: #c9dfed;
    background: rgba(255, 255, 255, 0.04);
    font-size: 12px;
  }
}

.target-list {
  height: calc(100% - 142px);
  overflow: auto;
  padding-right: 5px;
}

.target-card {
  display: grid;
  grid-template-columns: 82px 1fr 44px;
  gap: 12px;
  align-items: center;
  min-height: 86px;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(122, 184, 218, 0.18);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;

  &.selected {
    border-color: rgba(39, 214, 255, 0.75);
    background: rgba(39, 214, 255, 0.1);
  }

  p {
    margin: 6px 0;
    font-size: 12px;
    color: #b8cad6;
  }

  b {
    text-align: right;
    font-size: 13px;
  }

  &.critical b {
    color: var(--red);
  }

  &.safe b {
    color: var(--green);
  }

  &.normal b {
    color: var(--yellow);
  }

  &.unknown b {
    color: #cbd5de;
  }
}

.target-card__icon {
  height: 68px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(190, 226, 248, 0.28);
  color: #dbefff;
  font-size: 12px;
  background:
    linear-gradient(145deg, transparent 48%, rgba(215, 237, 252, 0.25) 50%, transparent 52%),
    rgba(0, 0, 0, 0.16);
}

.target-card__title {
  gap: 8px;

  span {
    padding: 2px 8px;
    border-radius: 12px;
    color: #0b1b26;
    background: #ff7d8b;
    font-size: 12px;
  }
}

.target-card.safe .target-card__title span {
  background: #9ee282;
}

.target-card.normal .target-card__title span,
.target-card.unknown .target-card__title span {
  background: #cbd0d4;
}

.target-card__actions {
  gap: 6px;

  button {
    padding: 2px 8px;
    font-size: 12px;
    background: rgba(24, 156, 255, 0.78);
  }
}

.log-panel ul {
  height: calc(100% - 32px);
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.log-panel li {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #d9e8f2;
  font-size: 12px;

  time {
    display: block;
    margin-top: 4px;
    color: #8ca9ba;
  }
}

.situation-map {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: 58px minmax(0, 1fr) 104px;
  border: 1px solid var(--line);
  background: rgba(8, 23, 35, 0.72);
  position: relative;
  overflow: hidden;
}

.map-toolbar {
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(118, 202, 255, 0.18);

  strong {
    display: block;
    color: #f6fbff;
  }

  span {
    font-size: 12px;
    color: #8fb4c9;
  }
}

.map-legend {
  display: flex;
  gap: 14px;

  i {
    width: 12px;
    height: 8px;
    display: inline-block;
    margin-right: 6px;
  }

  .monitor {
    background: var(--cyan);
  }

  .counter {
    background: var(--violet);
  }

  .target {
    background: var(--red);
  }
}

.map-canvas {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(rgba(70, 164, 197, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(70, 164, 197, 0.09) 1px, transparent 1px),
    radial-gradient(
      circle at 50% 50%,
      rgba(55, 158, 184, 0.16),
      rgba(7, 19, 31, 0.14) 42%,
      transparent 64%
    );
  background-size:
    48px 48px,
    48px 48px,
    cover;
}

.terrain {
  position: absolute;
  display: grid;
  place-items: center;
  color: rgba(255, 214, 220, 0.58);
  font-weight: 700;
}

.terrain--warning {
  left: 21%;
  top: 18%;
  width: 58%;
  height: 62%;
  background: rgba(255, 79, 103, 0.08);
  border: 1px solid rgba(255, 96, 119, 0.18);
}

.terrain--core {
  left: 33%;
  top: 34%;
  width: 34%;
  height: 38%;
  background: rgba(255, 64, 92, 0.17);
  border: 1px solid rgba(255, 64, 92, 0.28);
}

.range {
  position: absolute;
  border: 4px dashed rgba(219, 233, 239, 0.52);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.range--outer {
  left: 52%;
  top: 50%;
  width: 76%;
  aspect-ratio: 1;
}

.range--middle {
  left: 50%;
  top: 55%;
  width: 50%;
  aspect-ratio: 1;
}

.range--inner {
  left: 49%;
  top: 52%;
  width: 38%;
  aspect-ratio: 1;
}

.track-layer {
  position: absolute;
  inset: 0;

  path {
    fill: none;
    stroke: #8d37ff;
    stroke-width: 0.55;
  }

  .scan-line {
    stroke: rgba(190, 219, 231, 0.35);
    stroke-width: 0.25;
  }

  circle {
    fill: #ff405c;
  }
}

.map-device,
.map-target {
  position: absolute;
  width: 52px;
  height: 42px;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(209, 233, 247, 0.46);
  color: #fff;
  background: rgba(10, 25, 35, 0.78);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.map-device.monitor {
  border-color: var(--cyan);
}

.map-device.counter {
  border-color: var(--violet);
}

.map-device.offline {
  opacity: 0.48;
}

.map-device.fault {
  border-color: var(--red);
}

.map-device.selected,
.map-target.selected {
  box-shadow:
    0 0 0 4px rgba(39, 214, 255, 0.16),
    0 0 26px rgba(39, 214, 255, 0.55);
}

.map-target {
  border-color: var(--red);
  color: #fff;
  background: rgba(100, 8, 18, 0.82);
}

.map-target.safe {
  border-color: var(--green);
  background: rgba(16, 75, 52, 0.82);
}

.map-target.normal,
.map-target.unknown {
  border-color: var(--yellow);
  background: rgba(94, 65, 11, 0.82);
}

.target-detail {
  position: absolute;
  width: 292px;
  max-height: 430px;
  padding: 14px 16px;
  overflow: auto;
  transform: translate(28px, -118px);
  border: 1px solid rgba(39, 214, 255, 0.36);
  background: rgba(5, 18, 28, 0.9);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.32);

  dl {
    margin: 0;
  }

  dt {
    margin: 12px 0 6px;
    color: #f4fbff;
    font-weight: 800;
  }

  dd {
    display: grid;
    grid-template-columns: 86px minmax(0, 1fr);
    gap: 8px;
    margin: 0 0 6px;
    color: #b9cfdd;
    font-size: 12px;
  }

  dd strong {
    min-width: 0;
    color: #fff;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
}

.detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  strong {
    color: #f5fbff;
    font-size: 16px;
  }

  button {
    border: 0;
    color: #35a8ff;
    background: transparent;
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
  }
}

.dispose-dock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 36px;
  border-top: 1px solid rgba(118, 202, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);

  button {
    width: 92px;
    height: 72px;
    border: 1px solid rgba(216, 235, 248, 0.34);
    color: #f5fbff;
    background: rgba(25, 36, 48, 0.92);
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
  }

  button.active {
    border-color: var(--cyan);
    background: linear-gradient(135deg, rgba(36, 107, 255, 0.72), rgba(139, 77, 255, 0.7));
  }
}

.optic-panel {
  display: grid;
  grid-template-rows: 32px 1fr 1fr;
  gap: 12px;
}

.optic-feed {
  position: relative;
  overflow: hidden;
  border: 12px solid rgba(220, 232, 239, 0.2);
  background: linear-gradient(180deg, rgba(191, 229, 244, 0.08), rgba(19, 49, 66, 0.42));

  b {
    position: absolute;
    left: 12px;
    top: 10px;
  }

  i {
    position: absolute;
    left: 50%;
    top: 52%;
    width: 54px;
    height: 54px;
    border: 1px solid rgba(255, 255, 255, 0.36);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
}

.optic-feed__mountain {
  position: absolute;
  inset: auto 18px 20px 18px;
  height: 58%;
  clip-path: polygon(0 42%, 24% 16%, 56% 58%, 76% 30%, 100% 58%, 100% 100%, 0 100%);
  background: #27a8d7;
}

.optic-feed__sun {
  position: absolute;
  right: 34%;
  top: 18%;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(233, 241, 246, 0.34);
}

.optic-feed--ir {
  background: linear-gradient(180deg, rgba(61, 18, 30, 0.68), rgba(10, 19, 26, 0.95));

  .optic-feed__mountain {
    background: linear-gradient(90deg, #ffca57, #ff405c);
  }
}

.device-legend {
  gap: 8px;
  font-size: 12px;

  span::before {
    content: '';
    width: 12px;
    height: 8px;
    display: inline-block;
    margin-right: 4px;
  }

  .running::before {
    background: var(--cyan);
  }

  .offline::before {
    background: rgba(255, 255, 255, 0.16);
  }

  .fault::before {
    background: var(--red);
  }

  .active::before {
    background: var(--violet);
  }
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;

  button {
    height: 78px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(208, 232, 246, 0.28);
    color: #e9f8ff;
    background:
      linear-gradient(135deg, transparent 48%, rgba(221, 239, 250, 0.2) 50%, transparent 52%),
      rgba(255, 255, 255, 0.04);
    cursor: pointer;
  }

  i {
    width: 70%;
    height: 8px;
    display: block;
    background: var(--cyan);
  }

  .active i {
    background: var(--violet);
  }

  .offline i {
    background: rgba(255, 255, 255, 0.14);
  }

  .fault i {
    background: var(--red);
  }

  .selected {
    border-color: var(--cyan);
    box-shadow: 0 0 18px rgba(39, 214, 255, 0.26);
  }
}

.device-detail {
  margin: 14px 0;
  padding: 12px 0;
  border-top: 1px solid rgba(205, 228, 240, 0.16);
  border-bottom: 1px solid rgba(205, 228, 240, 0.16);
  max-height: 252px;
  overflow: auto;

  dl {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
  }

  dd {
    display: grid;
    grid-template-columns: 70px minmax(0, 1fr);
    gap: 4px;
    margin: 0;
    font-size: 12px;
    color: #b6cddb;
  }

  strong {
    color: #fff;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
}

.detail-empty {
  height: 164px;
  margin: 14px 0;
  display: grid;
  place-items: center;
  border-top: 1px solid rgba(205, 228, 240, 0.16);
  border-bottom: 1px solid rgba(205, 228, 240, 0.16);
  color: #7f9caf;
  font-size: 13px;
}

.strike-control {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;

  > div {
    display: flex;
    gap: 8px;
  }

  button {
    padding: 8px 12px;
  }

  button.active {
    background: #158ce7;
  }
}

.strike-control__power {
  width: 74px;
  height: 74px;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);

  span {
    width: 42px;
    height: 42px;
    border: 8px solid rgba(246, 251, 255, 0.86);
    border-top-color: transparent;
    border-radius: 50%;
    position: relative;
  }

  span::before {
    content: '';
    position: absolute;
    left: 50%;
    top: -16px;
    width: 8px;
    height: 28px;
    border-radius: 6px;
    background: rgba(246, 251, 255, 0.86);
    transform: translateX(-50%);
  }
}

.device-tabs {
  gap: 8px;

  button {
    flex: 1;
    height: 30px;
    background: rgba(255, 255, 255, 0.04);
  }
}

@media (max-width: 1480px) {
  .command-screen {
    overflow: auto;
  }

  .command-layout {
    min-width: 1360px;
  }
}
</style>
