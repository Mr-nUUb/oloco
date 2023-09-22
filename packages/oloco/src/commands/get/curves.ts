import { OLoCo } from '../../lib/oloco'
import type { FanPort } from '../../lib/types'
import type { Arguments, Argv } from 'yargs'
import { Config } from '../../config'
import { logObject } from '../../util'
import { FanPorts } from '../../lib/iterables'

export const command = 'curves [port]'
export const describe = 'Get PWM response curves for a specific fan port or all ports.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('port', {
      choices: FanPorts,
      describe: 'The fan(s) to read.',
    })
    .option('s', {
      alias: 'save',
      default: false,
      describe: 'Save the response curve to the configuration if specified.',
      type: 'boolean',
    })

export const handler = async (yargs: Arguments): Promise<void> => {
  const port = (yargs['port'] as FanPort) || undefined
  const save = yargs['save'] as boolean

  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  const curves = await controller.getResponseCurve(port)

  if (save) for (const curve of curves) Config.set(`fans.${curve.port}.responseCurve`, curve.curve)

  logObject(curves)
  controller.close()
}
