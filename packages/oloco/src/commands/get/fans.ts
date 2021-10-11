import { Arguments, Argv } from 'yargs'
import { OLoCo, FanPort, fanportIterable } from '@oloco/oloco'
import { logObject } from 'oloco/src/cli.common'

export const command = 'fans [port]'
export const describe = 'Get actual fan speed and setting of a specific port.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('port', {
    choices: fanportIterable,
    describe: 'The fan(s) to read.',
  })

export const handler = (yargs: Arguments): void => {
  const port = (yargs.port as FanPort) || undefined

  const controller = new OLoCo()
  const data = controller.getFan(port)
  controller.close()

  logObject(data)
}
