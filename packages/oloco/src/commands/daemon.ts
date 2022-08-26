import { OLoCo } from '../lib/oloco'
import type { FanProfilePoint, RgbData, SensorData, FanData } from '../lib/interfaces'
import { Config } from '../config'
import Logger, { ILogHandler } from 'js-logger'
import { inspect } from 'util'
import { exit } from 'process'
import {
  AirBalanced,
  AirSilent,
  LiquidBalanced,
  LiquidPerformance,
  LiquidSilent,
  Maximum,
} from '../lib/profiles'
import { FanPorts, TempPorts } from '../lib/iterables'
import type { AppConfig, FanProfileCurves, LogTarget } from '../lib/types'
import { LogLevel } from '../lib/enums'
import exitHook from 'exit-hook'

let defaultLogger: ILogHandler
let controller: OLoCo
let oldFan: FanData[]
let oldRgb: RgbData
let daemonConfig: AppConfig['daemon']
let currentLogTarget: LogTarget
let logCounter = 0

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user Configuration.'

export const handler = async (): Promise<void> => {
  try {
    setupLogger()

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

      handleLogger()
    }, Config.get('daemon').interval)

    exitHook(() => {
      logCounter = 0
      Logger.info('Daemon terminating, setting all fans to 100%.')
      clearInterval(interval)
      controller.setFan(100)
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
  TempPorts.forEach((port) => {
    const tempConfig = Config.get('temps')[port]

    if (tempConfig.enabled) {
      const name = tempConfig.name

      let temp = sensor.temps.find((t) => t.port === port)?.temp

      if (!temp) {
        Logger.warn("Couldn't read current temperature!")
        return
      }

      const warn = tempConfig.warning
      temp += tempConfig.offset

      if (temp > warn) {
        Logger.warn(`Temp ${name} is above warning temperature: ${temp} > ${warn} °C!`)
      } else {
        Logger.info(`Temp ${name}: ${temp} °C`)
      }
    }
  })

  const flowConfig = Config.get('flow')
  if (flowConfig.enabled) {
    const name = flowConfig.name
    const warn = flowConfig.warning
    const flow = (sensor.flow.flow * flowConfig.signalsPerLiter) / 100
    if (flow < warn) {
      Logger.warn(`Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
    } else {
      Logger.info(`Sensor ${name}: ${flow} l/h`)
    }
  }

  const levelConfig = Config.get('level')
  if (levelConfig.enabled) {
    if (levelConfig.warning && sensor.level.level === 'Warning') {
      Logger.warn(`Sensor ${levelConfig.name} is below warning level!`)
    }
  }
}

function handleRgb() {
  const newRgb = Config.get('rgb')

  if (!equalRgb(newRgb, oldRgb)) {
    Logger.info(`Update RGB setting: ${inspect(newRgb, { compact: true })}`)
    controller.setRgb(newRgb)
    oldRgb = newRgb
  }
}

function handleFan(sensor: SensorData) {
  FanPorts.forEach((port) => {
    const fanConfig = Config.get('fans')[port]

    if (fanConfig.enabled) {
      const name = fanConfig.name
      const warn = fanConfig.warning
      const currentFan = controller.getFan(port)[0]
      const currentRpm = currentFan.rpm

      if (currentRpm < warn) {
        Logger.warn(`Fan ${name} is below warning speed: ${currentRpm} < ${warn} RPM!`)
      }

      const customProfile = Config.get('profiles')[fanConfig.customProfile]

      if (fanConfig.activeProfile === 'Custom' && !customProfile) {
        Logger.warn(
          `Custom profile "${fanConfig.customProfile}" not found, falling back to "AirBalanced".`,
        )
      }

      const fanProfiles: FanProfileCurves = {
        AirSilent,
        AirBalanced,
        LiquidSilent,
        LiquidBalanced,
        LiquidPerformance,
        Maximum,
        Custom: customProfile || AirBalanced,
      }

      const temps: number[] = []
      fanConfig.tempSources.forEach((src) => {
        const currentSensor = sensor.temps.find((s) => s.port === src)
        if (!currentSensor || !currentSensor.temp) {
          Logger.warn(`Couldn't read temperature sensor: ${inspect(currentSensor)}`)
          return
        }
        const currentTemp = currentSensor.temp + Config.get('temps')[currentSensor.port].offset
        temps.push(currentTemp)
      })

      const tempMode = fanConfig.tempMode
      const controlTemp = tempMode === 'Average' ? average(...temps) : Math.max(...temps)

      const curve = fanProfiles[fanConfig.activeProfile]
      const lower = findLessOrEqual(curve, controlTemp)
      const higher = findGreater(curve, controlTemp)
      const speed = interpolate(controlTemp, lower.temp, higher.temp, lower.pwm, higher.pwm)

      const fanIndex = oldFan.findIndex((f) => f.port === port)

      Logger.info(`Fan ${name}: ${currentFan.pwm}%, ${currentRpm} RPM`)

      if (oldFan[fanIndex].pwm !== speed) {
        Logger.info(`Update Fan ${name}: ${speed}%`)
        controller.setFan(speed, port)
        oldFan[fanIndex].pwm = speed
      }
    }
  })
}

function handleLogger() {
  setupLogger()
  logCounter++
}

function setupLogger() {
  daemonConfig = Config.get('daemon')

  if (!defaultLogger) {
    Logger.useDefaults()
    defaultLogger = Logger.createDefaultHandler()
  }

  const level = Logger[LogLevel[daemonConfig.logLevel]]
  if (Logger.getLevel() !== level) Logger.setLevel(level)

  if (currentLogTarget !== daemonConfig.logTarget) {
    switch (daemonConfig.logTarget) {
      case 'None':
        Logger.setHandler(() => {
          // log nothing
        })
        break

      case 'Console':
        Logger.setHandler((msg, ctx) => {
          if (logCounter === -1 || logCounter % daemonConfig.logThreshold === 0) {
            const prefix = generateLogPrefix()
            defaultLogger([prefix, ...msg], ctx)
            logCounter = 0
          }
        })
        break
    }
    currentLogTarget = daemonConfig.logTarget
  }
}

function getTimestamp() {
  switch (Config.get('daemon').timestampFormat) {
    case 'ISO':
      return new Date().toISOString()
    case 'UNIX':
      return Date.now().toString()
    case 'UTC':
      return new Date().toUTCString()
  }
}

function generateLogPrefix() {
  const level = Logger.getLevel().name.padEnd(5)
  return `[ ${getTimestamp()} | ${level} ]>`
}

function average(...values: number[]) {
  return values.length > 1 ? values.reduce((x, s) => s + x) / values.length : values[0]
}
