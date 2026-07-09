export type DataScreenLinkageBridgeCleanup = () => void

type PanelMode = 'axure' | 'dynamic'

interface LinkageTabConfig {
  tabId: string
  label: string
  panel: { mode: PanelMode; stateIndex?: number; key?: string }
}

interface ToggleField {
  type: 'toggle'
  label: string
  group: string
  options: string[]
  defaultIndex?: number
}

interface StepperField {
  type: 'stepper'
  label: string
  value: string
  unit?: string
  step?: number
  min?: number
  max?: number
}

interface ReadonlyField {
  type: 'readonly'
  label: string
  value: string
  unit?: string
}

interface ActionField {
  type: 'action'
  label: string
  actions: string[]
}

type PanelField = ToggleField | StepperField | ReadonlyField | ActionField

interface DynamicPanelSection {
  title: string
  fields: PanelField[]
}

interface DynamicPanelDefinition {
  sections: DynamicPanelSection[]
}

const AXURE_PANEL_STATES = ['u444_state0', 'u444_state1', 'u444_state2', 'u444_state3']
const DYNAMIC_PANEL_ID = 'lad-linkage-dynamic-panel'
const TAB_GROUP = '0324-1'

const LINKAGE_TABS: LinkageTabConfig[] = [
  { tabId: 'u442', label: '核心区光电跟踪转台', panel: { mode: 'axure', stateIndex: 0 } },
  { tabId: 'u441', label: '东侧低空警戒雷达', panel: { mode: 'axure', stateIndex: 3 } },
  { tabId: 'u708', label: '东侧频谱侦测-PL671F', panel: { mode: 'dynamic', key: 'pl671f' } },
  { tabId: 'u709', label: '北侧Remote-ID监视-RDS200', panel: { mode: 'dynamic', key: 'rds200' } },
  { tabId: 'u713', label: '塔台ADS-B补盲-EXD55-LS', panel: { mode: 'dynamic', key: 'exd55' } },
  { tabId: 'u710', label: '核心区转台压制-FG310F', panel: { mode: 'dynamic', key: 'fg310f' } },
  { tabId: 'u711', label: '西区导航诱骗-DY506F', panel: { mode: 'dynamic', key: 'dy506f' } },
  { tabId: 'u683', label: '核心区高功率微波-WB01', panel: { mode: 'axure', stateIndex: 1 } },
  { tabId: 'u443', label: '西区激光反制站-JG01', panel: { mode: 'axure', stateIndex: 2 } },
  { tabId: 'u712', label: '入口区声光驱离站-SG01', panel: { mode: 'dynamic', key: 'sg01' } }
]

const DYNAMIC_PANELS: Record<string, DynamicPanelDefinition> = {
  pl671f: {
    sections: [
      {
        title: '侦测控制',
        fields: [
          {
            type: 'toggle',
            label: '侦测灵敏度',
            group: 'pl-sensitivity',
            options: ['低', '中', '高'],
            defaultIndex: 1
          },
          { type: 'stepper', label: '上报周期', value: '5', unit: 's', step: 1, min: 1, max: 60 },
          {
            type: 'toggle',
            label: '自动上报',
            group: 'pl-report',
            options: ['开', '关'],
            defaultIndex: 0
          }
        ]
      },
      {
        title: '实时监测',
        fields: [
          { type: 'readonly', label: '侦测目标数', value: '6', unit: '架' },
          { type: 'readonly', label: '最近识别', value: 'DJI Mini 3 Pro' },
          { type: 'readonly', label: '主频点', value: '2437', unit: 'MHz' },
          {
            type: 'toggle',
            label: '联动压制',
            group: 'pl-link',
            options: ['开', '关'],
            defaultIndex: 0
          }
        ]
      }
    ]
  },
  rds200: {
    sections: [
      {
        title: 'Remote-ID 监测',
        fields: [
          { type: 'readonly', label: 'RID 目标数', value: '4', unit: '架' },
          { type: 'readonly', label: '最近 Remote-ID', value: '1581F45TB23A0023' },
          {
            type: 'toggle',
            label: '刷新策略',
            group: 'rid-refresh',
            options: ['实时', '节能'],
            defaultIndex: 0
          }
        ]
      },
      {
        title: '转台状态',
        fields: [
          { type: 'readonly', label: '转台方位角', value: '184.75', unit: '°' },
          { type: 'readonly', label: '转台俯仰角', value: '12.35', unit: '°' },
          {
            type: 'toggle',
            label: '自动跟踪',
            group: 'rid-track',
            options: ['开', '关'],
            defaultIndex: 0
          }
        ]
      }
    ]
  },
  exd55: {
    sections: [
      {
        title: 'ADS-B 接收',
        fields: [
          { type: 'readonly', label: '1090ES 报文', value: '12', unit: '条/min' },
          { type: 'readonly', label: 'UAT978 报文', value: '3', unit: '条/min' },
          {
            type: 'toggle',
            label: '输出格式',
            group: 'ads-output',
            options: ['JSON', '明文'],
            defaultIndex: 0
          }
        ]
      },
      {
        title: '过滤配置',
        fields: [
          { type: 'stepper', label: '高度下限', value: '120', unit: 'm', step: 10, min: 0, max: 3000 },
          { type: 'stepper', label: '距离上限', value: '250', unit: 'km', step: 5, min: 10, max: 250 },
          {
            type: 'toggle',
            label: '异常轨迹标注',
            group: 'ads-mark',
            options: ['开', '关'],
            defaultIndex: 0
          }
        ]
      }
    ]
  },
  fg310f: {
    sections: [
      {
        title: '压制控制',
        fields: [
          { type: 'readonly', label: '当前频段', value: '2400-2485', unit: 'MHz' },
          {
            type: 'toggle',
            label: '联动模式',
            group: 'jam-link',
            options: ['自动', '手动'],
            defaultIndex: 0
          },
          { type: 'stepper', label: '转台方位角', value: '184.75', unit: '°', step: 0.1, min: 0, max: 360 },
          { type: 'stepper', label: '转台俯仰角', value: '12.35', unit: '°', step: 0.1, min: -10, max: 60 }
        ]
      },
      {
        title: '压制操作',
        fields: [
          { type: 'readonly', label: '锁定目标', value: 'T-0726-01' },
          { type: 'readonly', label: '压制状态', value: '待机' },
          { type: 'action', label: '指令下发', actions: ['开启压制', '停止压制'] }
        ]
      }
    ]
  },
  dy506f: {
    sections: [
      {
        title: '诱骗控制',
        fields: [
          {
            type: 'toggle',
            label: '诱骗模式',
            group: 'spoof-mode',
            options: ['驱离', '迫降', '禁飞'],
            defaultIndex: 0
          },
          {
            type: 'toggle',
            label: '发射功率',
            group: 'spoof-power',
            options: ['低', '中', '高'],
            defaultIndex: 1
          },
          { type: 'readonly', label: '锁定目标', value: 'T-0726-01' }
        ]
      },
      {
        title: '发射操作',
        fields: [
          { type: 'readonly', label: '发射状态', value: '关闭' },
          { type: 'readonly', label: '有效防御距离', value: '820', unit: 'm' },
          { type: 'action', label: '指令下发', actions: ['开启诱骗', '停止发射'] }
        ]
      }
    ]
  },
  sg01: {
    sections: [
      {
        title: '声光控制',
        fields: [
          {
            type: 'toggle',
            label: '警示等级',
            group: 'sla-level',
            options: ['低', '中', '高'],
            defaultIndex: 1
          },
          {
            type: 'toggle',
            label: '音量档位',
            group: 'sla-volume',
            options: ['低', '中', '高'],
            defaultIndex: 1
          },
          {
            type: 'toggle',
            label: '灯光模式',
            group: 'sla-light',
            options: ['常亮', '频闪'],
            defaultIndex: 1
          }
        ]
      },
      {
        title: '联动处置',
        fields: [
          { type: 'readonly', label: '锁定目标', value: 'T-0726-01' },
          { type: 'readonly', label: '声光状态', value: '待命' },
          {
            type: 'toggle',
            label: '告警自动触发',
            group: 'sla-auto',
            options: ['开', '关'],
            defaultIndex: 0
          },
          { type: 'action', label: '指令下发', actions: ['启动声光', '停止警示'] }
        ]
      }
    ]
  }
}

const STYLE_ID = 'lad-linkage-panel-style'

function injectPanelStyles(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${DYNAMIC_PANEL_ID} {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 2;
      width: 666px;
      height: 757px;
      overflow: auto;
      box-sizing: border-box;
      font-family: "微软雅黑", "PingFang SC", sans-serif;
      color: #303133;
      background: linear-gradient(180deg, #fafbfc 0%, #ffffff 48%);
      scrollbar-width: thin;
      scrollbar-color: #c0c4cc transparent;
    }
    #${DYNAMIC_PANEL_ID}::-webkit-scrollbar { width: 6px; }
    #${DYNAMIC_PANEL_ID}::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 999px;
    }
    .lad-link-panel {
      min-height: 100%;
      padding: 14px 16px 18px;
      box-sizing: border-box;
    }
    .lad-link-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ebeef5;
    }
    .lad-link-panel__title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.4;
      color: #1f2d3d;
    }
    .lad-link-panel__badge {
      flex-shrink: 0;
      padding: 4px 10px;
      font-size: 12px;
      line-height: 1;
      color: #008fe0;
      background: rgba(0, 143, 224, 0.08);
      border: 1px solid rgba(0, 143, 224, 0.18);
      border-radius: 999px;
    }
    .lad-link-panel__body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .lad-link-section {
      padding: 14px 14px 12px;
      background: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .lad-link-section__title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 700;
      color: #303133;
    }
    .lad-link-section__title::before {
      content: "";
      width: 3px;
      height: 14px;
      background: #008fe0;
      border-radius: 999px;
    }
    .lad-link-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 18px;
    }
    .lad-link-field {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .lad-link-field--full {
      grid-column: 1 / -1;
    }
    .lad-link-field__label {
      font-size: 13px;
      line-height: 1.4;
      color: #606266;
    }
    .lad-link-readonly {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 40px;
      padding: 0 12px;
      background: #f5f7fa;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
    }
    .lad-link-readonly__value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-size: 14px;
      font-weight: 600;
      color: #008fe0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lad-link-readonly__value.is-text {
      font-weight: 500;
      color: #303133;
    }
    .lad-link-readonly__value.is-status {
      font-weight: 600;
      color: #67c23a;
    }
    .lad-link-readonly__unit {
      flex-shrink: 0;
      font-size: 12px;
      color: #909399;
    }
    .lad-link-toggle {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .lad-link-toggle__btn {
      min-width: 64px;
      height: 36px;
      padding: 0 14px;
      font-size: 13px;
      color: #606266;
      background: #fff;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .lad-link-toggle__btn:hover {
      color: #008fe0;
      border-color: #02a7f0;
      background: rgba(0, 143, 224, 0.04);
    }
    .lad-link-toggle__btn.is-active {
      color: #fff;
      background: #008fe0;
      border-color: #008fe0;
      box-shadow: 0 2px 6px rgba(0, 143, 224, 0.24);
    }
    .lad-link-stepper-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .lad-link-stepper {
      display: flex;
      flex: 1;
      min-width: 0;
      max-width: 240px;
      overflow: hidden;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      background: #fff;
    }
    .lad-link-stepper__btn {
      width: 40px;
      height: 40px;
      font-size: 18px;
      line-height: 1;
      color: #606266;
      background: #f2f2f2;
      border: 0;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease;
    }
    .lad-link-stepper__btn:hover {
      color: #008fe0;
      background: #e8f4fc;
    }
    .lad-link-stepper__input {
      flex: 1;
      width: 100%;
      min-width: 0;
      height: 40px;
      padding: 0 8px;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      color: #303133;
      border: 0;
      border-left: 1px solid #e4e7ed;
      border-right: 1px solid #e4e7ed;
      background: #fff;
      box-sizing: border-box;
    }
    .lad-link-stepper__input:focus {
      outline: none;
      background: #fafcff;
    }
    .lad-link-stepper__unit {
      flex-shrink: 0;
      font-size: 13px;
      color: #909399;
    }
    .lad-link-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .lad-link-actions__btn {
      min-width: 108px;
      height: 38px;
      padding: 0 16px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      background: linear-gradient(180deg, #0096eb 0%, #008fe0 100%);
      border: 0;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 143, 224, 0.22);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .lad-link-actions__btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0, 143, 224, 0.28);
    }
    .lad-link-actions__btn.is-secondary {
      color: #606266;
      background: #fff;
      border: 1px solid #dcdfe6;
      box-shadow: none;
    }
    .lad-link-actions__btn.is-secondary:hover {
      color: #008fe0;
      border-color: #02a7f0;
      background: rgba(0, 143, 224, 0.04);
      transform: none;
      box-shadow: none;
    }
  `
  doc.head.appendChild(style)
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderToggle(field: ToggleField) {
  const buttons = field.options
    .map((option, index) => {
      const active = index === (field.defaultIndex ?? 0) ? ' is-active' : ''
      return `<button type="button" class="lad-link-toggle__btn${active}" data-group="${escapeHtml(field.group)}" data-value="${escapeHtml(option)}">${escapeHtml(option)}</button>`
    })
    .join('')
  return `<div class="lad-link-toggle" data-toggle-group="${escapeHtml(field.group)}">${buttons}</div>`
}

function renderStepper(field: StepperField) {
  const unit = field.unit
    ? `<span class="lad-link-stepper__unit">${escapeHtml(field.unit)}</span>`
    : ''
  return `
    <div class="lad-link-stepper-wrap">
      <div class="lad-link-stepper" data-stepper data-step="${field.step ?? 1}" data-min="${field.min ?? ''}" data-max="${field.max ?? ''}">
        <button type="button" class="lad-link-stepper__btn" data-stepper-op="-">-</button>
        <input class="lad-link-stepper__input" type="text" value="${escapeHtml(field.value)}" />
        <button type="button" class="lad-link-stepper__btn" data-stepper-op="+">+</button>
      </div>
      ${unit}
    </div>
  `
}

function readonlyValueClass(value: string) {
  if (/^(待机|关闭|待命|就绪|运行中|监视中)$/.test(value)) return 'is-status'
  if (/^[+-]?\d+(\.\d+)?$/.test(value) || /^T-/.test(value)) return ''
  return 'is-text'
}

function renderReadonly(field: ReadonlyField) {
  const valueClass = readonlyValueClass(field.value)
  const unit = field.unit
    ? `<span class="lad-link-readonly__unit">${escapeHtml(field.unit)}</span>`
    : ''
  return `
    <div class="lad-link-readonly">
      <span class="lad-link-readonly__value ${valueClass}">${escapeHtml(field.value)}</span>
      ${unit}
    </div>
  `
}

function renderAction(field: ActionField) {
  const buttons = field.actions
    .map((action, index) => {
      const secondary = index > 0 ? ' is-secondary' : ''
      return `<button type="button" class="lad-link-actions__btn${secondary}" data-action="${escapeHtml(action)}">${escapeHtml(action)}</button>`
    })
    .join('')
  return `<div class="lad-link-actions">${buttons}</div>`
}

function renderField(field: PanelField) {
  const fullWidth = field.type === 'action' ? ' lad-link-field--full' : ''
  const label = `<div class="lad-link-field__label">${escapeHtml(field.label)}</div>`
  let control = ''
  switch (field.type) {
    case 'toggle':
      control = renderToggle(field)
      break
    case 'stepper':
      control = renderStepper(field)
      break
    case 'readonly':
      control = renderReadonly(field)
      break
    case 'action':
      control = renderAction(field)
      break
  }
  return `<div class="lad-link-field${fullWidth}">${label}${control}</div>`
}

function renderDynamicPanel(definition: DynamicPanelDefinition, title?: string) {
  const sections = definition.sections
    .map(
      (section) => `
        <section class="lad-link-section">
          <h4 class="lad-link-section__title">${escapeHtml(section.title)}</h4>
          <div class="lad-link-grid">
            ${section.fields.map(renderField).join('')}
          </div>
        </section>
      `
    )
    .join('')

  const header = title
    ? `
      <div class="lad-link-panel__header">
        <h3 class="lad-link-panel__title">${escapeHtml(title)}</h3>
        <span class="lad-link-panel__badge">设备控制</span>
      </div>
    `
    : ''

  return `
    <div class="lad-link-panel">
      ${header}
      <div class="lad-link-panel__body">${sections}</div>
    </div>
  `
}

function ensureDynamicPanelHost(doc: Document) {
  const panelRoot = doc.getElementById('u444')
  if (!panelRoot) return null

  let host = doc.getElementById(DYNAMIC_PANEL_ID) as HTMLElement | null
  if (!host) {
    host = doc.createElement('div')
    host.id = DYNAMIC_PANEL_ID
    host.style.display = 'none'
    host.style.visibility = 'hidden'
    panelRoot.appendChild(host)
  }
  return host
}

function setTabSelected(doc: Document, tabId: string) {
  doc.querySelectorAll(`[selectiongroup="${TAB_GROUP}"]`).forEach((node) => {
    const tab = node as HTMLElement
    const isSelected = tab.id === tabId
    tab.classList.toggle('selected', isSelected)
    tab.querySelector('div[id$="_div"]')?.classList.toggle('selected', isSelected)
  })
}

function hideAxurePanels(doc: Document) {
  AXURE_PANEL_STATES.forEach((stateId) => {
    const state = doc.getElementById(stateId) as HTMLElement | null
    if (!state) return
    state.style.visibility = 'hidden'
    state.style.display = 'none'
  })
}

function showAxurePanel(doc: Document, stateIndex: number) {
  hideAxurePanels(doc)
  const dynamicHost = doc.getElementById(DYNAMIC_PANEL_ID) as HTMLElement | null
  if (dynamicHost) {
    dynamicHost.style.display = 'none'
    dynamicHost.style.visibility = 'hidden'
  }

  const stateId = AXURE_PANEL_STATES[stateIndex]
  const state = stateId ? (doc.getElementById(stateId) as HTMLElement | null) : null
  if (!state) return
  state.style.visibility = 'visible'
  state.style.display = 'block'
}

function showDynamicPanel(doc: Document, key: string, title?: string) {
  hideAxurePanels(doc)
  const host = ensureDynamicPanelHost(doc)
  if (!host) return

  const definition = DYNAMIC_PANELS[key]
  if (!definition) return

  host.innerHTML = renderDynamicPanel(definition, title)
  host.style.display = 'block'
  host.style.visibility = 'visible'
}

function activateLinkageTab(doc: Document, tab: LinkageTabConfig) {
  setTabSelected(doc, tab.tabId)
  if (tab.panel.mode === 'axure' && tab.panel.stateIndex !== undefined) {
    showAxurePanel(doc, tab.panel.stateIndex)
    return
  }
  if (tab.panel.mode === 'dynamic' && tab.panel.key) {
    showDynamicPanel(doc, tab.panel.key, tab.label)
  }
}

function bindDynamicPanelInteractions(doc: Document) {
  const host = doc.getElementById(DYNAMIC_PANEL_ID)
  if (!host || host.dataset.bound === 'true') return

  host.addEventListener('click', (event) => {
    const target = event.target as HTMLElement

    const toggleBtn = target.closest('.lad-link-toggle__btn') as HTMLElement | null
    if (toggleBtn) {
      const group = toggleBtn.dataset.group
      if (!group) return
      host.querySelectorAll(`.lad-link-toggle__btn[data-group="${group}"]`).forEach((btn) => {
        btn.classList.toggle('is-active', btn === toggleBtn)
      })
      return
    }

    const stepperBtn = target.closest('[data-stepper-op]') as HTMLElement | null
    if (stepperBtn) {
      const stepper = stepperBtn.closest('[data-stepper]') as HTMLElement | null
      const input = stepper?.querySelector('.lad-link-stepper__input') as HTMLInputElement | null
      if (!stepper || !input) return
      const step = Number(stepper.dataset.step || 1)
      const min = stepper.dataset.min ? Number(stepper.dataset.min) : undefined
      const max = stepper.dataset.max ? Number(stepper.dataset.max) : undefined
      const current = Number(input.value)
      const base = Number.isFinite(current) ? current : 0
      const next = stepperBtn.dataset.stepperOp === '+' ? base + step : base - step
      const clamped =
        min !== undefined && max !== undefined
          ? Math.min(max, Math.max(min, next))
          : min !== undefined
            ? Math.max(min, next)
            : max !== undefined
              ? Math.min(max, next)
              : next
      input.value = String(Number.isInteger(step) ? clamped : Number(clamped.toFixed(2)))
    }
  })

  host.dataset.bound = 'true'
}

function bindLinkageTab(doc: Document, tab: LinkageTabConfig) {
  const element = doc.getElementById(tab.tabId) as HTMLElement | null
  if (!element) return undefined

  element.style.cursor = 'pointer'

  const handleClick = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    activateLinkageTab(doc, tab)
  }

  element.addEventListener('click', handleClick, true)
  return () => element.removeEventListener('click', handleClick, true)
}

export function bindDataScreenLinkageBridge(doc: Document): DataScreenLinkageBridgeCleanup {
  injectPanelStyles(doc)
  ensureDynamicPanelHost(doc)
  bindDynamicPanelInteractions(doc)

  const defaultTab = LINKAGE_TABS.find((tab) => tab.tabId === 'u442') ?? LINKAGE_TABS[0]
  if (defaultTab) {
    activateLinkageTab(doc, defaultTab)
  }

  const cleanups = LINKAGE_TABS.map((tab) => bindLinkageTab(doc, tab)).filter(Boolean) as Array<
    () => void
  >

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}
