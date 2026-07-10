/** 告警相关系统参数键（由参数配置页维护） */
export const ALARM_PARAM_KEYS = {
  audioFile: 'alarm.audio.file',
  maxDurationSeconds: 'alarm.audio.max.duration.seconds',
  visualMode: 'alarm.visual.mode'
} as const

export type AlarmVisualMode = '闪烁' | '常亮'

export const ALARM_VISUAL_MODE_OPTIONS: { label: string; value: AlarmVisualMode }[] = [
  { label: '闪烁', value: '闪烁' },
  { label: '常亮', value: '常亮' }
]

export const ALARM_AUDIO_ACCEPT = '.mp3,.wav,.aac'
