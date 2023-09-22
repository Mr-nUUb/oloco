import { LogLevelEnum, PortAddressEnum, RgbModeEnum, RgbSpeedEnum } from './enums'
import type { FanPort, FixedSizeArray, LogLevel, RgbMode, RgbSpeed } from './types'

export const FanPorts = Object.keys(PortAddressEnum).filter((k) =>
  k.startsWith('F'),
) as FixedSizeArray<FanPort, 6>

export const TempPorts = ['T1', 'T2', 'T3'] as const

export const RgbModes: readonly RgbMode[] = Object.keys(RgbModeEnum) as RgbMode[]

export const RgbSpeeds: readonly RgbSpeed[] = Object.keys(RgbSpeedEnum) as RgbSpeed[]

export const FanProfiles = [
  'AirSilent',
  'AirBalanced',
  'LiquidSilent',
  'LiquidBalanced',
  'LiquidPerformance',
  'Maximum',
  'Custom',
] as const

export const LogLevels: readonly LogLevel[] = Object.keys(LogLevelEnum) as LogLevel[]

export const LogModes = ['JSON', 'Text'] as const

export const TempModes = ['Average', 'Maximum'] as const

export const LogTargets = ['None', 'Console', 'File'] as const

export const TimestampFormats = ['ISO', 'UNIX', 'UTC'] as const
