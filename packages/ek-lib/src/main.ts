import { HID } from 'node-hid'

interface FanData {
  RPM: number
  PWM: number
}
interface SensorData {
  Temps: { [key in TempPort]: number | undefined }
  Flow: number
  Level: LevelData
}
interface DeviceInformation {
  Sensors: SensorData
  Fans: { [key in FanPort]: FanData }
  Lights: LightData
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
type FanPort = 'Fan1' | 'Fan2' | 'Fan3' | 'Fan4' | 'Fan5' | 'Fan6'
type TempPort = 'Temp1' | 'Temp2' | 'Temp3'
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

const readTimeout = 1000

export function getFanspeed(device: HID, fanPort: FanPort): FanData {
  const packet = createPacket('Read', fanPort)
  const recv = sendPacket(device, packet)

  return {
    RPM: parseInt('0x' + recv[12].toString(16) + padLeadingZeros(recv[13].toString(16), 2)),
    PWM: recv[21],
  }
}

export function getLightmode(device: HID): LightData {
  const packet = createPacket('Read', 'Lights')
  const recv = sendPacket(device, packet)

  return {
    Mode: LightModeEnum[recv[9]] as LightMode,
    Speed: LightSpeedEnum[recv[11]] as LightSpeed,
    Color: { Red: recv[13], Green: recv[14], Blue: recv[15] },
  }
}

export function getSensors(device: HID): SensorData {
  const packet = createPacket('Read', 'Sensors')

  packet[9] = 0x20 // offset for checksum? length of answer?

  const recv = sendPacket(device, packet)

  return {
    Temps: {
      Temp1: recv[11] !== 231 ? recv[11] : undefined,
      Temp2: recv[15] !== 231 ? recv[15] : undefined,
      Temp3: recv[19] !== 231 ? recv[19] : undefined,
    },
    Flow: recv[23],
    Level: recv[27] === 100 ? 'Good' : 'Warning',
  }
}

export function getInformation(device: HID): DeviceInformation {
  return {
    Sensors: getSensors(device),
    Fans: {
      Fan1: getFanspeed(device, 'Fan1'),
      Fan2: getFanspeed(device, 'Fan2'),
      Fan3: getFanspeed(device, 'Fan3'),
      Fan4: getFanspeed(device, 'Fan4'),
      Fan5: getFanspeed(device, 'Fan5'),
      Fan6: getFanspeed(device, 'Fan6'),
    },
    Lights: getLightmode(device),
  }
}

export function setFanspeed(device: HID, fanPort: FanPort, fanSpeed: number): number[] {
  const packet = createPacket('Write', fanPort)

  packet[24] = fanSpeed

  const recv = sendPacket(device, packet) // I don'w know what to expect here

  return recv
}

export function setLightmode(device: HID, LightData: LightData): number[] {
  const packet = createPacket('Write', 'Lights')

  packet[12] = LightModeEnum[LightData.Mode]
  packet[14] = LightSpeedEnum[LightData.Speed]
  packet[16] = LightData.Color.Red
  packet[17] = LightData.Color.Green
  packet[18] = LightData.Color.Blue

  const recv = sendPacket(device, packet) // I don'w know what to expect here

  return recv
}

export function padLeadingZeros(s: string, n: number): string {
  let p = s
  while (p.length < n) p = `0${p}`
  return p
}

function createPacket(mode: CommMode, port: FanPort | 'Lights' | 'Sensors'): number[] {
  const packet = new Array<number>(63)

  const packetTemplate = [0x10, 0x12, 0x00, 0xaa, 0x01, 0x00, 0x00, 0x00, 0x00, 0x10, 0x20]
  const portAddress = {
    Fan1: [0xa0, 0xa0],
    Fan2: [0xa0, 0xc0],
    Fan3: [0xa0, 0xe0],
    Fan4: [0xa1, 0x00],
    Fan5: [0xa1, 0x20],
    Fan6: [0xa1, 0xe0],
    Sensors: [0xa2, 0x20],
    Lights: [0xa2, 0x60],
  }
  const commMode = {
    Read: [0x00, 0x00, 0x08, 0x00, 0x00, 0x03],
    Write: [0x00, 0x00, 0x29, 0x00, 0x00, 0x10],
  }

  for (let i = 0; i < packet.length; i++) {
    if (i === 2 || i === 5) packet[i] = commMode[mode][i]
    else if (i === 6 || i === 7) packet[i] = portAddress[port][i - 6]
    else if (i < packetTemplate.length) packet[i] = packetTemplate[i]
    else packet[i] = 0
  }

  return packet
}

function sendPacket(device: HID, packet: number[]): number[] {
  // workaround for first byte going MIA :shrug:
  packet.unshift(0x00)
  packet.pop()

  device.write(packet)
  const recv = device.readTimeout(readTimeout)
  if (recv.length === 0) throw 'Unable to read response!'
  // check response here.
  // since checksums are optional (the controller accepts packages w/o checksums),
  // I don't know if we want to do it.
  return recv
}
