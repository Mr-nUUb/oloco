import fanSilent from '../res/silent.json'
import fanBalanced from '../res/balanced.json'
import fanMax from '../res/max.json'
import { getFan, getSensors, setFan, setLights, sleep } from '@ek-loop-connect/ek-lib'
import {
  fanportIterable,
  FanProfileCurves,
  FanProfilePoint,
  openController,
  tempportIterable,
} from '../common'
import { Config, FanConfig, TempConfig } from '../config'
import Logger from 'js-logger'
import { HID } from 'node-hid'

Logger.useDefaults()

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user Configuration.'

export const handler = async (): Promise<void> => {
  Logger.setLevel(Logger[LogLevel[Config.get('logger').level]])

  const device = openController()
  Logger.info('Successfully connected to controller!')

  setLights(device, Config.get('lights'))

  await loop(device)

  device.close()
}

async function loop(device: HID) {
  while (device) {
    Logger.time('Loop')
    Logger.time('Get Sensors')
    const current = getSensors(device)
    Logger.timeEnd('Get Sensors')

    tempportIterable.forEach((port) => {
      const tempConfig = Config.get('temps').find((cfg) => cfg.id === port) as TempConfig
      if (tempConfig.enabled) {
        const name = tempConfig.name
        const warn = tempConfig.warning
        let temp = current.temps[port]
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
      const flow = (current.flow * flowConfig.signalsPerLiter) / 100
      if (flow < warn) {
        Logger.warn(`Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
      } else {
        Logger.info(`Sensor ${name}: ${flow} l/h`)
      }
    }

    const levelConfig = Config.get('level')
    if (levelConfig.enabled) {
      if (levelConfig.warning && current.level === 'warning') {
        Logger.warn(`Sensor ${levelConfig.name} is below warning level!`)
      }
    }

    Logger.time('Set Fans')
    fanportIterable.forEach((port) => {
      const fanConfig = Config.get('fans').find((cfg) => cfg.id === port) as FanConfig
      if (fanConfig.enabled) {
        const name = fanConfig.name
        const warn = fanConfig.warning
        const currentSpeed = getFan(device, port).rpm
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
        let currentTemp = current.temps[fanConfig.tempSource]
        if (!currentTemp) {
          Logger.error("Couldn't read current temperature!")
          return
        }
        currentTemp += (
          Config.get('temps').find((cfg) => cfg.id === fanConfig.tempSource) as TempConfig
        ).offset
        const curve = fanProfiles.profiles[fanConfig.activeProfile]
        const index = nextLowerFanProfilePoint(curve, currentTemp)
        const lower = curve[index]
        const higher = curve[index + 1]
        const speed = interpolate(currentTemp, lower.temp, higher.temp, lower.pwm, higher.pwm)

        Logger.info(`Fan ${name}: Current ${currentSpeed} RPM; New ${speed}%`)
        setFan(device, port, speed)
      }
    })
    Logger.timeEnd('Set Fans')

    Logger.timeEnd('Loop')
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

enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
}
