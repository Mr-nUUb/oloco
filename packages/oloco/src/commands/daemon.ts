import {
  OLoCo,
  fanportIterable,
  tempportIterable,
  RgbData,
  SensorData,
  FanData,
} from '@oloco/oloco'
import { FanProfileCurves, FanProfilePoint } from '../cli.common'
import { Config, DaemonConfig } from '../config'
import Logger from 'js-logger'
import util from 'util'
import { exit } from 'process'
import {
  AirBalanced,
  AirSilent,
  LiquidBalanced,
  LiquidPerformance,
  LiquidSilent,
  Max,
} from '../profiles'

Logger.useDefaults()

let controller: OLoCo
let oldFan: FanData[]
let oldRgb: RgbData
let daemonConfig: DaemonConfig
let logCounter = 0

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user Configuration.'

export const handler = async (): Promise<void> => {
  daemonConfig = Config.get('daemon')

  Logger.setLevel(Logger[LogLevel[daemonConfig.logLevel]])

  try {
    controller = new OLoCo()
    controller.setReadTimeout(Config.get('readTimeout'))
    Logger.info('Successfully connected to controller!')

    oldRgb = controller.getRgb()
    oldFan = controller.getFan()

    const interval = setInterval(() => {
      const current = controller.getSensor()
      handleRgb()
      handleSensor(current)
      handleFan(current)
      logCounter++
    }, daemonConfig.interval)

    process
      .on('SIGTERM', () => {
        Logger.info('SIGTERM signal received, setting all fans to 100%.')
        clearInterval(interval)
        controller.setFan(100)
        process.exit(0)
      })
      .on('SIGINT', () => {
        Logger.info('SIGINT signal received, setting all fans to 100%.')
        clearInterval(interval)
        controller.setFan(100)
        process.exit(0)
      })
  } catch (error) {
    if (error instanceof Error) Logger.error(error.message)
    exit(1)
  }
}

function findLessOrEqual(curve: FanProfilePoint[], find: number) {
  let max = 0
  const match = curve.find((c) => c.temp === find)
  if (match) return match
  curve.forEach((value) => {
    if (value.temp < find && value.temp - find > max - find) max = value.temp
  })
  return curve.find((val) => val.temp === max) as FanProfilePoint
}

function findGreater(curve: FanProfilePoint[], find: number) {
  let min = 100
  curve.forEach((value) => {
    if (value.temp > find && value.temp + find < min + find) min = value.temp
  })
  return curve.find((val) => val.temp === min) as FanProfilePoint
}

function interpolate(x: number, x1: number, x2: number, y1: number, y2: number) {
  return Math.round(y1 + ((y2 - y1) * (x - x1)) / (x2 - x1))
}

function equalRgb(rgb1: RgbData, rgb2: RgbData): boolean {
  return (
    rgb1.mode === rgb2.mode &&
    rgb1.speed === rgb2.speed &&
    rgb1.color.red === rgb2.color.red &&
    rgb1.color.green === rgb2.color.green &&
    rgb1.color.blue === rgb2.color.blue
  )
}

function handleSensor(sensor: SensorData) {
  tempportIterable.forEach((port) => {
    const tempConfig = Config.get('temps')[port]

    if (tempConfig.enabled) {
      const name = tempConfig.name

      let temp = sensor.temps.find((t) => t.port === port)?.temp

      if (!temp) {
        Logger.warn(`Couldn't read temperature ${name}: unknown error!`)
        return
      } else if (temp == 231) {
        Logger.warn(`Couldn't read temperature ${name}: not connected!`)
        return
      }

      const warn = tempConfig.warning
      temp += tempConfig.offset

      if (temp > warn) {
        logThreshold(
          LogLevel.warn,
          `Temp ${name} is above warning temperature: ${temp} > ${warn} °C!`,
        )
      } else {
        logThreshold(LogLevel.info, `Temp ${name}: ${temp} °C`)
      }
    }
  })

  const flowConfig = Config.get('flow')
  if (flowConfig.enabled) {
    const name = flowConfig.name
    const warn = flowConfig.warning
    const flow = (sensor.flow.flow * flowConfig.signalsPerLiter) / 100
    if (flow < warn) {
      logThreshold(LogLevel.warn, `Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
    } else {
      logThreshold(LogLevel.info, `Sensor ${name}: ${flow} l/h`)
    }
  }

  const levelConfig = Config.get('level')
  if (levelConfig.enabled) {
    if (levelConfig.warning && sensor.level.level === 'warning') {
      logThreshold(LogLevel.warn, `Sensor ${levelConfig.name} is below warning level!`)
    }
  }
}

function handleRgb() {
  const newRgb = Config.get('rgb')

  if (!equalRgb(newRgb, oldRgb)) {
    Logger.info(
      `Update RGB setting: ${util.inspect(newRgb, { depth: null, colors: false, compact: true })}`,
    )
    controller.setRgb(newRgb)
    oldRgb = newRgb
  }
}

function handleFan(sensor: SensorData) {
  fanportIterable.forEach((port) => {
    const fanConfig = Config.get('fans')[port]

    if (fanConfig.enabled) {
      const name = fanConfig.name
      const warn = fanConfig.warning
      const currentFan = controller.getFan(port)[0]
      const currentRpm = currentFan.rpm

      if (currentRpm < warn) {
        logThreshold(
          LogLevel.warn,
          `Fan ${name} is below warning speed: ${currentRpm} < ${warn} RPM!`,
        )
      }

      const customProfile = Config.get('profiles')[fanConfig.customProfile]

      if (fanConfig.activeProfile === 'custom' && !customProfile) {
        console.warn(
          `Custom profile "${fanConfig.customProfile}" not found, falling back to "air_balanced".`,
        )
      }

      const fanProfiles: FanProfileCurves = {
        profiles: {
          air_silent: AirSilent,
          air_balanced: AirBalanced,
          liquid_silent: LiquidSilent,
          liquid_balanced: LiquidBalanced,
          liquid_performance: LiquidPerformance,
          max: Max,
          custom: customProfile || AirBalanced,
        },
      }

      let currentTemp = sensor.temps.find((t) => t.port === fanConfig.tempSource)?.temp

      if (!currentTemp) {
        Logger.error("Couldn't read current temperature!")
        return
      }

      currentTemp += Config.get('temps')[fanConfig.tempSource].offset

      const curve = fanProfiles.profiles[fanConfig.activeProfile]
      const lower = findLessOrEqual(curve, currentTemp)
      const higher = findGreater(curve, currentTemp)
      const speed = interpolate(currentTemp, lower.temp, higher.temp, lower.pwm, higher.pwm)

      const fanIndex = oldFan.findIndex((f) => f.port === port)

      logThreshold(LogLevel.info, `Fan ${name}: ${currentFan.pwm}%, ${currentRpm} RPM`)

      if (oldFan[fanIndex].pwm !== speed) {
        Logger.info(`Update Fan ${name}: ${speed}%`)
        controller.setFan(speed, port)
        oldFan[fanIndex].pwm = speed
      }
    }
  })
}

function logThreshold(level: LogLevel, message: string) {
  if (logCounter === 0 || logCounter % daemonConfig.logThreshold === 0) {
    if (level === LogLevel.debug) Logger.debug(message)
    if (level === LogLevel.info) Logger.info(message)
    if (level === LogLevel.warn) Logger.warn(message)
    if (level === LogLevel.error) Logger.error(message)
  }
}

enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
}
