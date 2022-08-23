export enum RgbModeEnum {
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

export enum LogLevel {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
}
