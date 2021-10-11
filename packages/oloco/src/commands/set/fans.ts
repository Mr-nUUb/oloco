import { Arguments, Argv } from 'yargs'
import { OLoCo, FanPort, fanportIterable } from '@oloco/oloco'
import { logObject } from '../../cli.common'

export const command = 'fans <speed> [port]'
export const describe = 'Set a speed of a fan or all fans.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('speed', {
      type: 'number',
      describe: 'The desired fan speed (PWM duty cycle).',
    })
    .positional('port', {
      choices: fanportIterable,
      describe: 'The fan(s) to configure.',
    })

export const handler = (yargs: Arguments): void => {
  const port = (yargs.port as FanPort) || undefined
  const speed = yargs.speed as number

  const controller = new OLoCo()
  controller.setFan(speed, port)
  const data = controller.getFan(port)
  controller.close()

  logObject(data)
}
