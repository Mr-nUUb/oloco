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

export const command = 'curves [port]'
export const describe = 'Get PWM response curves for a specific fan port.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('port', {
    choices: fanPortChoices,
    describe: 'The fan(s) to read.',
    default: 'all',
  })

export const handler = async (yargs: Arguments): Promise<void> => {
  let data: FanData[] | AllFanPwmCurveData
  const port = yargs.port as FanPorts
  const controller = openController()

  if (port === 'all') data = await getFanPwmCurves(controller)
  else data = await getFanPwmCurve(controller, port as FanPort)

  controller.close()
  console.log(util.inspect(data, { depth: null }))
}
