import type {
  FanPort,
  FanProfileName,
  LogLevel,
  LogMode,
  LogTarget,
  RgbMode,
  RgbSpeed,
  TempMode,
  TempPort,
  TimestampFormat,
} from './types'

export const FanPorts: ReadonlyArray<FanPort> = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']

export const TempPorts: ReadonlyArray<TempPort> = ['T1', 'T2', 'T3']

export const RgbModes: ReadonlyArray<RgbMode> = [
  'Off',
  'Static',
  'Breathing',
  'Fading',
  'Marquee',
  'CoveringMarquee',
  'Pulse',
  'SpectrumWave',
  'Rainbow',
  'Alternating',
  'Candle',
]

export const RgbSpeeds: ReadonlyArray<RgbSpeed> = [
  'Slowest',
  'Slower',
  'Slow',
  'Slowish',
  'Normal',
  'Fastish',
  'Fast',
  'Faster',
  'Fastest',
]

export const FanProfiles: ReadonlyArray<FanProfileName> = [
  'AirSilent',
  'AirBalanced',
  'LiquidSilent',
  'LiquidBalanced',
  'LiquidPerformance',
  'Maximum',
  'Custom',
]

export const LogLevels: ReadonlyArray<LogLevel> = ['Debug', 'Info', 'Warn', 'Error']

export const LogModes: ReadonlyArray<LogMode> = ['JSON', 'Text']

export const TempModes: ReadonlyArray<TempMode> = ['Average', 'Maximum']

export const LogTargets: ReadonlyArray<LogTarget> = ['None', 'Console', 'File']

export const TimestampFormats: ReadonlyArray<TimestampFormat> = ['ISO', 'UNIX', 'UTC']
