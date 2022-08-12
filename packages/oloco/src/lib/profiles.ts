import type { FanProfilePoint } from './interfaces'

export const AirBalanced: FanProfilePoint[] = [
  { temp: 0, pwm: 25 },
  { temp: 30, pwm: 25 },
  { temp: 40, pwm: 30 },
  { temp: 50, pwm: 50 },
  { temp: 60, pwm: 70 },
  { temp: 70, pwm: 90 },
  { temp: 80, pwm: 100 },
  { temp: 100, pwm: 100 },
]

export const AirSilent: FanProfilePoint[] = [
  { temp: 0, pwm: 25 },
  { temp: 30, pwm: 25 },
  { temp: 40, pwm: 30 },
  { temp: 50, pwm: 40 },
  { temp: 60, pwm: 50 },
  { temp: 70, pwm: 70 },
  { temp: 80, pwm: 100 },
  { temp: 100, pwm: 100 },
]

export const LiquidBalanced: FanProfilePoint[] = [
  { temp: 0, pwm: 20 },
  { temp: 29, pwm: 20 },
  { temp: 30, pwm: 30 },
  { temp: 31, pwm: 47 },
  { temp: 32, pwm: 55 },
  { temp: 33, pwm: 69 },
  { temp: 34, pwm: 85 },
  { temp: 35, pwm: 100 },
  { temp: 100, pwm: 100 },
]

export const LiquidPerformance: FanProfilePoint[] = [
  { temp: 0, pwm: 35 },
  { temp: 26, pwm: 35 },
  { temp: 27, pwm: 40 },
  { temp: 28, pwm: 50 },
  { temp: 29, pwm: 65 },
  { temp: 30, pwm: 76 },
  { temp: 31, pwm: 90 },
  { temp: 32, pwm: 100 },
  { temp: 100, pwm: 100 },
]

export const LiquidSilent: FanProfilePoint[] = [
  { temp: 0, pwm: 20 },
  { temp: 32, pwm: 20 },
  { temp: 33, pwm: 30 },
  { temp: 34, pwm: 38 },
  { temp: 36, pwm: 50 },
  { temp: 38, pwm: 72 },
  { temp: 40, pwm: 80 },
  { temp: 42, pwm: 100 },
  { temp: 100, pwm: 100 },
]

export const Max: FanProfilePoint[] = [
  { temp: 0, pwm: 100 },
  { temp: 100, pwm: 100 },
]
