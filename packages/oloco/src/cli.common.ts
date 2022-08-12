import util from 'util'

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

export const fanProfileChoices: ReadonlyArray<FanProfileName> = [
  'air_silent',
  'air_balanced',
  'liquid_silent',
  'liquid_balanced',
  'liquid_performance',
  'max',
  'custom',
]

export interface FanProfilePoint {
  temp: number
  pwm: number
}
export interface FanProfileCurves {
  profiles: { [key in FanProfileName]: FanProfilePoint[] }
}

export function logObject(data: unknown): void {
  console.log(util.inspect(data, { depth: null, colors: true }))
}
