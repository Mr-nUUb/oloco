import { Argv } from 'yargs'

export const command = 'set <port>'
export const describe = 'Configure a specific port or feature.'

export const builder = (yargs: Argv): Argv => yargs.commandDir('set', { extensions: ['js', 'ts'] })
