import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import { Config, CustomProfile } from '../../../config'

export const command = 'copy [name] [newName]'
export const describe = 'Copy a custom fan profile.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('name', {
      type: 'string',
      describe: 'The name of the profile to copy.',
    })
    .positional('newName', {
      type: 'string',
      describe: 'The name of the new profile.',
    })

export const handler = (yargs: Arguments): void => {
  const name = yargs.name as string
  const newName = yargs.newName as string

  if (name === newName) {
    console.error(`Duplicate profile names are not allowed!`)
    exit(1)
  }

  const profiles = Config.get('profiles')
  const index = profiles.findIndex((p) => p.name === name)

  if (index === -1) {
    console.error(`Couldn't find profile "${name}"!`)
    exit(2)
  }

  const next = profiles.length
  const profile = profiles[index]
  profile.name = newName

  try {
    Config.set(`profiles.${next}`, profile)
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
  }
}
