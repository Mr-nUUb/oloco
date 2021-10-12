import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import { Config } from '../../../config'
import prompt from 'prompt'
import { FanProfilePoint, logObject } from '../../../cli.common'

export const command = 'update [name]'
export const describe = 'Update a custom fan profile.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('name', {
    type: 'string',
    describe: 'The name of the profile to copy.',
  })

export const handler = async (yargs: Arguments): Promise<void> => {
  const name = yargs.name as string
  const profiles = Config.get('profiles')
  const index = profiles.findIndex((p) => p.name === name)

  if (index === -1) {
    console.error(`Couldn't find profile "${name}"!`)
    exit(2)
  }

  const profile = profiles[index]

  prompt.start()

  profile.profile = []
  let breakpoint = 0

  console.log('Please enter temperature breakpoints and their PWM duty cycle.')
  console.log('Start with temperature `0` and end with temperature `100`.')
  console.log('Do not enter duplicate values!')
  while (breakpoint < 100) {
    const point = await prompt.get([
      {
        name: 'temp',
        description: 'temperature',
        type: 'number',
        required: true,
      },
      {
        name: 'pwm',
        description: 'PWM duty cycle',
        type: 'number',
        required: true,
      },
    ])

    const fanPoint: FanProfilePoint = {
      temp: parseInt(point.temp.toString()),
      pwm: parseInt(point.pwm.toString()),
    }

    profile.profile.push(fanPoint)
    breakpoint = fanPoint.temp
  }

  console.log()
  console.log('Preview:')
  logObject(profile)

  const cont = (
    await prompt.get([
      {
        name: 'continue',
        description: 'continue',
        type: 'boolean',
        required: true,
        default: true,
      },
    ])
  ).continue as boolean

  if (cont) {
    Config.set(`profiles.${index}`, profile)
  }
}
