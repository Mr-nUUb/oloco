import fanSilent from '../res/silent.json'
import fanBalanced from '../res/balanced.json'
import fanMax from '../res/max.json'
import {
  FanPort,
  getFan,
  getSensors,
  LightMode,
  LightSpeed,
  setFan,
  setLights,
  sleep,
  TempPort,
} from '@ek-loop-connect/ek-lib'
import { FanProfileCurves, FanProfileName, FanProfilePoint, openController } from '../common'
import { exit } from 'process'
import { config } from '../config'
import Logger from 'js-logger'
import { HID } from 'node-hid'

Logger.useDefaults()

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user configuration.'

export const handler = async (): Promise<void> => {
  //Logger.setLevel(Logger[LogLevel[config.get('logger.level') as LogLevel]])
  logConfig()

  const device = openController()
  Logger.info('Successfully connected to controller!')

  setLights(device, config.get('lights'))

  await loop(device)

  device.close()
}

function logConfig() {
  Logger.info()
  fanportIterable.forEach((port) => {
    const name = config.get(`fans.${port}.name`) as string
    if (config.get(`fans.${port}.enabled`) as boolean) {
      const profile = config.get(`fans.${port}.activeProfile`) as FanProfileName
      const tempSource = config.get(
        `sensors.temps.${config.get(`fans.${port}.tempSource`) as TempPort}.name`,
      ) as string
      const warn = config.get(`fans.${port}.warning`) as number
      Logger.info(`Fan ${name}: Profile ${profile}; Temp Source ${tempSource}; Warning ${warn} RPM`)
    } else {
      Logger.info(`Fan ${name}: disabled`)
    }
  })

  tempportIterable.forEach((port) => {
    const name = config.get(`sensors.temps.${port}.name`) as string
    if (config.get(`sensors.temps.${port}.enabled`) as boolean) {
      const offset = config.get(`sensors.temps.${port}.offset`) as number
      const warn = config.get(`sensors.temps.${port}.warning`) as number
      Logger.info(`Temp ${name}: Offset ${offset} °C; Warning ${warn} °C`)
    } else {
      Logger.info(`Temp ${name}: disabled`)
    }
  })

  let name = config.get(`sensors.flow.name`) as string
  if (config.get(`sensors.flow.enabled`) as boolean) {
    const signals = config.get(`sensors.flow.signalsPerLiter`) as number
    const warn = config.get(`sensors.flow.warning`) as number
    Logger.info(`Sensor ${name}: ${signals} signals/l; Warning ${warn} l/h`)
  } else {
    Logger.info(`Sensor ${name}: disabled`)
  }

  name = config.get(`sensors.level.name`) as string
  if (config.get(`sensors.level.enabled`) as boolean) {
    const warn = config.get(`sensors.level.warning`) as boolean
    Logger.info(`Sensor ${name}: Warning ${warn ? 'enabled' : 'disabled'}`)
  } else {
    Logger.info(`Sensor ${name}: disabled`)
  }

  const mode = config.get(`lights.mode`) as LightMode
  const speed = config.get(`lights.speed`) as LightSpeed
  const red = config.get(`lights.color.red`) as number
  const green = config.get(`lights.color.green`) as number
  const blue = config.get(`lights.color.blue`) as number
  Logger.info(`Lights: Mode ${mode}; Speed ${speed}; Red ${red} Green ${green} Blue ${blue}`)

  Logger.info()
}

async function loop(device: HID) {
  while (device) {
    const current = getSensors(device)

    tempportIterable.forEach((port) => {
      if (config.get(`sensors.temps.${port}.enabled`) as boolean) {
        const name = config.get(`sensors.temps.${port}.name`) as string
        let temp = current.temps[port]
        const warn = config.get(`sensors.temps.${port}.warning`) as number
        if (!temp) {
          Logger.error("Couldn't read current temperature!")
          device.close()
          exit(2)
        }
        temp += config.get(`sensors.temps.${port}.offset`) as number
        if (temp > warn) {
          Logger.warn(`Temp ${name} is above warning temperature: ${temp} > ${warn} °C!`)
        } else {
          Logger.info(`Temp ${name}: ${temp} °C`)
        }
      }
    })

    if (config.get(`sensors.flow.enabled`) as boolean) {
      const name = config.get(`sensors.flow.name`) as string
      const flow = (current.flow * (config.get(`sensors.flow.signalsPerLiter`) as number)) / 100
      const warn = config.get(`sensors.flow.warning`) as number
      if (flow < warn) {
        Logger.warn(`Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
      } else {
        Logger.info(`Sensor ${name}: ${flow} l/h`)
      }
    }

    if (config.get(`sensors.level.enabled`) as boolean) {
      const name = config.get(`sensors.level.name`) as string
      const level = current.level
      const warn = config.get(`sensors.level.warning`) as boolean
      if (warn && level === 'warning') {
        Logger.warn(`Sensor ${name} is below warning level!`)
      }
    }

    fanportIterable.forEach((port) => {
      if (config.get(`fans.${port}.enabled`) as boolean) {
        const name = config.get(`fans.${port}.name`) as string
        const currentSpeed = getFan(device, port).rpm
        const warn = config.get(`fans.${port}.warning`) as number
        if (currentSpeed < warn) {
          Logger.warn(`Fan ${name} is below warning speed: ${currentSpeed} < ${warn} RPM!`)
        }
        const fanProfiles: FanProfileCurves = {
          profiles: {
            silent: fanSilent,
            balanced: fanBalanced,
            max: fanMax,
            custom: config.get(`fans.${port}.customProfile`) as FanProfilePoint[],
          },
        }
        let currentTemp = current.temps[config.get(`fans.${port}.tempSource`) as TempPort]
        if (!currentTemp) {
          Logger.error("Couldn't read current temperature!")
          device.close()
          exit(2)
        }
        currentTemp += config.get(
          `sensors.temps.${config.get(`fans.${port}.tempSource`) as TempPort}.offset`,
        ) as number
        const profile = config.get(`fans.${port}.activeProfile`) as FanProfileName
        const curve = fanProfiles.profiles[profile]
        const index = nextLowerPoint(curve, currentTemp)
        const lower = curve[index]
        const higher = curve[index + 1]
        const speed = interpolate(currentTemp, lower.x, higher.x, lower.y, higher.y)

        Logger.info(`Fan ${name}: Current ${currentSpeed} RPM; New ${speed}%`)
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

/*
enum LogLevel {
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
}
*/
