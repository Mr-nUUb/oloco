import type { LogLevel as LogLevelEnum, RgbModeEnum, RgbSpeedEnum } from './enums'
import type { CurvePoint, FanProfilePoint, LogData, RgbData } from './interfaces'

export type FanProfileName =
  | 'AirSilent'
  | 'AirBalanced'
  | 'LiquidSilent'
  | 'LiquidBalanced'
  | 'LiquidPerformance'
  | 'Maximum'
  | 'Custom'

export type LogTarget = 'None' | 'Console' | 'File'

export type LevelData = 'Warning' | 'Good'

export type FanPort = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'

export type TempPort = 'T1' | 'T2' | 'T3'

export type DevicePort = FanPort | 'RGB' | 'Sensor'

export type RgbMode = keyof typeof RgbModeEnum

export type RgbSpeed = keyof typeof RgbSpeedEnum

export type LogLevel = keyof typeof LogLevelEnum

export type LogMode = 'JSON' | 'Text'

export type FanProfileCurves = { [key in FanProfileName]: FanProfilePoint[] }

export type TempMode = 'Maximum' | 'Average'

export type AppConfig = {
  fans: {
    [key in FanPort]: {
      name: string
      enabled: boolean
      warning: number
      tempSources: TempPort[]
      tempMode: TempMode
      activeProfile: FanProfileName
      customProfile: string
      responseCurve: CurvePoint[]
    }
  }
  flow: {
    name: string
    enabled: boolean
    warning: number
    signalsPerLiter: number
  }
  level: {
    name: string
    enabled: boolean
    warning: boolean
  }
  rgb: RgbData & { name: string; enabled: boolean }
  daemon: {
    logDelimiter: string
    logDirectory: string
    logFileRetentionDays: number
    logTarget: LogTarget
    logLevel: LogLevel
    logMode: LogMode
    logThreshold: number
    interval: number
    timestampFormat: TimestampFormat
  }
  temps: {
    [key in TempPort]: {
      name: string
      enabled: boolean
      warning: number
      offset: number
    }
  }
  profiles: { [key: string]: FanProfilePoint[] }
  readTimeout: number
}

export type TimestampFormat = 'ISO' | 'UNIX' | 'UTC'

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : RecursivePartial<T[P]>
}

export type PartialLogData = RecursivePartial<LogData>
