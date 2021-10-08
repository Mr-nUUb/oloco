import { Arguments, Argv } from 'yargs'
import { EkLoopConnect, FanPort, fanportIterable } from '@ek-loop-connect/ek-lib'

export const command = 'fans [port]'
export const describe = 'Get actual fan speed and setting of a specific port.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('port', {
    choices: fanportIterable,
    describe: 'The fan(s) to read.',
  })

export const handler = (yargs: Arguments): void => {
  const port = yargs.port ? (yargs.port as FanPort) : undefined
  const controller = new EkLoopConnect()

  const data = controller.getFan(port)

  controller.close()
  console.log(data)
}
