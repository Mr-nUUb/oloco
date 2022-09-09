import { OLoCo } from '../lib/oloco'
import type { FanProfilePoint, RgbData, SensorData, FanData, LogData } from '../lib/interfaces'
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
import type { AppConfig, FanProfileCurves, LogTarget, PartialLogData } from '../lib/types'
import { LogLevel } from '../lib/enums'
import exitHook from 'exit-hook'
import { access, appendFile, rm, stat } from 'fs/promises'
import { EOL } from 'os'
import { dirname } from 'path'
import { constants as FsConstants } from 'fs'

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

      const rgb = handleRgb()
      const sensors = handleSensor(current)
      const fans = handleFan(current)

      handleLogger({ fans, rgb, sensors })
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

function handleSensor(sensor: SensorData): PartialLogData['sensors'] {
  let resultTemps: LogData['sensors']['temps'] | undefined = undefined
  let resultFlow: LogData['sensors']['flow'] | undefined = undefined
  let resultLevel: LogData['sensors']['level'] | undefined = undefined

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
      }

      const addTemp = { port, name, temp }
      if (!resultTemps) resultTemps = [addTemp]
      else resultTemps.push(addTemp)
    }
  })

  const flowConfig = Config.get('flow')
  if (flowConfig.enabled) {
    const name = flowConfig.name
    const warn = flowConfig.warning
    const flow = (sensor.flow.flow * flowConfig.signalsPerLiter) / 100

    if (flow < warn) {
      Logger.warn(`Sensor ${name} is below warning flow: ${flow} < ${warn} l/h!`)
    }

    resultFlow = { port: 'FLO', name, flow }
  }

  const levelConfig = Config.get('level')
  if (levelConfig.enabled) {
    const name = levelConfig.name
    const level = sensor.level.level
    if (levelConfig.warning && level === 'Warning') {
      Logger.warn(`Sensor ${name} is below warning level!`)
    }
    resultLevel = { port: 'LVL', name, level }
  }

  return { temps: resultTemps, flow: resultFlow, level: resultLevel }
}

function handleRgb(): PartialLogData['rgb'] {
  const newRgb = Config.get('rgb')

  if (newRgb.enabled) {
    if (!equalRgb(newRgb, oldRgb)) {
      controller.setRgb(newRgb)
      oldRgb = newRgb
    }
    return { ...newRgb, port: 'Lx' }
  } else {
    oldRgb = { ...newRgb, mode: 'Off' }
    Config.set('rgb', oldRgb)
    controller.setRgb(oldRgb)
  }
}

function handleFan(sensor: SensorData): PartialLogData['fans'] {
  let resultFans: PartialLogData['fans'] = undefined

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

      if (oldFan[fanIndex].pwm !== speed) {
        controller.setFan(speed, port)
        oldFan[fanIndex].pwm = speed
      }

      const addFan = { port, name, pwm: speed, rpm: currentRpm }
      if (!resultFans) resultFans = [addFan]
      else resultFans.push(addFan)
    }
  })

  return resultFans
}

function handleLogger(data: PartialLogData) {
  setupLogger()
  Logger.info(data)
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
          if (checkLogCounter()) {
            defaultLogger(buildMessage(msg, ctx), ctx)
            logCounter = 0
          } else if (ctx.level === Logger.WARN || ctx.level === Logger.ERROR) {
            defaultLogger(buildMessage(msg, ctx), ctx)
          }
        })
        break

      case 'File':
        Logger.setHandler((msg, ctx) => {
          const file = daemonConfig.logFile
          if (checkLogCounter()) {
            access(dirname(file), FsConstants.R_OK | FsConstants.W_OK)
              .then(() => {
                access(file)
                  .then(() => {
                    stat(file).then((stats) => {
                      if (stats.size > daemonConfig.logFileMaxSizeMB * 1024 * 1024) {
                        rm(file)
                      }
                    })
                  })
                  .catch((_err) => {
                    const err = _err as NodeJS.ErrnoException
                    if (err.errno !== -2) console.error(err)
                  })

                appendFile(file, `${buildMessage(msg, ctx)}${EOL}`)
              })
              .catch((_err) => {
                const err = _err as NodeJS.ErrnoException
                console.error(err)
              })

            logCounter = 0
          } else if (ctx.level === Logger.WARN || ctx.level === Logger.ERROR) {
            appendFile(file, `${buildMessage(msg, ctx)}${EOL}`)
          }
        })
        break
    }
    currentLogTarget = daemonConfig.logTarget
  }
}
function checkLogCounter() {
  return logCounter === -1 || logCounter % daemonConfig.logThreshold === 0
}

function buildMessage(msgs: Parameters<ILogHandler>[0], ctx: Parameters<ILogHandler>[1]) {
  const logMode = Config.get('daemon').logMode
  const data = Object.values(msgs)

  const msg = {
    timestamp: getTimestamp(),
    level: ctx.level.name,
    messages: [] as unknown[],
  }

  data.forEach((d) => {
    switch (logMode) {
      case 'JSON':
        msg.messages.push(d)
        break
      case 'Text':
        if (typeof d === 'string') {
          msg.messages.push(d)
        } else {
          msg.messages.push(...buildMessageFromControllerData(d as PartialLogData))
        }
        break
    }
  })

  switch (logMode) {
    case 'JSON':
      return [JSON.stringify(msg)]
    case 'Text':
      return [`[ ${msg.timestamp} | ${msg.level.padEnd(5)} ]> ${msg.messages.join(' | ')}`]
  }
}

function buildMessageFromControllerData(data: PartialLogData) {
  const txtMsg: string[] = []

  if (data.sensors) {
    if (data.sensors.temps) {
      data.sensors.temps.forEach((t) => {
        txtMsg.push(`Temp "${t.name}" (${t.port}): ${t.temp}°C`)
      })
    }

    if (data.sensors.flow) {
      const f = data.sensors.flow
      txtMsg.push(`Flow "${f.name}" (${f.port}): ${f.flow} l/h`)
    }

    if (data.sensors.level) {
      const l = data.sensors.level
      txtMsg.push(`Level "${l.name}" (${l.port}): ${l.level}`)
    }
  }

  if (data.fans) {
    data.fans.forEach((f) => {
      txtMsg.push(`Fan "${f.name}" (${f.port}): ${f.pwm}%, ${f.rpm} RPM`)
    })
  }

  if (data.rgb) {
    const r = data.rgb
    const msg: string[] = [
      `RGB "${r.name}" (${r.port}): Mode: ${r.mode}`,
      `Speed: ${r.speed}`,
      `Color: R:${r.color?.red} G:${r.color?.green} B:${r.color?.blue}`,
    ]
    txtMsg.push(msg.join(', '))
  }

  return txtMsg
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

function average(...values: number[]) {
  return values.length > 1 ? values.reduce((x, s) => s + x) / values.length : values[0]
}
