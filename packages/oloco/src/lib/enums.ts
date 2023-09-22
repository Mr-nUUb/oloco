export enum DeviceIdentifier {
  VID = 0x04_83,
  PID = 0x57_50,
}

export enum PortAddressEnum {
  F1 = 0xa0_a0,
  F2 = 0xa0_c0,
  F3 = 0xa0_e0,
  F4 = 0xa1_00,
  F5 = 0xa1_20,
  F6 = 0xa1_e0,
  Sensor = 0xa2_20,
  RGB = 0xa2_60,
}

export enum RgbModeEnum {
  Off = 0x00,
  Static = 0x01,
  Breathing = 0x02,
  Fading = 0x03,
  Marquee = 0x04,
  CoveringMarquee = 0x05,
  Pulse = 0x06,
  SpectrumWave = 0x07,
  Rainbow = 0x07,
  Alternating = 0x08,
  Candle = 0x09,
}

export enum RgbSpeedEnum {
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

export enum CommModeEnum {
  Read = 0x03,
  Write = 0x10,
}

export enum LogLevelEnum {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
}
