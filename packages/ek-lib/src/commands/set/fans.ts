import { Arguments, Argv } from 'yargs'
import { fanPortChoices, FanPorts } from '../../common'
import { EkLoopConnect, FanData } from '@ek-loop-connect/ek-lib'

export const command = 'fans <port> <speed>'
export const describe = 'Set a speed of a fan or all fans.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('port', {
      choices: fanPortChoices,
      describe: 'The fan(s) to configure.',
    })
    .positional('speed', {
      type: 'number',
      describe: 'The desired fan speed (PWM duty cycle).',
    })

export const handler = (yargs: Arguments): void => {
  let data: FanData | FanData[]
  const port = yargs.port as FanPorts
  const speed = yargs.speed as number
  const controller = new EkLoopConnect()

  if (port === 'all') {
    controller.setFans(speed)
    data = controller.getFans()
  } else {
    controller.setFan(port, speed)
    data = controller.getFan(port)
  }

  controller.close()
  console.log(data)
}
