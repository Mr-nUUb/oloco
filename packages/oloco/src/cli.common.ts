import util from 'util'

export type FanProfileName =
  | 'silent_air'
  | 'balanced_air'
  //| 'silent_liquid'
  //| 'balanced_liquid'
  | 'max'
  | 'custom'
export type LogTarget = 'terminal'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const fanProfileChoices: ReadonlyArray<FanProfileName> = [
  'silent_air',
  'balanced_air',
  //'silent_liquid',
  //'balanced_liquid',
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
