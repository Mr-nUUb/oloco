import fanSilent from '../res/silent.json'
import fanBalanced from '../res/balanced.json'
import fanMax from '../res/max.json'
import {
  OLoCo,
  fanportIterable,
  tempportIterable,
  RgbData,
  SensorData,
  FanData,
} from '@oloco/oloco'
import { FanProfileCurves, FanProfilePoint } from '../cli.common'
import { Config, FanConfig, TempConfig } from '../config'
import Logger from 'js-logger'
import { Arguments, Argv } from 'yargs'

Logger.useDefaults()

let controller: OLoCo
let oldFan: FanData[]
let oldRgb: RgbData

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user Configuration.'

export const builder = (yargs: Argv): Argv =>
  yargs.option('i', {
    alias: 'interval',
    default: 1000,
    describe: 'The interval in milliseconds to perform actions.',
    type: 'number',
  })

export const handler = async (yargs: Arguments): Promise<void> => {
  const interval = yargs.interval as number

  Logger.setLevel(Logger[LogLevel[Config.get('logger').level]])

  controller = new OLoCo()
  Logger.info('Successfully connected to controller!')

  loop(interval)
}

function loop(interval: number) {
  oldRgb = controller.getRgb()
  oldFan = controller.getFan()

  setInterval(() => {
    const current = controller.getSensor()
    handleRgb()
    handleSensor(current)
    handleFan(current)
  }, interval)
}

function nextLowerFanProfilePoint(curve: FanProfilePoint[], find: number) {
  let max = 0
  curve.forEach((value) => {
    if (value.temp < find && value.temp - find > max - find) max = value.temp
  })
  return curve.findIndex((val) => val.temp === max)
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
    const tempConfig = Config.get('temps').find((cfg) => cfg.port === port) as TempConfig
    if (tempConfig.enabled) {
      const name = tempConfig.name
      const warn = tempConfig.warning
      let temp = sensor.temps.find((t) => t.port === port)?.temp
      if (!temp) {
        Logger.warn("Couldn't read current temperature!")
        return
      }
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
    if (levelConfig.warning && sensor.level.level === 'warning') {
      Logger.warn(`Sensor ${levelConfig.name} is below warning level!`)
    }
  }
}

function handleRgb() {
  const newRgb = Config.get('rgb')
  if (!equalRgb(newRgb, oldRgb)) {
    controller.setRgb(newRgb)
    oldRgb = newRgb
  }
}

function handleFan(sensor: SensorData) {
  fanportIterable.forEach((port) => {
    const fanConfig = Config.get('fans').find((cfg) => cfg.port === port) as FanConfig
    if (fanConfig.enabled) {
      const name = fanConfig.name
      const warn = fanConfig.warning
      const currentSpeed = controller.getFan(port)[0].rpm
      if (currentSpeed < warn) {
        Logger.warn(`Fan ${name} is below warning speed: ${currentSpeed} < ${warn} RPM!`)
      }
      const fanProfiles: FanProfileCurves = {
        profiles: {
          silent: fanSilent,
          balanced: fanBalanced,
          max: fanMax,
          custom: fanConfig.customProfile,
        },
      }
      let currentTemp = sensor.temps.find((t) => t.port === fanConfig.tempSource)?.temp
      if (!currentTemp) {
        Logger.error("Couldn't read current temperature!")
        return
      }
      currentTemp += (
        Config.get('temps').find((cfg) => cfg.port === fanConfig.tempSource) as TempConfig
      ).offset
      const curve = fanProfiles.profiles[fanConfig.activeProfile]
      const index = nextLowerFanProfilePoint(curve, currentTemp)
      const lower = curve[index]
      const higher = curve[index + 1]
      const speed = interpolate(currentTemp, lower.temp, higher.temp, lower.pwm, higher.pwm)

      const fanIndex = oldFan.findIndex((f) => f.port === port)
      if (oldFan[fanIndex].pwm !== speed) {
        Logger.info(`Fan ${name}: Current ${currentSpeed} RPM; New ${speed}%`)
        controller.setFan(speed, port)
        oldFan[fanIndex].pwm = speed
      }
    }
  })
}

enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
}
