import { Arguments, Argv } from 'yargs'
import { Config } from '../../config'

export const command = 'get [entry]'
export const describe = 'Query an entry from the current configuration.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('entry', {
    type: 'string',
    describe: 'The entry to query.',
  })

export const handler = (yargs: Arguments): void => {
  const entry = yargs.entry as string
  console.log(Config.get(entry))
}
