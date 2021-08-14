import { HID } from 'node-hid'

interface FanSensorData {
  RPM: number
  PWM: number
}
interface SensorData {
  T1: number | undefined
  T2: number | undefined
  T3: number | undefined
  FLO: number
  LVL: LevelData
}
interface DeviceInformation {
  T1: number | undefined
  T2: number | undefined
  T3: number | undefined
  F1: FanSensorData
  F2: FanSensorData
  F3: FanSensorData
  F4: FanSensorData
  F5: FanSensorData
  F6: FanSensorData
  Lx: LightData
  FLO: number
  LVL: LevelData
}
interface LightColor {
  Red: number
  Green: number
  Blue: number
}
interface LightData {
  Color: LightColor
  Mode: LightMode
  Speed: LightSpeed
}

type LevelData = 'Warning' | 'Good'
type FanPort = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'
type LightMode =
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
type LightSpeed =
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

enum LightModeEnum {
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
enum LightSpeedEnum {
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

export function getFanspeed(device: HID, fanPort: FanPort): FanSensorData {
  const packet = createPacket('Read', fanPort)

  device.write(fixPacket(packet))
  const recv = device.readSync()

  return {
    RPM: parseInt('0x' + recv[12].toString(16) + padLeadingZeros(recv[13].toString(16), 2)),
    PWM: recv[21],
  }
}

export function getLightmode(device: HID): LightData {
  const packet = createPacket('Read', 'Lx')
  device.write(fixPacket(packet))
  const recv = device.readSync()

  return {
    Color: { Red: recv[13], Green: recv[14], Blue: recv[15] },
    Mode: LightModeEnum[recv[9]] as LightMode,
    Speed: LightSpeedEnum[recv[11]] as LightSpeed,
  }
}

export function getSensors(device: HID): SensorData {
  const packet = createPacket('Read', 'Sx')

  packet[9] = 0x20 // offset for checksum? length of answer?

  device.write(fixPacket(packet))
  const recv = device.readSync()

  return {
    T1: recv[11] !== 231 ? recv[11] : undefined,
    T2: recv[15] !== 231 ? recv[15] : undefined,
    T3: recv[19] !== 231 ? recv[19] : undefined,
    FLO: recv[23],
    LVL: recv[27] === 100 ? 'Good' : 'Warning',
  }
}

export function getInformation(device: HID): DeviceInformation {
  const sensorData = getSensors(device)
  return {
    T1: sensorData.T1,
    T2: sensorData.T2,
    T3: sensorData.T3,
    FLO: sensorData.FLO,
    LVL: sensorData.LVL,
    F1: getFanspeed(device, 'F1'),
    F2: getFanspeed(device, 'F2'),
    F3: getFanspeed(device, 'F3'),
    F4: getFanspeed(device, 'F4'),
    F5: getFanspeed(device, 'F5'),
    F6: getFanspeed(device, 'F6'),
    Lx: getLightmode(device),
  } as DeviceInformation
}

export function setFanspeed(device: HID, fanPort: FanPort, fanSpeed: number): number[] {
  const packet = createPacket('Write', fanPort)

  packet[24] = fanSpeed

  device.write(fixPacket(packet))
  return device.readSync() // I don'w know what to expect here
}

export function setLightmode(device: HID, LightData: LightData): number[] {
  const packet = createPacket('Write', 'Lx')

  packet[12] = LightModeEnum[LightData.Mode]
  packet[14] = LightSpeedEnum[LightData.Speed]
  packet[16] = LightData.Color.Red
  packet[17] = LightData.Color.Green
  packet[18] = LightData.Color.Blue

  device.write(fixPacket(packet))
  return device.readSync()
}

export function padLeadingZeros(s: string, n: number): string {
  let p = s
  while (p.length < n) p = `0${p}`
  return p
}

function createPacket(mode: CommMode, port: FanPort | 'Lx' | 'Sx'): number[] {
  const packetTemplate = [0x10, 0x12, 0x00, 0xaa, 0x01, 0x00, 0x00, 0x00, 0x00, 0x10, 0x20, 0x00]
  const packet = new Array<number>(63).fill(0)

  packetTemplate.map((val, i) => (packet[i] = val))

  const portAddress = {
    F1: [0xa0, 0xa0],
    F2: [0xa0, 0xc0],
    F3: [0xa0, 0xe0],
    F4: [0xa1, 0x00],
    F5: [0xa1, 0x20],
    F6: [0xa1, 0xe0],
    Sx: [0xa2, 0x20],
    Lx: [0xa2, 0x60],
  }

  if (mode === 'Read') {
    packet[2] = 0x08
    packet[5] = 0x03
  } else if (mode === 'Write') {
    packet[2] = 0x29
    packet[5] = 0x10
  }

  portAddress[port].map((val, i) => (packet[6 + i] = val))

  return packet
}

// workaround for first byte going MIA :shrug:
function fixPacket(packet: number[]): number[] {
  packet.unshift(0x00)
  packet.pop()
  return packet
}
