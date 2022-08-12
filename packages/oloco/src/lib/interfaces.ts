import type { FanPort, FanProfileName, LevelData, RgbMode, RgbSpeed, TempPort } from './types'

export interface FanProfilePoint {
  temp: number
  pwm: number
}

export interface FanProfileCurves {
  profiles: { [key in FanProfileName]: FanProfilePoint[] }
}

export interface CurvePoint {
  rpm: number
  pwm: number
}

export interface RgbColor {
  red: number
  green: number
  blue: number
}

export interface FanData extends CurvePoint {
  port: FanPort
}

export interface TempData {
  port: TempPort
  temp: number | undefined
}

export interface CurveData {
  port: FanPort
  curve: CurvePoint[]
}

export interface SensorData {
  temps: TempData[]
  flow: {
    port: 'FLO'
    flow: number
  }
  level: {
    port: 'LVL'
    level: LevelData
  }
}

export interface RgbData {
  port?: 'Lx'
  color: RgbColor
  mode: RgbMode
  speed: RgbSpeed
}

export interface DeviceInformation {
  fans: FanData[]
  sensors: SensorData
  rgb: RgbData
}
