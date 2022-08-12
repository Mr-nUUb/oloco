import type { RgbModeEnum, RgbSpeedEnum } from './enums'

export type FanProfileName =
  | 'air_silent'
  | 'air_balanced'
  | 'liquid_silent'
  | 'liquid_balanced'
  | 'liquid_performance'
  | 'max'
  | 'custom'

export type LogTarget = 'terminal'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LevelData = 'warning' | 'good'

export type FanPort = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'

export type TempPort = 'T1' | 'T2' | 'T3'

export type DevicePort = FanPort | 'RGB' | 'Sensor'

export type CommMode = 'Read' | 'Write'

export type RgbMode = keyof typeof RgbModeEnum

export type RgbSpeed = keyof typeof RgbSpeedEnum
