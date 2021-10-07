import { CurveData, getResponseCurve, getResponseCurves } from '@ek-loop-connect/ek-lib'
import { Arguments, Argv } from 'yargs'
import util from 'util'
import { fanPortChoices, FanPorts, openController } from '../../common'
import { Config } from '../../config'

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
      data.forEach((curve) => setCurve(curve))
    }
  } else {
    const data = await getResponseCurve(controller, port)
    logData = data
    if (save) {
      setCurve(data)
    }
  }

  console.log(util.inspect(logData, { depth: null, colors: true }))
  controller.close()
}

function setCurve(curve: CurveData): void {
  const index = Config.get('fans').findIndex((f) => f.port === curve.port)
  Config.set(`fans.${index}.responseCurve`, curve.curve)
}
