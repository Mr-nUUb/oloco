import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import util from 'util'
import { Config } from '../../config'
import { convertConfigEntry } from '../../cli.common'

const overview = Object.keys(Config.store).join(', ')

export const command = 'get [entry]'
export const describe = 'Query an entry from the current configuration.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('entry', {
    type: 'string',
    describe: `The entry to query. To get an overview, try one of [${overview}].`,
  })

export const handler = (yargs: Arguments): void => {
  const entry = yargs.entry as string
  const key = convertConfigEntry(entry)

  const value = Config.get(key)
  if (!value || !key) {
    console.error(`Entry "${entry}" does not exist!`)
    exit(2)
  }

  console.log(`${entry}: ${util.inspect(value, { depth: null, colors: true })}`)
}
