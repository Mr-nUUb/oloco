import fanSilent from '../res/silent.json'
import fanBalanced from '../res/balanced.json'
import fanMax from '../res/max.json'
import {
  EkLoopConnect,
  fanportIterable,
  tempportIterable,
  sleep,
  RgbData,
} from '@ek-loop-connect/ek-lib'
import { FanProfileCurves, FanProfilePoint } from '../cli.common'
import { Config, FanConfig, TempConfig } from '../config'
import Logger from 'js-logger'

Logger.useDefaults()

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user Configuration.'

export const handler = async (): Promise<void> => {
  Logger.setLevel(Logger[LogLevel[Config.get('logger').level]])

  const controller = new EkLoopConnect()
  Logger.info('Successfully connected to controller!')

  await loop(controller)

  controller.close()
}

async function loop(controller: EkLoopConnect) {
  let oldRgb = controller.getRgb()
  const oldFan = controller.getFan()

  while (controller) {
    const newRgb = Config.get('rgb')
    if (!equalRgb(newRgb, oldRgb)) {
      controller.setRgb(newRgb)
      oldRgb = newRgb
    }

    const current = controller.getSensor()

    tempportIterable.forEach((port) => {
      const tempConfig = Config.get('temps').find((cfg) => cfg.port === port) as TempConfig
      if (tempConfig.enabled) {
        const name = tempConfig.name
        const warn = tempConfig.warning
        let temp = current.temps.find((t) => t.port === port)?.temp
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
      const flow = (current.flow.flow * flowConfig.signalsPerLiter) / 100
      if (flow < warn) {
        Logger.warn(`Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
      } else {
        Logger.info(`Sensor ${name}: ${flow} l/h`)
      }
    }

    const levelConfig = Config.get('level')
    if (levelConfig.enabled) {
      if (levelConfig.warning && current.level.level === 'warning') {
        Logger.warn(`Sensor ${levelConfig.name} is below warning level!`)
      }
    }

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
        let currentTemp = current.temps.find((t) => t.port === fanConfig.tempSource)?.temp
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

    await sleep(1000)
  }
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

enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
}
