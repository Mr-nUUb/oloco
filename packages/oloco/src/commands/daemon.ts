import type { Arguments } from 'yargs'
import { OLoCo } from '../lib/oloco'
import type { FanProfilePoint, RgbData, SensorData, FanData, LogData } from '../lib/interfaces'
import { Config } from '../config'
import Logger, { ILogHandler, ILogLevel } from 'js-logger'
import { inspect } from 'util'
import { exit, platform } from 'process'
import {
  AirBalanced,
  AirSilent,
  LiquidBalanced,
  LiquidPerformance,
  LiquidSilent,
  Maximum,
} from '../lib/profiles'
import type {
  AppConfig,
  FanPort,
  FanProfileCurves,
  FanProfileName,
  LogMode,
  LogTarget,
  PartialLogData,
} from '../lib/types'
import { LogLevel } from '../lib/enums'
import exitHook from 'exit-hook'
import { appendFile, rm } from 'fs/promises'
import { EOL } from 'os'
import { sleepSync } from '../util'
import { resolve } from 'path'
import { existsSync, mkdirSync, readdir, stat } from 'fs'
import { FanPorts, TempPorts } from '../lib/iterables'

let defaultLogger: ILogHandler
let controller: OLoCo
let oldFan: FanData[]
let oldRgb: RgbData
let currentData: PartialLogData
let daemonConfig: AppConfig['daemon']
let currentLogTarget: LogTarget
let logCounter = 0
let skipValidation: boolean

export const command = 'daemon'
export const describe = 'Run this tool in daemon mode using custom user Configuration.'

export const handler = async (yargs: Arguments): Promise<void> => {
  try {
    skipValidation = yargs.skipValidation as boolean

    setupLogger()

    controller = new OLoCo()
    controller.setReadTimeout(Config.get('readTimeout'))
    Logger.info('Successfully connected to controller!')

    oldRgb = controller.getRgb(skipValidation)
    oldFan = controller.getFan(undefined, skipValidation)

    const interval = setInterval(() => {
      const current = controller.getSensor(skipValidation)

      const sensors = handleSensor(current)
      const fans = handleFan(current)
      const rgb = handleRgb()

      currentData = { fans, rgb, sensors }
      handleLogger(currentData)
    }, Config.get('daemon').interval)

    if (platform !== 'win32') {
      process.on('SIGUSR1', () => {
        console.error(buildMessage([currentData], { level: Logger.INFO }, ', ', 'Text')[0])
      })
    }

    exitHook(() => {
      logCounter = 0
      Logger.info('Daemon terminating, setting all fans to their configured `backOffSpeed`.')
      clearInterval(interval)
      sleepSync(1000)

      const fanConfigs = Config.get('fans')
      FanPorts.filter((port) => fanConfigs[port].enabled).forEach((port) => {
        const cfg = fanConfigs[port]
        controller.setFan(cfg.backOffSpeed, port, true)
      })
    })
  } catch (error) {
    if (error instanceof Error) Logger.error(error.message)
    exit(1)
  }
}

function findLessOrEqual(curve: FanProfilePoint[], find: number) {
  const maximum = curve.reduce(
    (max, cur) => (cur.temp < find && cur.temp - find > max - find ? cur.temp : max),
    0,
  )
  return curve.find((val) => val.temp === maximum)
}

function findGreater(curve: FanProfilePoint[], find: number) {
  const minimum = curve.reduce(
    (min, cur) => (cur.temp > find && cur.temp + find < min + find ? cur.temp : min),
    100,
  )
  return curve.find((val) => val.temp === minimum)
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
  const tempConfigs = Config.get('temps')
  const resultTemps: LogData['sensors']['temps'] = TempPorts.filter(
    (t) => tempConfigs[t].enabled,
  ).map((port) => {
    const tempConfig = tempConfigs[port]
    const name = tempConfig.name
    const warn = tempConfig.warning
    let temp = sensor.temps.find((t) => t.port === port)?.temp

    if (temp) {
      temp += tempConfig.offset
      if (temp > warn)
        Logger.warn(`${name || port} is above warning temperature: ${temp} > ${warn} °C!`)
    } else {
      Logger.warn(`Couldn't read temperature ${name}!`)
    }

    return { port, name, temp }
  })

  const flowConfig = Config.get('flow')
  let resultFlow: LogData['sensors']['flow'] | undefined = undefined
  if (flowConfig.enabled) {
    const name = flowConfig.name
    const warn = flowConfig.warning
    const port = sensor.flow.port
    const flow = (sensor.flow.flow * flowConfig.signalsPerLiter) / 100

    if (flow < warn) Logger.warn(`${name || port} is below warning flow: ${flow} < ${warn} l/h!`)

    resultFlow = { port, name, flow }
  }

  const levelConfig = Config.get('level')
  let resultLevel: LogData['sensors']['level'] | undefined = undefined
  if (levelConfig.enabled) {
    const name = levelConfig.name
    const port = sensor.level.port
    const level = sensor.level.level

    if (levelConfig.warning && level === 'Warning')
      Logger.warn(`${name || port} is below warning level!`)

    resultLevel = { port, name, level }
  }

  return { temps: resultTemps, flow: resultFlow, level: resultLevel }
}

function handleRgb(): PartialLogData['rgb'] {
  const newRgb = Config.get('rgb')

  if (!newRgb.enabled) newRgb.mode = 'Off'

  if (!equalRgb(newRgb, oldRgb)) {
    controller.setRgb(newRgb, skipValidation)
    oldRgb = newRgb
  }
  return { ...newRgb, port: 'Lx' }
}

function handleFan(sensor: SensorData): PartialLogData['fans'] {
  const fanConfigs = Object.entries(Config.get('fans')).filter((c) => c[1].enabled)
  const resultFans: PartialLogData['fans'] = new Array(fanConfigs.length)
  for (let i = 0; i < fanConfigs.length; i++) {
    const port = fanConfigs[i][0] as FanPort
    const fanConfig = fanConfigs[i][1]
    const name = fanConfig.name
    const warn = fanConfig.warning
    const rpm = controller.getFan(port, skipValidation)[0].rpm

    if (rpm < warn) {
      Logger.warn(`${name || port} is below warning speed: ${rpm} < ${warn} RPM!`)
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

    const allTemps = new Array<number | undefined>(fanConfig.tempSources.length)
    for (let t = 0; t < allTemps.length; t++) {
      const currentSensor = sensor.temps.find((s) => s.port === fanConfig.tempSources[t])
      if (!currentSensor || !currentSensor.temp) {
        Logger.warn(`Couldn't read temperature sensor: ${inspect(currentSensor)}`)
        allTemps[t] = undefined
        continue
      }
      allTemps[t] = currentSensor.temp + Config.get('temps')[currentSensor.port].offset
    }
    const temps = allTemps.filter((t) => typeof t !== 'undefined') as number[]

    const tempMode = fanConfig.tempMode
    const controlTemp = tempMode === 'Average' ? average(...temps) : Math.max(...temps)

    const curve = fanProfiles[fanConfig.activeProfile]
    const { lower, higher } = checkPoints(
      fanConfig.activeProfile,
      findLessOrEqual(curve, controlTemp),
      findGreater(curve, controlTemp),
    )
    const pwm = interpolate(controlTemp, lower.temp, higher.temp, lower.pwm, higher.pwm)

    const fanIndex = oldFan.findIndex((f) => f.port === port)

    if (oldFan[fanIndex].pwm !== pwm) {
      controller.setFan(pwm, port, skipValidation)
      oldFan[fanIndex].pwm = pwm
    }

    resultFans[i] = { port, name, pwm, rpm }
  }

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
          if (shouldLog(ctx.level)) {
            defaultLogger(buildMessage(msg, ctx), ctx)
            logCounter = 0
          }
        })
        break

      case 'File':
        Logger.setHandler((msg, ctx) => {
          const file = resolve(daemonConfig.logDirectory, getLogFilename())
          prepareLogDirectory()
          if (shouldLog(ctx.level)) {
            appendFile(file, `${buildMessage(msg, ctx)}${EOL}`)
            logCounter = 0
          }
        })
        break
    }
    currentLogTarget = daemonConfig.logTarget
  }
}

function getLogFilename() {
  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}.log`
}

function prepareLogDirectory() {
  const { logDirectory, logFileRetentionDays } = daemonConfig

  if (!existsSync(logDirectory)) {
    mkdirSync(logDirectory)
    return
  }

  if (logFileRetentionDays < 0) return

  readdir(logDirectory, (readdirErr, entries) => {
    if (readdirErr) console.error(readdirErr)

    const before = new Date()
    before.setDate(before.getDate() - logFileRetentionDays)
    before.setMilliseconds(0)
    before.setSeconds(0)
    before.setMinutes(0)
    before.setHours(1)
    const rmTime = before.getTime()

    for (const entry of entries) {
      const path = resolve(logDirectory, entry)
      stat(path, (statErr, stats) => {
        if (statErr) console.error(statErr)
        if (stats.isFile() && stats.ctime.getTime() < rmTime) rm(path)
      })
    }
  })
}

function shouldLog(level: ILogLevel) {
  return (
    logCounter === -1 ||
    logCounter % daemonConfig.logThreshold === 0 ||
    level === Logger.WARN ||
    level === Logger.ERROR
  )
}

function buildMessage(
  msgs: Parameters<ILogHandler>[0],
  ctx: Parameters<ILogHandler>[1],
  delimiterOverride?: string,
  modeOverride?: LogMode,
) {
  const logDelimiter = delimiterOverride || Config.get('daemon').logDelimiter
  const logMode = modeOverride || Config.get('daemon').logMode
  const data = Object.values(msgs)

  const msg = {
    timestamp: getTimestamp(),
    level: ctx.level.name,
    messages: [] as string[],
  }

  switch (logMode) {
    case 'JSON':
      msg.messages = data
      return [JSON.stringify(msg)]
    case 'Text':
      data.forEach((d) => {
        msg.messages.push(
          ...(typeof d === 'string' ? [d] : buildMessageFromControllerData(d as PartialLogData)),
        )
      })
      return [`[${msg.timestamp} ${msg.level[0]}] ${msg.messages.join(logDelimiter)}`]
  }
}

function buildMessageFromControllerData(data: PartialLogData) {
  const txtMsg: string[] = []

  // Names are optional, ports are always there

  if (data.sensors) {
    if (data.sensors.temps) {
      data.sensors.temps.forEach((t) => {
        const { name, port, temp } = t
        txtMsg.push(`${name || port}: ${temp} °C`)
      })
    }

    if (data.sensors.flow) {
      const { name, port, flow } = data.sensors.flow
      txtMsg.push(`${name || port}: ${flow} l/h`)
    }

    if (data.sensors.level) {
      const { name, port, level } = data.sensors.level
      txtMsg.push(`${name || port}: ${level}`)
    }
  }

  if (data.fans) {
    data.fans.forEach((f) => {
      const { name, port, rpm } = f
      txtMsg.push(`${name || port}: ${rpm} RPM`)
    })
  }

  if (data.rgb) {
    const { name, port, color, mode, speed } = data.rgb
    const modeInfo = mode !== 'Off' ? `/${speed}/${color?.red},${color?.green},${color?.blue}` : ``
    txtMsg.push(`${name || port}: ${mode}${modeInfo}`)
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
  return values.length > 1 ? values.reduce((x, s) => s + x, 0) / values.length : values[0]
}

function checkPoints(
  profile: FanProfileName,
  lower?: FanProfilePoint,
  higher?: FanProfilePoint,
): { lower: FanProfilePoint; higher: FanProfilePoint } {
  if (!lower || !higher) {
    const max = { pwm: 100, temp: 100 }
    Logger.warn(`Fan profile ${profile} incomplete or broken, using max values!`)
    return { lower: max, higher: max }
  }
  return { lower, higher }
}
