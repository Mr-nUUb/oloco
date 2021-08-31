import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import util from 'util'
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
  let value = Config.get(entry)

  if (!value || !entry) {
    console.error(`Entry "${entry}" does not exist!`)
    exit(2)
  }

  if (typeof value === 'string') value = `"${value}"`
  console.log(`${entry}: ${util.inspect(value, { depth: null, colors: true })}`)
}
