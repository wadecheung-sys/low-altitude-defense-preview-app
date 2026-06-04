/** 预案执行设备目录：类型与功能（与设备台账类型对齐） */

export interface PlanDeviceFunctionOption {
  label: string
  value: string
  deviceAction: string
}

export const planDeviceTypeOptions = [
  { label: '\u65e0\u7ebf\u7535\u5e72\u6270', value: '\u65e0\u7ebf\u7535\u5e72\u6270' },
  { label: '\u5149\u7535\u8bbe\u5907', value: '\u5149\u7535\u8bbe\u5907' },
  { label: '\u53cd\u5236\u8bbe\u5907', value: '\u53cd\u5236\u8bbe\u5907' },
  { label: '\u6fc0\u5149\u6253\u51fb\u8bbe\u5907', value: '\u6fc0\u5149\u6253\u51fb\u8bbe\u5907' },
  { label: '\u9ad8\u529f\u7387\u5fae\u6ce2\u8bbe\u5907', value: '\u9ad8\u529f\u7387\u5fae\u6ce2\u8bbe\u5907' },
  { label: '\u58f0\u5149\u544a\u8b66', value: '\u58f0\u5149\u544a\u8b66' },
  { label: '\u96f7\u8fbe', value: '\u96f7\u8fbe' }
]

export const planDeviceFunctionMap: Record<string, PlanDeviceFunctionOption[]> = {
  '\u65e0\u7ebf\u7535\u5e72\u6270': [
    {
      label: '\u9891\u6bb5\u538b\u5236\u9a71\u79bb',
      value: 'jam_band_expel',
      deviceAction: '\u9a71\u79bb'
    },
    {
      label: '\u5bfc\u822a\u8bf1\u9a97',
      value: 'jam_nav_spoof',
      deviceAction: '\u9a71\u79bb'
    },
    {
      label: '\u5168\u5411\u5e72\u6270',
      value: 'jam_omni',
      deviceAction: '\u9a71\u79bb'
    }
  ],
  '\u5149\u7535\u8bbe\u5907': [
    {
      label: '\u76ee\u6807\u8ddf\u8e2a\u9501\u5b9a',
      value: 'eo_track_lock',
      deviceAction: '\u8ddf\u8e2a'
    },
    {
      label: '\u8fde\u7eed\u76d1\u6d4b\u4e0a\u62a5',
      value: 'eo_monitor_report',
      deviceAction: '\u8ddf\u8e2a'
    }
  ],
  '\u53cd\u5236\u8bbe\u5907': [
    {
      label: '\u8feb\u964d\u53cd\u5236',
      value: 'counter_forced_land',
      deviceAction: '\u8feb\u964d'
    },
    {
      label: '\u7f51\u7edc\u65ad\u94fe',
      value: 'counter_net_cut',
      deviceAction: '\u8feb\u964d'
    }
  ],
  '\u58f0\u5149\u544a\u8b66': [
    {
      label: '\u58f0\u5149\u8b66\u793a',
      value: 'alarm_sound_light',
      deviceAction: '\u544a\u8b66'
    },
    {
      label: '\u63a8\u9001\u503c\u73ed\u5e7f\u64ad',
      value: 'alarm_dispatch_notify',
      deviceAction: '\u544a\u8b66'
    }
  ],
  '\u96f7\u8fbe': [
    {
      label: '\u76ee\u6807\u8ddf\u8e2a',
      value: 'radar_track',
      deviceAction: '\u8ddf\u8e2a'
    }
  ],
  '\u6fc0\u5149\u6253\u51fb\u8bbe\u5907': [
    {
      label: '\u7cbe\u786e\u6fc0\u5149\u6253\u51fb',
      value: 'laser_precision_strike',
      deviceAction: '\u6fc0\u5149\u6253\u51fb'
    },
    {
      label: '\u62a0\u76ee\u6807\u8ddf\u8e2a\u540e\u6253\u51fb',
      value: 'laser_track_strike',
      deviceAction: '\u6fc0\u5149\u6253\u51fb'
    }
  ],
  '\u9ad8\u529f\u7387\u5fae\u6ce2\u8bbe\u5907': [
    {
      label: '\u533a\u57df\u5fae\u6ce2\u63a9\u76d6',
      value: 'hpm_area_cover',
      deviceAction: '\u9ad8\u529f\u7387\u5fae\u6ce2'
    },
    {
      label: '\u8702\u7fa4\u96c6\u675f\u6253\u51fb',
      value: 'hpm_swarm_burst',
      deviceAction: '\u9ad8\u529f\u7387\u5fae\u6ce2'
    }
  ]
}

export function listFunctionsByDeviceType(deviceType: string): PlanDeviceFunctionOption[] {
  return planDeviceFunctionMap[deviceType] || []
}

export function resolveDeviceFunction(
  deviceType: string,
  functionValue: string
): PlanDeviceFunctionOption | undefined {
  return listFunctionsByDeviceType(deviceType).find((f) => f.value === functionValue)
}

export function functionLabel(deviceType: string, functionValue: string): string {
  return resolveDeviceFunction(deviceType, functionValue)?.label || functionValue
}
