import type { Argv } from 'yargs'

export const command = 'profile <action>'
export const describe = 'Work with custom fan profiles.'

export const builder = (yargs: Argv): Argv =>
  yargs.commandDir('profile', { extensions: ['js', 'ts'] })
