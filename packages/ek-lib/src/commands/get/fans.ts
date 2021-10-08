import { Arguments, Argv } from 'yargs'
import { fanPortChoices, FanPorts } from '../../common'
import { EkLoopConnect, FanData } from '@ek-loop-connect/ek-lib'

export const command = 'fans [port]'
export const describe = 'Get actual fan speed and setting of a specific port.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('port', {
    choices: fanPortChoices,
    describe: 'The fan(s) to read.',
    default: 'all',
  })

export const handler = (yargs: Arguments): void => {
  let data: FanData | FanData[]
  const port = yargs.port as FanPorts
  const controller = new EkLoopConnect()

  if (port === 'all') data = controller.getFans()
  else data = controller.getFan(port)

  controller.close()
  console.log(data)
}
