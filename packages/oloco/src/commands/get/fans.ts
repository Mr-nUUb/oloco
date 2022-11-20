import type { Arguments, Argv } from 'yargs'
import { OLoCo } from '../../lib/oloco'
import type { FanPort } from '../../lib/types'
import { logObject } from '../../util'
import { Config } from '../../config'
import { FanPorts } from '../../lib/iterables'

export const command = 'fans [port]'
export const describe = 'Get actual fan speed and setting of a specific port.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('port', {
    choices: FanPorts,
    describe: 'The fan(s) to read.',
  })

export const handler = (yargs: Arguments): void => {
  const port = (yargs.port as FanPort) || undefined
  const skipValidation = yargs.skipValidation as boolean

  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  const data = controller.getFan(port, skipValidation)
  controller.close()

  logObject(data)
}
