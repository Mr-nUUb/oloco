import fanSilent from '../res/silent.json'
import fanBalanced from '../res/balanced.json'
import fanMax from '../res/max.json'
import {
  FanPort,
  getFan,
  getSensors,
  setFan,
  setLights,
  sleep,
  TempPort,
} from '@ek-loop-connect/ek-lib'
import { FanProfileCurves, FanProfilePoint, openController } from '../common'
import { config, FanConfig, FlowConfig, LevelConfig, TempConfig } from '../config'
import Logger from 'js-logger'
import { HID } from 'node-hid'

Logger.useDefaults()

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user configuration.'

export const handler = async (): Promise<void> => {
  //Logger.setLevel(Logger[LogLevel[config.get('logger.level') as LogLevel]])

  const device = openController()
  Logger.info('Successfully connected to controller!')

  setLights(device, config.get('lights'))

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
      const tempConfig = (config.get('sensors.temps') as TempConfig[]).find(
        (cfg) => cfg.id === port,
      ) as TempConfig
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

    const flowConfig = config.get('sensors.flow') as FlowConfig
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

    const levelConfig = config.get('sensors.level') as LevelConfig
    if (levelConfig.enabled) {
      if (levelConfig.warning && current.level === 'warning') {
        Logger.warn(`Sensor ${levelConfig.name} is below warning level!`)
      }
    }

    Logger.time('Set Fans')
    fanportIterable.forEach((port) => {
      const fanConfig = config.get('fans').find((cfg) => cfg.id === port) as FanConfig
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
          (config.get('sensors.temps') as TempConfig[]).find(
            (cfg) => cfg.id === fanConfig.tempSource,
          ) as TempConfig
        ).offset
        const curve = fanProfiles.profiles[fanConfig.activeProfile]
        const index = nextLowerPoint(curve, currentTemp)
        const lower = curve[index]
        const higher = curve[index + 1]
        const speed = interpolate(currentTemp, lower.x, higher.x, lower.y, higher.y)

        Logger.info(`Fan ${name}: Current ${currentSpeed} RPM; New ${speed}%`)
        setFan(device, port, speed)
      }
    })
    Logger.timeEnd('Set Fans')

    Logger.timeEnd('Loop')
    await sleep(1000)
  }
}

function nextLowerPoint(curve: FanProfilePoint[], find: number) {
  let max = 0
  curve.forEach((value) => {
    if (value.x < find && value.x - find > max - find) max = value.x
  })
  return curve.findIndex((val) => val.x === max)
}

function interpolate(x: number, x1: number, x2: number, y1: number, y2: number) {
  return Math.round(y1 + ((y2 - y1) * (x - x1)) / (x2 - x1))
}

const fanportIterable: ReadonlyArray<FanPort> = ['fan1', 'fan2', 'fan3', 'fan4', 'fan5', 'fan6']
const tempportIterable: ReadonlyArray<TempPort> = ['temp1', 'temp2', 'temp3']

/*
enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
}
*/
