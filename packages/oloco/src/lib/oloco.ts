import { HID, devices } from 'node-hid'
import { EOL, platform } from 'os'
import type { CurveData, DeviceInformation, FanData, RgbData, SensorData } from './interfaces'
import { FanPorts, TempPorts } from './iterables'
import type { DevicePort, FanPort } from './types'
import { sleep } from '../util'
import { CommMode, RgbModeEnum, RgbSpeedEnum } from './enums'

export class OLoCo {
  private _device: HID
  private _readTimeout = 1000

  private static _vendorId = 0x0483 as const
  private static _deviceId = 0x5750 as const
  private static _portAddresses: { [k in DevicePort]: number[] } = {
    F1: [0xa0, 0xa0],
    F2: [0xa0, 0xc0],
    F3: [0xa0, 0xe0],
    F4: [0xa1, 0x00],
    F5: [0xa1, 0x20],
    F6: [0xa1, 0xe0],
    Sensor: [0xa2, 0x20],
    RGB: [0xa2, 0x60],
  }

  constructor(device?: HID) {
    if (device) this._device = device
    else {
      const devs = devices(OLoCo._vendorId, OLoCo._deviceId).filter(
        (dev) => dev.interface === 0 && dev.usage === 1,
      )
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

  private static _createPacket(mode: CommMode, port: DevicePort, dataLength: number): number[] {
    const packetLength = dataLength + 4 // 4 bytes header
    const packet = new Array<number>(packetLength).fill(0x00)

    // header
    packet[0] = 0x10
    packet[1] = 0x12
    packet[2] = dataLength
    packet[3] = 0xaa

    // data header
    packet[4] = 0x01
    packet[5] = mode
    packet[6] = OLoCo._portAddresses[port][0]
    packet[7] = OLoCo._portAddresses[port][1]
    // packet[8] = 0x00
    packet[9] = port === 'Sensor' ? 0x20 : 0x10
    packet[10] = 0x20

    // tail? don't forget to increase packetLength if used!
    // packet[packetLength - 4] = 0xaa
    // packet[packetLength - 3] = 0xbb
    // packet[packetLength - 2] = 0x00 // checksum here?
    // packet[packetLength - 1] = 0xed

    return packet
  }

  private static _validateRecv(recv: number[], write: number[]) {
    const port = Object.entries(OLoCo._portAddresses).find(
      (p) => p[1][0] === write[6] && p[1][1] === write[7],
    ) as [DevicePort, number[]]
    const sensors = port[0] === 'Sensor'
    const longRecv = write[2] === 0x29

    //console.log(recv.length, recv)
    const packet = recv.slice(0, 8)
    const expectPacket = [
      0x10,
      0x12,
      sensors || longRecv ? 0x27 : 0x17,
      0xaa,
      0x01,
      0x03,
      0x00,
      sensors ? 0x20 : 0x10,
    ]
    OLoCo._compareBytes(packet, expectPacket)
  }

  private static _compareBytes(recv: number[], expect: number[]) {
    try {
      const len = expect.length
      if (recv.length !== len) throw new Error(`length mismatch`)
      for (let i = 0; i < len; i++) {
        if (recv[i] !== expect[i]) throw new Error(`mismatch on index ${i}`)
      }
    } catch (err) {
      const fmtHdr = OLoCo._formatBytes(recv)
      const fmtExp = OLoCo._formatBytes(expect)
      throw new Error(
        [
          `Invalid packet received: ${(err as Error).message}`,
          `received ${fmtHdr}`,
          `expected ${fmtExp}`,
        ].join(`${EOL}  `),
      )
    }
  }

  private static _formatBytes(arr: number[]) {
    return `[ ${arr.map((n) => `0x${n.toString(16).padStart(2, '0')}`).join(', ')} ]`
  }

  private _getFan(port: FanPort, skipValidation = false): FanData {
    const recv = this._write(OLoCo._createPacket(CommMode.Read, port, 8), skipValidation)

    return {
      port,
      rpm: (recv[12] << 8) | recv[13],
      pwm: recv[21],
    }
  }

  private _setFan(
    speed: number,
    port: FanPort,
    skipValidation = false,
    skipReadback = false,
  ): number[] | void {
    const packet = OLoCo._createPacket(CommMode.Write, port, 41)

    // original packet contains RPM on bytes 15 and 16 - why?
    // eg. 2584 RPM ==> packet[15]=0x0a, packet[16]=0x18
    packet[24] = speed

    const recv = this._write(packet, skipValidation, skipReadback)

    return recv
  }

  private _write(packet: number[], skipValidation = false, skipReadback = false): number[] {
    // calculate checksum here. Checksum is optional though...
    // anybody got an idea what kind of checksum EKWB is using?

    // prepend report number for windows
    this._device.write(platform() === 'win32' ? [0x00].concat(packet) : packet)

    // readback, must be able to disable because daemon shutdown messes up order of answers
    if (!skipReadback) {
      const recv = this._device.readTimeout(this._readTimeout)
      if (recv.length === 0) throw 'Unable to read response!'

      // check response here
      if (!skipValidation) OLoCo._validateRecv(recv, packet)
      return recv
    }
    return []
  }

  public setReadTimeout(timeout: number): void {
    this._readTimeout = timeout
  }

  public getFan(port?: FanPort, skipValidation = false): FanData[] {
    const ports = port ? [port] : FanPorts
    const result = new Array<FanData>(ports.length)

    for (let i = 0; i < ports.length; i++) {
      result[i] = this._getFan(ports[i], skipValidation)
    }

    return result
  }

  public async getResponseCurve(
    port?: FanPort,
    interval = 10000,
    skipValidation = false,
  ): Promise<CurveData[]> {
    const pointsNr = 11
    const backups = this.getFan(port, skipValidation)
    const ports = port ? [port] : FanPorts
    const curves = new Array<CurveData>(ports.length)

    for (let i = 0; i < ports.length; i++) {
      curves[i] = { port: ports[i], curve: new Array(pointsNr) }
    }

    for (let i = 0; i < pointsNr; i++) {
      this.setFan(i * 10, port, skipValidation)
      await sleep(interval)
      for (let c = 0; c < curves.length; c++) {
        const current = this._getFan(curves[c].port, skipValidation)
        curves[c].curve[i] = { pwm: current.pwm, rpm: current.rpm }
      }
    }

    for (let i = 0; i < backups.length; i++) {
      this._setFan(backups[i].pwm, backups[i].port, skipValidation)
    }

    return curves
  }

  public getRgb(skipValidation = false): RgbData {
    const recv = this._write(OLoCo._createPacket(CommMode.Read, 'RGB', 8), skipValidation)

    return {
      port: 'Lx',
      mode: RgbModeEnum[recv[9]] as keyof typeof RgbModeEnum,
      speed: RgbSpeedEnum[recv[11]] as keyof typeof RgbSpeedEnum,
      color: { red: recv[13], green: recv[14], blue: recv[15] },
    }
  }

  public getSensor(skipValidation = false): SensorData {
    const packet = OLoCo._createPacket(CommMode.Read, 'Sensor', 8)
    const offset = 11

    const recv = this._write(packet, skipValidation)

    const flow: SensorData['flow'] = { port: 'FLO', flow: recv[23] }
    const level: SensorData['level'] = { port: 'LVL', level: recv[27] === 100 ? 'Good' : 'Warning' }
    const temps: SensorData['temps'] = new Array(TempPorts.length)

    for (let i = 0; i < temps.length; i++) {
      const temp = recv[offset + i * 4]
      temps[i] = { port: TempPorts[i], temp: temp !== 231 ? temp : undefined }
    }

    return { flow, level, temps }
  }

  public getInformation(skipValidation = false): DeviceInformation {
    return {
      fans: this.getFan(undefined, skipValidation),
      rgb: this.getRgb(skipValidation),
      sensors: this.getSensor(skipValidation),
    }
  }

  public setFan(speed: number, port?: FanPort, skipValidation = false, skipReadback = false): void {
    const ports = port ? [port] : FanPorts
    for (let i = 0; i < ports.length; i++) {
      this._setFan(speed, ports[i], skipValidation, skipReadback)
    }
  }

  public setRgb(rgb: RgbData, skipValidation = false, skipReadback = false): number[] {
    const packet = OLoCo._createPacket(CommMode.Write, 'RGB', 41)

    packet[12] = RgbModeEnum[rgb.mode]
    packet[13] = rgb.mode === 'CoveringMarquee' ? 0xff : 0x00 // this is just dumb
    packet[14] = RgbSpeedEnum[rgb.speed]
    packet[16] = rgb.color.red
    packet[17] = rgb.color.green
    packet[18] = rgb.color.blue

    const recv = this._write(packet, skipValidation, skipReadback)

    return recv
  }

  public close(): void {
    this._device.close()
  }
}
