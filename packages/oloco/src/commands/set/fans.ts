import type { Arguments, Argv } from 'yargs'
import { OLoCo } from '../../lib/oloco'
import type { FanPort } from '../../lib/types'
import { logObject } from '../../util'
import { Config } from '../../config'
import { FanPorts } from '../../lib/iterables'

export const command = 'fans <speed> [port]'
export const describe = 'Set a fan or all fans to run at a certain speed.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('speed', {
      type: 'number',
      describe: 'The desired fan speed (PWM duty cycle).',
    })
    .positional('port', {
      choices: FanPorts,
      describe: 'The fan(s) to configure.',
    })

export const handler = (yargs: Arguments): void => {
  const port = (yargs['port'] as FanPort) || undefined
  const speed = yargs['speed'] as number
  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  controller.setFan(speed, port)
  const data = controller.getFan(port)
  controller.close()

  logObject(data)
}
