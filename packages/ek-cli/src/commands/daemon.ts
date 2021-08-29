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
import { exit } from 'process'
import { loadConfig, Config } from '../config'
import Logger from 'js-logger'
import { HID } from 'node-hid'

Logger.useDefaults()

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user configuration.'

export const handler = async (): Promise<void> => {
  const config = loadConfig()
  Logger.setLevel(Logger[LogLevel[config.logger.level]])
  logConfig(config)

  const device = openController()
  Logger.info('Successfully connected to controller!')

  setLights(device, config.lights)

  await loop(device, config)

  device.close()
}

function logConfig(config: Config) {
  Logger.info()
  fanportIterable.forEach((port) => {
    const name = config.fans[port].name
    if (config.fans[port].enabled) {
      const profile = config.fans[port].activeProfile
      const tempSource = config.sensors.temps[config.fans[port].tempSource].name
      const warn = config.fans[port].warning
      Logger.info(`Fan ${name}: Profile ${profile}; Temp Source ${tempSource}; Warning ${warn} RPM`)
    } else {
      Logger.info(`Fan ${name}: disabled`)
    }
  })

  tempportIterable.forEach((port) => {
    const name = config.sensors.temps[port].name
    if (config.sensors.temps[port].enabled) {
      const offset = config.sensors.temps[port].offset
      const warn = config.sensors.temps[port].warning
      Logger.info(`Temp ${name}: Offset ${offset} °C; Warning ${warn} °C`)
    } else {
      Logger.info(`Temp ${name}: disabled`)
    }
  })

  let name = config.sensors.flow.name
  if (config.sensors.flow.enabled) {
    const signals = config.sensors.flow.signalsPerLiter
    const warn = config.sensors.flow.warning
    Logger.info(`Sensor ${name}: ${signals} signals/l; Warning ${warn} l/h`)
  } else {
    Logger.info(`Sensor ${name}: disabled`)
  }

  name = config.sensors.level.name
  if (config.sensors.level.enabled) {
    const warn = config.sensors.level.warning
    Logger.info(`Sensor ${name}: Warning ${warn ? 'enabled' : 'disabled'}`)
  } else {
    Logger.info(`Sensor ${name}: disabled`)
  }

  const mode = config.lights.mode
  const speed = config.lights.speed
  const red = config.lights.color.red
  const green = config.lights.color.green
  const blue = config.lights.color.blue
  Logger.info(`Lights: Mode ${mode}; Speed ${speed}; Red ${red} Green ${green} Blue ${blue}`)

  Logger.info()
}

async function loop(device: HID, config: Config) {
  while (device) {
    const current = getSensors(device)

    tempportIterable.forEach((port) => {
      if (config.sensors.temps[port].enabled) {
        const name = config.sensors.temps[port].name
        let temp = current.temps[port]
        const warn = config.sensors.temps[port].warning
        if (!temp) {
          Logger.error("Couldn't read current temperature!")
          device.close()
          exit(2)
        }
        temp += config.sensors.temps[port].offset
        if (temp > config.sensors.temps[port].warning) {
          Logger.warn(`Temp ${name} is above warning temperature: ${temp} > ${warn} °C!`)
        } else {
          Logger.info(`Temp ${name}: ${temp} °C`)
        }
      }
    })

    if (config.sensors.flow.enabled) {
      const name = config.sensors.flow.name
      const flow = (current.flow * config.sensors.flow.signalsPerLiter) / 100
      const warn = config.sensors.flow.warning
      if (flow < warn) {
        Logger.warn(`Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
      } else {
        Logger.info(`Sensor ${name}: ${flow} l/h`)
      }
    }

    if (config.sensors.level.enabled) {
      const name = config.sensors.level.name
      const level = current.level
      const warn = config.sensors.level.warning
      if (warn && level === 'warning') {
        Logger.warn(`Sensor ${name} is below warning level!`)
      }
    }

    fanportIterable.forEach((port) => {
      if (config.fans[port].enabled) {
        const name = config.fans[port].name
        const currentSpeed = getFan(device, port).rpm
        const warn = config.fans[port].warning
        if (currentSpeed < warn) {
          Logger.warn(`Fan ${name} is below warning speed: ${currentSpeed} < ${warn} RPM!`)
        }
        const fanProfiles: FanProfileCurves = {
          profiles: {
            silent: fanSilent,
            balanced: fanBalanced,
            max: fanMax,
            custom: config.fans[port].customProfile,
          },
        }
        let currentTemp = current.temps[config.fans[port].tempSource]
        if (!currentTemp) {
          Logger.error("Couldn't read current temperature!")
          device.close()
          exit(2)
        }
        currentTemp += config.sensors.temps[config.fans[port].tempSource].offset
        const profile = config.fans[port].activeProfile
        const curve = fanProfiles.profiles[profile]
        const index = nextLowerPoint(curve, currentTemp)
        const lower = curve[index]
        const higher = curve[index + 1]
        const speed = interpolate(currentTemp, lower.x, higher.x, lower.y, higher.y)

        Logger.info(`Fan ${config.fans[port].name}: Current ${currentSpeed} RPM; New ${speed}%`)
        setFan(device, port, speed)
      }
    })

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

enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
}
