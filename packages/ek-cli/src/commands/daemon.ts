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
import fs from 'fs'
import { configFilePath, UserConfig } from '../userconfig'
import Logger from 'js-logger'
import { HID } from 'node-hid'

Logger.useDefaults()

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user configuration.'

export const handler = async (): Promise<void> => {
  const userConfig = loadUserConfig()

  const device = openController()
  Logger.info('Successfully connected to controller!')

  setLights(device, userConfig.lights)

  await loop(device, userConfig)

  device.close()
}

function loadUserConfig() {
  if (!fs.existsSync(configFilePath)) {
    Logger.error(`Config file "${configFilePath}" does not exist, please create first!`)
    exit(2)
  }
  const userConfig: UserConfig = JSON.parse(fs.readFileSync(configFilePath).toString())
  Logger.setLevel(Logger[LogLevel[userConfig.logger.level]])
  Logger.info('Successfully loaded user config!')
  logUserConfig(userConfig)
  return userConfig
}

function logUserConfig(userConfig: UserConfig) {
  Logger.info()
  fanportIterable.forEach((port) => {
    const name = userConfig.fans[port].name
    if (userConfig.fans[port].enabled) {
      const profile = userConfig.fans[port].activeProfile
      const tempSource = userConfig.sensors.temps[userConfig.fans[port].tempSource].name
      const warn = userConfig.fans[port].warning
      Logger.info(`Fan ${name}: Profile ${profile}; Temp Source ${tempSource}; Warning ${warn} RPM`)
    } else {
      Logger.info(`Fan ${name}: disabled`)
    }
  })

  tempportIterable.forEach((port) => {
    const name = userConfig.sensors.temps[port].name
    if (userConfig.sensors.temps[port].enabled) {
      const offset = userConfig.sensors.temps[port].offset
      const warn = userConfig.sensors.temps[port].warning
      Logger.info(`Temp ${name}: Offset ${offset} °C; Warning ${warn} °C`)
    } else {
      Logger.info(`Temp ${name}: disabled`)
    }
  })

  let name = userConfig.sensors.flow.name
  if (userConfig.sensors.flow.enabled) {
    const signals = userConfig.sensors.flow.signalsPerLiter
    const warn = userConfig.sensors.flow.warning
    Logger.info(`Sensor ${name}: ${signals} signals/l; Warning ${warn} l/h`)
  } else {
    Logger.info(`Sensor ${name}: disabled`)
  }

  name = userConfig.sensors.level.name
  if (userConfig.sensors.level.enabled) {
    const warn = userConfig.sensors.level.warning
    Logger.info(`Sensor ${name}: Warning ${warn ? 'enabled' : 'disabled'}`)
  } else {
    Logger.info(`Sensor ${name}: disabled`)
  }

  const mode = userConfig.lights.mode
  const speed = userConfig.lights.speed
  const red = userConfig.lights.color.red
  const green = userConfig.lights.color.green
  const blue = userConfig.lights.color.blue
  Logger.info(`Lights: Mode ${mode}; Speed ${speed}; Red ${red} Green ${green} Blue ${blue}`)

  Logger.info()
}

async function loop(device: HID, userConfig: UserConfig) {
  while (device) {
    const current = getSensors(device)

    tempportIterable.forEach((port) => {
      if (userConfig.sensors.temps[port].enabled) {
        const name = userConfig.sensors.temps[port].name
        let temp = current.temps[port]
        const warn = userConfig.sensors.temps[port].warning
        if (!temp) {
          Logger.error("Couldn't read current temperature!")
          device.close()
          exit(2)
        }
        temp += userConfig.sensors.temps[port].offset
        if (temp > userConfig.sensors.temps[port].warning) {
          Logger.warn(`Temp ${name} is above warning temperature: ${temp} > ${warn} °C!`)
        } else {
          Logger.info(`Temp ${name}: ${temp} °C`)
        }
      }
    })

    if (userConfig.sensors.flow.enabled) {
      const name = userConfig.sensors.flow.name
      const flow = (current.flow * userConfig.sensors.flow.signalsPerLiter) / 100
      const warn = userConfig.sensors.flow.warning
      if (flow < warn) {
        Logger.warn(`Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
      } else {
        Logger.info(`Sensor ${name}: ${flow} l/h`)
      }
    }

    if (userConfig.sensors.level.enabled) {
      const name = userConfig.sensors.level.name
      const level = current.level
      const warn = userConfig.sensors.level.warning
      if (warn && level === 'warning') {
        Logger.warn(`Sensor ${name} is below warning level!`)
      }
    }

    fanportIterable.forEach((port) => {
      if (userConfig.fans[port].enabled) {
        const name = userConfig.fans[port].name
        const currentSpeed = getFan(device, port).rpm
        const warn = userConfig.fans[port].warning
        if (currentSpeed < warn) {
          Logger.warn(`Fan ${name} is below warning speed: ${currentSpeed} < ${warn} RPM!`)
        }
        const fanProfiles: FanProfileCurves = {
          profiles: {
            silent: fanSilent,
            balanced: fanBalanced,
            max: fanMax,
            custom: userConfig.fans[port].customProfile,
          },
        }
        let currentTemp = current.temps[userConfig.fans[port].tempSource]
        if (!currentTemp) {
          Logger.error("Couldn't read current temperature!")
          device.close()
          exit(2)
        }
        currentTemp += userConfig.sensors.temps[userConfig.fans[port].tempSource].offset
        const profile = userConfig.fans[port].activeProfile
        const curve = fanProfiles.profiles[profile]
        const index = nextLowerPoint(curve, currentTemp)
        const lower = curve[index]
        const higher = curve[index + 1]
        const speed = interpolate(currentTemp, lower.x, higher.x, lower.y, higher.y)

        Logger.info(`Fan ${userConfig.fans[port].name}: Current ${currentSpeed} RPM; New ${speed}%`)
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
