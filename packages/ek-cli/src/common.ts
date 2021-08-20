import { DevicePort, FanPort, LightMode, LightSpeed } from '@ek-loop-connect/ek-lib'
import { exit } from 'process'
import HID from 'node-hid'

const device = HID.devices(0x0483, 0x5750).filter((dev) => dev.interface === 0)[0]
if (device === undefined || !device.path) {
  console.error("Couldn't find EK Loop Connect! Is it connected?")
  exit(2)
}
export const hiddev = new HID.HID(device.path)

export type FanPorts = FanPort | 'fans'
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
  'fans',
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
