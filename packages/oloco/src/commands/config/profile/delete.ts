import type { Arguments, Argv } from 'yargs'
import { Config } from '../../../config'

export const command = 'delete [name]'
export const describe = 'Delete a custom fan profile.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('name', {
    type: 'string',
    describe: 'The name of the profile to delete.',
  })

export const handler = (yargs: Arguments): void => {
  const name = yargs['name'] as string
  const profiles = Config.get('profiles')
  if (profiles[name]) {
    delete profiles[name]
    Config.set('profiles', profiles)
  }
}
