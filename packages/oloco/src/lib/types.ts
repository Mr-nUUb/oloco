import type { RgbModeEnum, RgbSpeedEnum } from './enums'
import type { FanProfilePoint } from './interfaces'

export type FanProfileName =
  | 'AirSilent'
  | 'AirBalanced'
  | 'LiquidSilent'
  | 'LiquidBalanced'
  | 'LiquidPerformance'
  | 'Maximum'
  | 'Custom'

export type LogTarget = 'none' | 'console'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LevelData = 'warning' | 'good'

export type FanPort = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'

export type TempPort = 'T1' | 'T2' | 'T3'

export type DevicePort = FanPort | 'RGB' | 'Sensor'

export type CommMode = 'Read' | 'Write'

export type RgbMode = keyof typeof RgbModeEnum

export type RgbSpeed = keyof typeof RgbSpeedEnum

export type FanProfileCurves = { [key in FanProfileName]: FanProfilePoint[] }

export type TempMode = 'maximum' | 'average'
