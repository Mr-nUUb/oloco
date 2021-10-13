import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import { Config, CustomProfile } from '../../../config'

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

  if (profiles.filter((p) => p.name === name).length) {
    console.log(`A profile named "${name}" already exists!`)
    exit(1)
  }

  const next = profiles.length
  const profile: CustomProfile = { name, profile: [] }
  try {
    Config.set(`profiles.${next}`, profile)
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
  }
}
