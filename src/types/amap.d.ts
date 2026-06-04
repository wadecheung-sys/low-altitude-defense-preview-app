/** 高德地图 JS API 2.0（由 loader 注入） */
declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, opts?: Record<string, unknown>)
    on(event: string, handler: (ev: MapsEvent) => void): void
    off(event: string, handler: (ev: MapsEvent) => void): void
    add(overlays: Overlay | Overlay[]): void
    remove(overlays: Overlay | Overlay[]): void
    destroy(): void
    setStatus(status: Record<string, boolean>): void
    setFitView(
      overlays?: Overlay[],
      immediately?: boolean,
      avoid?: number[],
      maxZoom?: number
    ): void
  }

  class LngLat {
    constructor(lng: number, lat: number)
    getLng(): number
    getLat(): number
  }

  class Polygon {
    constructor(opts?: Record<string, unknown>)
  }

  class Circle {
    constructor(opts?: Record<string, unknown>)
  }

  interface MapsEvent {
    lnglat: LngLat
    originEvent?: MouseEvent
  }

  type Overlay = Polygon | Circle
}
