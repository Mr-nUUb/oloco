import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import { Config } from '../../../config'
import { FanProfilePoint } from '../../../cli.common'

export const command = 'create [name]'
export const describe = 'Create a custom fan profile.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('name', {
    type: 'string',
    describe: 'The name of the new profile.',
  })

export const handler = (yargs: Arguments): void => {
  const name = yargs.name as string
  const profiles = Config.get('profiles')

  if (profiles[name]) {
    console.log(`A profile named "${name}" already exists!`)
    exit(1)
  }

  const profile: FanProfilePoint[] = []
  try {
    Config.set(`profiles.${name}`, profile)
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
  }
}
