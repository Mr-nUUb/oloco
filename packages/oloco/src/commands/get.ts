import type { Argv } from 'yargs'

export const command = 'get <port>'
export const describe = 'Query a specific port or feature.'

export const builder = (yargs: Argv): Argv => yargs.commandDir('get', { extensions: ['js', 'ts'] })
