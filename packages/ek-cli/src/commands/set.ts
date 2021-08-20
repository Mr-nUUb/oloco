import { Argv } from 'yargs'

export const command = 'set <port>'
export const describe = 'Set a specific port.'

export const builder = (yargs: Argv): Argv => yargs.commandDir('set', { extensions: ['js', 'ts'] })
