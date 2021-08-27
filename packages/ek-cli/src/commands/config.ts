import { Argv } from 'yargs'

export const command = 'config <action>'
export const describe = 'Create or delete the user configuration file.'

export const builder = (yargs: Argv): Argv =>
  yargs.commandDir('config', { extensions: ['js', 'ts'] })
