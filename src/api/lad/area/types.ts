/** 区域业务类型。 */
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
  /** 填充色（含透明度）。 */
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
  siteCode: string
  name: string
  parentId: string | null
  parentSiteCode: string
  parentSiteName: string
  regionType: AreaRegionType
  /** 数值越大，地图叠加时越优先保留。 */
  clipPriority: number
  alarmEnabled: boolean
  color: string
  shapes: AreaShape[]
  createdAt: string
  updatedAt: string
}

export interface AreaRegionSavePayload {
  id?: string
  siteCode: string
  name: string
  parentId?: string | null
  regionType: AreaRegionType
  clipPriority: number
  alarmEnabled?: boolean
  color: string
  shapes: AreaShape[]
}

export interface AreaRegionQuery {
  pageIndex?: number
  pageSize?: number
  siteCode?: string
  name?: string
  parentId?: string
  /** 查询指定区域及其全部下级。 */
  rootId?: string
  regionType?: AreaRegionType
  alarmEnabled?: boolean | 'true' | 'false' | ''
}

export interface AreaRegionListResult {
  list: AreaRegion[]
  total: number
}

export interface AreaSiteTreeNode {
  id: string
  label: string
  siteCode: string
  regionType: AreaRegionType
  children: AreaSiteTreeNode[]
}
