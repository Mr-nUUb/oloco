import { EkLoopConnect, FanPort, fanportIterable } from '@ek-loop-connect/ek-lib'
import { Arguments, Argv } from 'yargs'
import util from 'util'
import { Config } from '../../config'

export const command = 'curves [port]'
export const describe = 'Get PWM response curves for a specific fan port or all ports.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('port', {
      choices: fanportIterable,
      describe: 'The fan(s) to read.',
    })
    .option('s', {
      alias: 'save',
      default: false,
      describe: 'Save the response curve to the configuration if specified.',
      type: 'boolean',
    })

export const handler = async (yargs: Arguments): Promise<void> => {
  const port = (yargs.port as FanPort) || undefined
  const save = yargs.save as boolean

  const controller = new EkLoopConnect()
  const curves = await controller.getResponseCurve(port)
  if (save) {
    curves.forEach((curve) => {
      const index = Config.get('fans').findIndex((fan) => fan.port === curve.port)
      Config.set(`fans.${index}.responseCurve`, curve.curve)
    })
  }

  console.log(util.inspect(curves, { depth: null, colors: true }))
  controller.close()
}
