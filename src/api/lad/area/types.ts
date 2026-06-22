/** 区域业务类型（各区域相互独立，无父子树） */
export type AreaRegionType =
  | 'warning'
  | 'alert'
  | 'dispose'
  | 'nofly'
  | 'mask'
  | 'nuclear'
  | 'pool'
  | 'testflight'
  | 'other'

export type AreaShapeType = 'rect' | 'circle' | 'polygon'

export interface AreaPoint {
  x: number
  y: number
}

export interface AreaShape {
  id: string
  type: AreaShapeType
  /** 填充色（含透明度） */
  color: string
  x?: number
  y?: number
  width?: number
  height?: number
  cx?: number
  cy?: number
  r?: number
  points?: AreaPoint[]
}

export interface AreaRegion {
  id: string
  name: string
  regionType: AreaRegionType
  /**
   * 区域优先级（1–99）：数值越大，地图上越优先保留；
   * 重叠且几何包含时，低优先级区域从该图形内镂空扣除。
   */
  clipPriority: number
  /** 是否参与平台告警（如试飞区可关闭） */
  alarmEnabled: boolean
  color: string
  shapes: AreaShape[]
  createdAt: string
  updatedAt: string
}

export interface AreaRegionSavePayload {
  id?: string
  name: string
  regionType: AreaRegionType
  clipPriority: number
  alarmEnabled?: boolean
  color: string
  shapes: AreaShape[]
}

export interface AreaRegionQuery {
  pageIndex?: number
  pageSize?: number
  name?: string
  regionType?: AreaRegionType
  /** true | false 字符串或布尔 */
  alarmEnabled?: boolean | 'true' | 'false' | ''
}

export interface AreaRegionListResult {
  list: AreaRegion[]
  total: number
}
