import { Argv } from 'yargs'

export const command = 'get <port>'
export const describe = 'Get a specific port.'

export const builder = (yargs: Argv): Argv => yargs.commandDir('get', { extensions: ['js', 'ts'] })
