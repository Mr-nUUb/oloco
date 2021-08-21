import { Arguments, Argv } from 'yargs'
import { fanPortChoices, FanPorts, openController } from '../../common'
import { FanData, AllFanData, getFan, getFans } from '@ek-loop-connect/ek-lib'

export const command = 'fans [port]'
export const describe = 'Get actual fan speed and setting of a specific port.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('port', {
    choices: fanPortChoices,
    describe: 'The fan(s) to read.',
    default: 'all',
  })

export const handler = (yargs: Arguments): void => {
  let data: FanData | AllFanData
  const port = yargs.port as FanPorts
  const controller = openController()

  if (port === 'all') data = getFans(controller)
  else data = getFan(controller, port)

  controller.close()
  console.log(data)
}
