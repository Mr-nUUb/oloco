import type { LogLevelEnum, PortAddressEnum, RgbModeEnum, RgbSpeedEnum } from './enums'
import type { CurvePoint, FanProfilePoint, LogData, RgbData } from './interfaces'
import type {
  FanProfiles,
  LogModes,
  LogTargets,
  TempModes,
  TempPorts,
  TimestampFormats,
} from './iterables'

export type FanProfileName = (typeof FanProfiles)[number]
export type FanProfileCurves = { [key in FanProfileName]: FanProfilePoint[] }

export type LevelData = 'Warning' | 'Good'

export type DevicePort = keyof typeof PortAddressEnum
export type FanPort = Extract<DevicePort, `F${number}`>
export type TempPort = (typeof TempPorts)[number]

export type RgbMode = keyof typeof RgbModeEnum
export type RgbSpeed = keyof typeof RgbSpeedEnum

export type LogTarget = (typeof LogTargets)[number]
export type LogLevel = keyof typeof LogLevelEnum
export type LogMode = (typeof LogModes)[number]
export type TimestampFormat = (typeof TimestampFormats)[number]

export type TempMode = (typeof TempModes)[number]

type PortConfigBase = { name: string; enabled: boolean }
export type AppConfig = {
  fans: {
    [key in FanPort]: {
      warning: number
      backOffSpeed: number
      tempSources: TempPort[]
      tempMode: TempMode
      activeProfile: FanProfileName
      customProfile: string
      responseCurve: CurvePoint[]
    } & PortConfigBase
  }
  flow: {
    warning: number
    signalsPerLiter: number
  } & PortConfigBase
  level: {
    warning: boolean
  } & PortConfigBase
  rgb: RgbData & PortConfigBase & { backOffConfig: RgbData }
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
      warning: number
      offset: number
    } & PortConfigBase
  }
  profiles: { [key: string]: FanProfilePoint[] }
  readTimeout: number
}

export type RecursivePartial<T> = {
  [P in keyof T]?:
    | (T[P] extends (infer U)[] ? RecursivePartial<U>[] : RecursivePartial<T[P]>)
    | undefined
}

export type PartialLogData = RecursivePartial<LogData>

export type FixedSizeArray<T, L extends number, R extends T[] = []> = R extends { length: L }
  ? R
  : FixedSizeArray<T, L, [...R, T]>

export type AllowedIndexes<T, M = keyof T> = M extends `${infer N extends number}` ? N : never

export type Packet = FixedSizeArray<number, 63>
