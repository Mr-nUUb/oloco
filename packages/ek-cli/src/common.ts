import { FanPort, fanportIterable, TempPort } from '@ek-loop-connect/ek-lib'
import { exit } from 'process'
import * as HID from 'node-hid'
import { Config } from './config'

export function openController(): HID.HID {
  const devices = HID.devices(0x0483, 0x5750).filter((dev) => dev.interface === 0)
  if (devices.length === 0) {
    console.error("Couldn't find controller: not connected!")
    exit(2)
  }
  if (devices.length > 1) {
    console.error('Multiple controllers detected: not yet implemented!')
    exit(1)
  }
  const device = devices[0]
  if (!device.path) {
    console.error("Couldn't connect to controller: no path available!")
    exit(2)
  }
  return new HID.HID(device.path)
}

export type FanPorts = FanPort | 'all'
export type FanProfileName = 'silent' | 'balanced' | 'max' | 'custom'
export type LogTarget = 'terminal'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const fanPortChoices: ReadonlyArray<FanPorts> = [...fanportIterable, 'all']
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
