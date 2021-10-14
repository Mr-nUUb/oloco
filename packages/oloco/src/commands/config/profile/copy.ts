import { fanProfileChoices, FanProfileName, FanProfilePoint } from '../../../cli.common'
import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import { Config } from '../../../config'
import fanSilent from '../../../res/silent.json'
import fanBalanced from '../../../res/balanced.json'
import fanMax from '../../../res/max.json'

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
  const profiles = Config.get('profiles')

  if (name === newName || profiles[newName]) {
    console.error(`Duplicate profile names are not allowed!`)
    exit(1)
  }

  //const profile: CustomProfile = { name: newName, profile: [] }
  let profile: FanProfilePoint[]

  if (!profiles[name]) {
    if (fanProfileChoices.some((f) => f === name)) {
      const predefined = {
        balanced: fanBalanced as FanProfilePoint[],
        silent: fanSilent as FanProfilePoint[],
        max: fanMax as FanProfilePoint[],
        custom: [] as FanProfilePoint[],
      }
      profile = predefined[name as FanProfileName]
    } else {
      console.error(`Couldn't find profile "${name}"!`)
      exit(2)
    }
  } else {
    profile = profiles[name]
  }

  try {
    Config.set(`profiles.${newName}`, profile)
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
  }
}
