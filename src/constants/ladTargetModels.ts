export const LAD_TARGET_MODELS = [
  'DJI Mavic 3',
  'DJI Mini 3 Pro',
  'DJI Air 3',
  'DJI Mini 4 Pro',
  'DJI Matrice 300 RTK',
  'DJI Mavic 3T',
  'DJI Phantom 4 RTK',
  'Autel EVO II',
  '大疆经纬 M30',
  'Parrot Anafi',
  '未知型号',
  '其他'
]

export const ladTargetModelOptions = LAD_TARGET_MODELS.map((item) => ({
  label: item,
  value: item
}))
