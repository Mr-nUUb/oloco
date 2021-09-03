import { FanPort, fanportIterable } from '@ek-loop-connect/ek-lib'
import { exit } from 'process'
import * as HID from 'node-hid'

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
