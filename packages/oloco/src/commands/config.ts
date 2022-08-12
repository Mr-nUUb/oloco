import type { Argv } from 'yargs'

export const command = 'config <action>'
export const describe = 'Get or set configuration values or delete the current configuration file.'

export const builder = (yargs: Argv): Argv =>
  yargs.commandDir('config', { extensions: ['js', 'ts'] })
