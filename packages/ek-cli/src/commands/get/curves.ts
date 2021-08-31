import {
  AllFanPwmCurveData,
  FanData,
  FanPort,
  getFanPwmCurve,
  getFanPwmCurves,
} from '@ek-loop-connect/ek-lib'
import { Arguments, Argv } from 'yargs'
import util from 'util'
import { fanPortChoices, FanPorts, openController } from '../../common'
import { Config, FanConfig } from '../../config'

export const command = 'curves [port]'
export const describe = 'Get PWM response curves for a specific fan port.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('port', {
      choices: fanPortChoices,
      describe: 'The fan(s) to read.',
      default: 'all',
    })
    .option('s', {
      alias: 'save',
      default: false,
      describe: 'Save the response curve to the configuration if specified.',
      type: 'boolean',
    })

export const handler = async (yargs: Arguments): Promise<void> => {
  let logData: FanData[] | AllFanPwmCurveData
  const save = yargs.save as boolean
  const port = yargs.port as FanPorts

  const controller = openController()
  if (port === 'all') {
    const data = await getFanPwmCurves(controller)
    logData = data
    if (save) {
      const fanConfig = Config.get('fans')
      for (const element in data.curves) {
        const fan = fanConfig.find((f) => f.id === (element as FanPort)) as FanConfig
        const i = fanConfig.indexOf(fan)
        Config.set(`fans.${i}.responseCurve`, data.curves[element as FanPort])
      }
    }
  } else {
    const data = await getFanPwmCurve(controller, port as FanPort)
    logData = data
    if (save) {
      const fanConfig = Config.get('fans')
      const fan = fanConfig.find((f) => f.id === port) as FanConfig
      const i = fanConfig.indexOf(fan)
      Config.set(`fans.${i}.responseCurve`, data)
    }
  }

  console.log(util.inspect(logData, { depth: null, colors: true }))
  controller.close()
}
