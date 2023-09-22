import type { FanProfileCurves, FanProfileName } from '../../../lib/types'
import { exit } from 'process'
import type { Arguments, Argv } from 'yargs'
import { Config } from '../../../config'
import {
  AirBalanced,
  AirSilent,
  LiquidBalanced,
  LiquidPerformance,
  LiquidSilent,
  Maximum,
} from '../../../lib/profiles'

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
  const name = yargs['name'] as string
  const newName = yargs['newName'] as string
  const profiles = Config.get('profiles')

  if (name === newName || profiles[newName]) {
    console.error(`Duplicate profile names are not allowed!`)
    exit(1)
  }

  const predefined: Omit<FanProfileCurves, 'Custom'> = {
    AirSilent,
    AirBalanced,
    LiquidSilent,
    LiquidBalanced,
    LiquidPerformance,
    Maximum,
  }

  const profile =
    name in profiles
      ? profiles[name]
      : name in predefined
      ? predefined[name as Exclude<FanProfileName, 'Custom'>]
      : undefined

  if (!profile) {
    console.error(`Couldn't find profile "${name}"!`)
    exit(2)
  }

  try {
    Config.set(`profiles.${newName}`, profile)
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
  }
}
