import { DevicePort, FanPort, LightMode, LightSpeed } from '@ek-loop-connect/ek-lib'
import { exit } from 'process'
import HID from 'node-hid'

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
export type PwmCurve = 'curve1' | 'curve2' | 'curve3' | 'curve4' | 'curve5' | 'curve6'
export type PwmCurves = PwmCurve | 'curves'
export type DeviceGadgets = DevicePort | PwmCurves | 'fans' | 'infos'

export const fanPortChoices: ReadonlyArray<FanPorts> = [
  'fan1',
  'fan2',
  'fan3',
  'fan4',
  'fan5',
  'fan6',
  'all',
]
export const lightModeChoices: ReadonlyArray<LightMode> = [
  'off',
  'static',
  'breathing',
  'fading',
  'marquee',
  'coveringMarquee',
  'pulse',
  'spectrumWave',
  'alternating',
  'candle',
]
export const lightSpeedChoices: ReadonlyArray<LightSpeed> = [
  'slowest',
  'slower',
  'slow',
  'slowish',
  'normal',
  'fastish',
  'fast',
  'faster',
  'fastest',
]
export const deviceGadgetChoices: ReadonlyArray<DeviceGadgets> = [
  'fan1',
  'fan2',
  'fan3',
  'fan4',
  'fan5',
  'fan6',
  'fans',
  'curve1',
  'curve2',
  'curve3',
  'curve4',
  'curve5',
  'curve6',
  'curves',
  'lights',
  'sensors',
  'infos',
]
