import { CurveData, getResponseCurve, getResponseCurves } from '@ek-loop-connect/ek-lib'
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
  let logData: CurveData | CurveData[]
  const save = yargs.save as boolean
  const port = yargs.port as FanPorts

  const controller = openController()
  if (port === 'all') {
    const data = await getResponseCurves(controller)
    logData = data
    if (save) {
      const fanConfig = Config.get('fans')
      data.forEach((curve) => {
        const fan = fanConfig.find((f) => f.port === curve.port) as FanConfig
        const index = fanConfig.indexOf(fan)
        Config.set(`fans.${index}.responseCurve`, curve.curve)
      })
    }
  } else {
    const data = await getResponseCurve(controller, port)
    logData = data
    if (save) {
      const fanConfig = Config.get('fans')
      const fan = fanConfig.find((f) => f.port === port) as FanConfig
      const i = fanConfig.indexOf(fan)
      Config.set(`fans.${i}.responseCurve`, data)
    }
  }

  console.log(util.inspect(logData, { depth: null, colors: true }))
  controller.close()
}
