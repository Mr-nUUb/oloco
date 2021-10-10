import { FanPort, TempPort } from '@oloco/oloco'
import { Config } from './config'

export type FanProfileName = 'silent' | 'balanced' | 'max' | 'custom'
export type LogTarget = 'terminal'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const fanProfileChoices: ReadonlyArray<FanProfileName> = [
  'silent',
  'balanced',
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

export function convertConfigEntry(entry: string): string {
  const match = entry.match(/(F[1-6]|T[1-3])/)
  let key: string
  if (match) {
    const port = match[0] as FanPort | TempPort
    const type = entry.startsWith('fans') ? 'fans' : 'temps'
    const index = Config.store[type].findIndex((t) => t.port === port)
    key = entry.replace(/[F,T][1-6]/, `${index}`)
  } else {
    key = entry
  }
  return key
}
