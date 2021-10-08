import { HID, devices } from 'node-hid'
import os from 'os'

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

export type LevelData = 'warning' | 'good'
export type FanPort = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'
export type TempPort = 'T1' | 'T2' | 'T3'
export type DevicePort = FanPort | 'RGB' | 'Sensor'
export type RgbMode =
  | 'Off'
  | 'Static'
  | 'Breathing'
  | 'Fading'
  | 'Marquee'
  | 'CoveringMarquee'
  | 'Pulse'
  | 'SpectrumWave'
  | 'Alternating'
  | 'Candle'
export type RgbSpeed =
  | 'Slowest'
  | 'Slower'
  | 'Slow'
  | 'Slowish'
  | 'Normal'
  | 'Fastish'
  | 'Fast'
  | 'Faster'
  | 'Fastest'
type CommMode = 'Read' | 'Write'

enum RgbModeEnum {
  Off = 0x00,
  Static,
  Breathing,
  Fading,
  Marquee,
  CoveringMarquee,
  Pulse,
  SpectrumWave,
  Alternating,
  Candle,
}
enum RgbSpeedEnum {
  Slowest = 0x00,
  Slower = 0x0c,
  Slow = 0x19,
  Slowish = 0x25,
  Normal = 0x32,
  Fastish = 0xe3,
  Fast = 0x4b,
  Faster = 0x57,
  Fastest = 0x64,
}

export const fanportIterable: ReadonlyArray<FanPort> = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']
export const tempportIterable: ReadonlyArray<TempPort> = ['T1', 'T2', 'T3']
export const rgbmodeIterable: ReadonlyArray<RgbMode> = [
  'Off',
  'Static',
  'Breathing',
  'Fading',
  'Marquee',
  'CoveringMarquee',
  'Pulse',
  'SpectrumWave',
  'Alternating',
  'Candle',
]
export const rgbspeedIterable: ReadonlyArray<RgbSpeed> = [
  'Slowest',
  'Slower',
  'Slow',
  'Slowish',
  'Normal',
  'Fastish',
  'Fast',
  'Faster',
  'Fastest',
]

export class EkLoopConnect {
  constructor(device?: HID) {
    if (device) this._device = device
    else {
      const devs = devices(0x0483, 0x5750).filter((dev) => dev.interface === 0)
      if (devs.length === 0) {
        throw new Error("Couldn't find controller: not connected!")
      }
      if (devs.length > 1) {
        throw new Error('Multiple controllers detected: not yet implemented!')
      }
      const dev = devs[0]
      if (!dev.path) {
        throw new Error("Couldn't connect to controller: no path available!")
      }
      this._device = new HID(dev.path)
    }
  }

  private _device
  private _readTimeout = 1000

  private _getFan(port: FanPort): FanData {
    const recv = this._write(createPacket('Read', port))

    return {
      port,
      rpm: parseInt(`0x${recv[12].toString(16)}${padLeadingZeros(recv[13].toString(16), 2)}`),
      pwm: recv[21],
    }
  }

  private _setFan(speed: number, port: FanPort): number[] {
    const packet = createPacket('Write', port)

    // original packet contains RPM on bytes 15 and 16 - why?
    // eg. 2584 RPM ==> packet[15]=0x0a, packet[16]=0x18
    packet[24] = speed

    const recv = this._write(packet) // I don'w know what to expect here

    return recv
  }

  private _write(packet: number[]): number[] {
    // calculate checksum here. Checksum is optional though...
    // anybody got an idea what kind of checksum EKWB is using?

    // prepend report number for windows
    if (os.platform() === 'win32') packet.unshift(0x00)

    this._device.write(packet)
    const recv = this._device.readTimeout(this._readTimeout)
    if (recv.length === 0) throw 'Unable to read response!'

    // check response here
    // since checksums are optional, I doubt checking the response is worth it

    return recv
  }

  public setTimeout(timeout: number): void {
    this._readTimeout = timeout
  }

  public getFan(port?: FanPort): FanData[] {
    return port ? [this._getFan(port)] : fanportIterable.map((p) => this._getFan(p))
  }

  public async getResponseCurve(port?: FanPort, interval = 10000): Promise<CurveData[]> {
    const curves: CurveData[] = port
      ? [{ port, curve: [] }]
      : fanportIterable.map((p) => ({ port: p, curve: [] }))
    const backups = this.getFan(port)

    for (let i = 0; i <= 100; i += 10) {
      this.setFan(i, port)
      await sleep(interval)
      curves.forEach((c) => {
        const current = this._getFan(c.port)
        c.curve.push({ pwm: current.pwm, rpm: current.rpm })
      })
    }

    backups.forEach((b) => this._setFan(b.pwm, b.port))
    return curves
  }

  public getRgb(): RgbData {
    const recv = this._write(createPacket('Read', 'RGB'))

    return {
      port: 'Lx',
      mode: RgbModeEnum[recv[9]] as RgbMode,
      speed: RgbSpeedEnum[recv[11]] as RgbSpeed,
      color: { red: recv[13], green: recv[14], blue: recv[15] },
    }
  }

  public getSensor(): SensorData {
    const packet = createPacket('Read', 'Sensor')
    let offset = 7

    packet[9] = 0x20 // offset for checksum? length of answer?

    const recv = this._write(packet)

    return {
      temps: tempportIterable.map((port) => {
        const temp = recv[(offset += 4)]
        return { port, temp: temp !== 231 ? temp : undefined }
      }),
      flow: { port: 'FLO', flow: recv[23] },
      level: { port: 'LVL', level: recv[27] === 100 ? 'good' : 'warning' },
    }
  }

  public getInformation(): DeviceInformation {
    return {
      fans: this.getFan(),
      rgb: this.getRgb(),
      sensors: this.getSensor(),
    }
  }

  public setFan(speed: number, port?: FanPort): void {
    port ? this._setFan(speed, port) : fanportIterable.forEach((p) => this._setFan(speed, p))
  }

  public setRgb(rgb: RgbData): number[] {
    const packet = createPacket('Write', 'RGB')

    packet[12] = RgbModeEnum[rgb.mode]
    packet[13] = rgb.mode === 'CoveringMarquee' ? 0xff : 0x00 // this is just dumb
    packet[14] = RgbSpeedEnum[rgb.speed]
    packet[16] = rgb.color.red
    packet[17] = rgb.color.green
    packet[18] = rgb.color.blue

    const recv = this._write(packet) // I don'w know what to expect here

    return recv
  }

  public close(): void {
    this._device.close()
  }
}

export function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function padLeadingZeros(s: string, n: number): string {
  let p = s
  while (p.length < n) p = `0${p}`
  return p
}

function createPacket(mode: CommMode, port: DevicePort): number[] {
  const packet = new Array<number>(63)

  const header = {
    Read: [0x10, 0x12, 0x08, 0xaa, 0x01, 0x03, 0x00, 0x00, 0x00, 0x10, 0x20],
    Write: [0x10, 0x12, 0x29, 0xaa, 0x01, 0x10, 0x00, 0x00, 0x00, 0x10, 0x20],
  }
  const portAddress = {
    F1: [0xa0, 0xa0],
    F2: [0xa0, 0xc0],
    F3: [0xa0, 0xe0],
    F4: [0xa1, 0x00],
    F5: [0xa1, 0x20],
    F6: [0xa1, 0xe0],
    Sensor: [0xa2, 0x20],
    RGB: [0xa2, 0x60],
  }

  for (let i = 0; i < packet.length; i++) {
    if (i === 6 || i === 7) packet[i] = portAddress[port][i - 6]
    else if (i < header[mode].length) packet[i] = header[mode][i]
    else packet[i] = 0
  }

  return packet
}
