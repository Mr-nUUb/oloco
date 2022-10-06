import { HID, devices } from 'node-hid'
import { platform } from 'os'
import type { CurveData, DeviceInformation, FanData, RgbData, SensorData } from './interfaces'
import { FanPorts, TempPorts } from './iterables'
import type { CommMode, DevicePort, FanPort } from './types'
import { sleep } from '../util'
import { RgbModeEnum, RgbSpeedEnum } from './enums'

export class OLoCo {
  private _device
  private _readTimeout = 1000

  private static _packetLength = 63

  constructor(device?: HID) {
    if (device) this._device = device
    else {
      const devs = devices(0x0483, 0x5750).filter((dev) => dev.interface === 0 && dev.usage === 1)
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

  private static _createPacket(mode: CommMode, port: DevicePort): number[] {
    const packet = new Array<number>(OLoCo._packetLength)

    const header: { [k in CommMode]: number[] } = {
      Read: [0x10, 0x12, 0x08, 0xaa, 0x01, 0x03, 0x00, 0x00, 0x00, 0x10, 0x20],
      Write: [0x10, 0x12, 0x29, 0xaa, 0x01, 0x10, 0x00, 0x00, 0x00, 0x10, 0x20],
    }

    const portAddress: { [k in DevicePort]: number[] } = {
      F1: [0xa0, 0xa0],
      F2: [0xa0, 0xc0],
      F3: [0xa0, 0xe0],
      F4: [0xa1, 0x00],
      F5: [0xa1, 0x20],
      F6: [0xa1, 0xe0],
      Sensor: [0xa2, 0x20],
      RGB: [0xa2, 0x60],
    }

    for (let i = 0; i < OLoCo._packetLength; i++) {
      if (i === 6 || i === 7) packet[i] = portAddress[port][i - 6]
      else if (i < header[mode].length) packet[i] = header[mode][i]
      else packet[i] = 0
    }

    return packet
  }

  private static _validateRecv(recv: number[], expect: number[]) {
    const write = expect[2] === 0x29
    const fans =
      (expect[6] === 0xa0 && expect[7] === 0xa0) ||
      (expect[6] === 0xa0 && expect[7] === 0xc0) ||
      (expect[6] === 0xa0 && expect[7] === 0xe0) ||
      (expect[6] === 0xa1 && expect[7] === 0x00) ||
      (expect[6] === 0xa1 && expect[7] === 0x20) ||
      (expect[6] === 0xa1 && expect[7] === 0xe0)
    const sensors = expect[6] === 0xa2 && expect[7] === 0x20
    const rgb = expect[6] === 0xa2 && expect[7] === 0x60

    // header, error out if malformed
    const header = recv.slice(0, 8)
    const expectHeader = fans
      ? [0x10, 0x12, write ? 0x27 : 0x17, 0xaa, 0x01, 0x03, 0x00, 0x10]
      : sensors
      ? [0x10, 0x12, 0x27, 0xaa, 0x01, 0x03, 0x00, 0x20]
      : rgb
      ? [0x10, 0x12, write ? 0x27 : 0x17, 0xaa, 0x01, 0x03, 0x00, 0x10]
      : []
    try {
      const len = expectHeader.length
      if (header.length !== len) throw new Error('length mismatch')
      for (let i = 0; i < len; i++) {
        if (header[i] !== expectHeader[i]) throw new Error(`mismatch on index ${i}`)
      }
    } catch (err) {
      const fmtHdr = OLoCo._formatBytes(header)
      const fmtExp = OLoCo._formatBytes(expectHeader)
      throw new Error(
        'Invalid packet received, malformed header: ' +
          `received ${fmtHdr}, expected ${fmtExp}, ${(err as Error).message}`,
      )
    }
  }

  private static _formatBytes(arr: number[]) {
    return `[ ${arr.map((n) => `0x${n.toString(16).padStart(2, '0')}`).join(', ')} ]`
  }

  private _getFan(port: FanPort): FanData {
    const recv = this._write(OLoCo._createPacket('Read', port))

    return {
      port,
      rpm: parseInt(`0x${recv[12].toString(16)}${recv[13].toString(16).padStart(2, '0')}`),
      pwm: recv[21],
    }
  }

  private _setFan(speed: number, port: FanPort): number[] {
    const packet = OLoCo._createPacket('Write', port)

    // original packet contains RPM on bytes 15 and 16 - why?
    // eg. 2584 RPM ==> packet[15]=0x0a, packet[16]=0x18
    packet[24] = speed

    const recv = this._write(packet) // I don't know what to expect here

    return recv
  }

  private _write(packet: number[]): number[] {
    // calculate checksum here. Checksum is optional though...
    // anybody got an idea what kind of checksum EKWB is using?

    // prepend report number for windows
    //if (platform() === 'win32') packet.unshift(0x00)
    this._device.write((platform() === 'win32' ? [0x00] : []).concat(packet))
    const recv = this._device.readTimeout(this._readTimeout)
    if (recv.length === 0) throw 'Unable to read response!'

    // check response here
    // since checksums are optional, I doubt checking the response is worth it

    OLoCo._validateRecv(recv, packet)

    return recv
  }

  public setReadTimeout(timeout: number): void {
    this._readTimeout = timeout
  }

  public getFan(port?: FanPort): FanData[] {
    const ports = port ? [port] : FanPorts
    const result = new Array<FanData>(ports.length)

    for (let i = 0; i < ports.length; i++) {
      result[i] = this._getFan(ports[i])
    }

    return result
  }

  public async getResponseCurve(port?: FanPort, interval = 10000): Promise<CurveData[]> {
    const pointsNr = 11
    const backups = this.getFan(port)
    const ports = port ? [port] : FanPorts
    const curves = new Array<CurveData>(ports.length)

    for (let i = 0; i < ports.length; i++) {
      curves[i] = { port: ports[i], curve: new Array(pointsNr) }
    }

    for (let i = 0; i < pointsNr; i++) {
      this.setFan(i * 10, port)
      await sleep(interval)
      for (let c = 0; c < curves.length; c++) {
        const current = this._getFan(curves[c].port)
        curves[c].curve[i] = { pwm: current.pwm, rpm: current.rpm }
      }
    }

    for (let i = 0; i < backups.length; i++) {
      this._setFan(backups[i].pwm, backups[i].port)
    }

    return curves
  }

  public getRgb(): RgbData {
    const recv = this._write(OLoCo._createPacket('Read', 'RGB'))

    return {
      port: 'Lx',
      mode: RgbModeEnum[recv[9]] as keyof typeof RgbModeEnum,
      speed: RgbSpeedEnum[recv[11]] as keyof typeof RgbSpeedEnum,
      color: { red: recv[13], green: recv[14], blue: recv[15] },
    }
  }

  public getSensor(): SensorData {
    const packet = OLoCo._createPacket('Read', 'Sensor')
    const offset = 11

    packet[9] = 0x20 // position of checksum? length of answer?

    const recv = this._write(packet)

    const flow: SensorData['flow'] = { port: 'FLO', flow: recv[23] }
    const level: SensorData['level'] = { port: 'LVL', level: recv[27] === 100 ? 'Good' : 'Warning' }
    const temps: SensorData['temps'] = new Array(TempPorts.length)

    for (let i = 0; i < temps.length; i++) {
      const temp = recv[offset + i * 4]
      temps[i] = { port: TempPorts[i], temp: temp !== 231 ? temp : undefined }
    }

    return { flow, level, temps }
  }

  public getInformation(): DeviceInformation {
    return {
      fans: this.getFan(),
      rgb: this.getRgb(),
      sensors: this.getSensor(),
    }
  }

  public setFan(speed: number, port?: FanPort): void {
    const ports = port ? [port] : FanPorts
    for (let i = 0; i < ports.length; i++) {
      this._setFan(speed, ports[i])
    }
  }

  public setRgb(rgb: RgbData): number[] {
    const packet = OLoCo._createPacket('Write', 'RGB')

    packet[12] = RgbModeEnum[rgb.mode]
    packet[13] = rgb.mode === 'CoveringMarquee' ? 0xff : 0x00 // this is just dumb
    packet[14] = RgbSpeedEnum[rgb.speed]
    packet[16] = rgb.color.red
    packet[17] = rgb.color.green
    packet[18] = rgb.color.blue

    const recv = this._write(packet) // I don't know what to expect here

    return recv
  }

  public close(): void {
    this._device.close()
  }
}
