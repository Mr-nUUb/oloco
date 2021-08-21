import { Arguments, Argv } from 'yargs'
import { fanPortChoices, FanPorts, openController } from '../../common'
import { FanData, AllFanData, setFan, setFans, getFan, getFans } from '@ek-loop-connect/ek-lib'

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
  let data: FanData | AllFanData
  const port = yargs.port as FanPorts
  const speed = yargs.speed as number
  const controller = openController()

  if (port === 'all') {
    setFans(controller, speed)
    data = getFans(controller)
  } else {
    setFan(controller, port, speed)
    data = getFan(controller, port)
  }

  controller.close()
  console.log(data)
}
