import { LAD_TARGET_MODELS } from '@/constants/ladTargetModels'

const models = LAD_TARGET_MODELS.filter((item) => item !== '其他')

export interface LadTargetProfile {
  profileIndex: number
  targetId: string
  uavSn: string
  targetModel: string
  eventCount: number
  hasResolvableSn: boolean
}

export const LAD_TARGET_PROFILE_COUNT = 24

export function buildLadTargetProfile(index: number): LadTargetProfile {
  const hasResolvableSn = index % 4 !== 0
  return {
    profileIndex: index,
    targetId: `TG-2024-${String(index + 1).padStart(4, '0')}`,
    uavSn: hasResolvableSn ? `1581F4${String(100000 + index * 137).slice(0, 6)}` : '未解析',
    targetModel: models[index % models.length],
    eventCount: 2 + (index % 4),
    hasResolvableSn
  }
}

/** 与「历史事件」菜单共用的 24 组目标档案 */
export const LAD_TARGET_PROFILES: LadTargetProfile[] = Array.from(
  { length: LAD_TARGET_PROFILE_COUNT },
  (_, index) => buildLadTargetProfile(index)
)

/** 黑白名单仅收录具备识别码的合作式目标 */
export const LAD_RESOLVABLE_TARGET_PROFILES = LAD_TARGET_PROFILES.filter(
  (profile) => profile.hasResolvableSn
)

export function findTargetProfileByTargetId(targetId: string): LadTargetProfile | undefined {
  return LAD_TARGET_PROFILES.find((profile) => profile.targetId === targetId)
}

export function findTargetProfileByUavSn(uavSn: string): LadTargetProfile | undefined {
  return LAD_TARGET_PROFILES.find((profile) => profile.uavSn === uavSn)
}
