import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import { Config } from '../../config'
import { convertConfigEntry } from '../../cli.common'

export const command = 'set [entry] [value]'
export const describe = 'Change the current configuration.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('entry', {
      type: 'string',
      describe: "The entry to change. To get an overview, run 'config get -h' first.",
    })
    .positional('value', {
      type: 'string',
      describe: 'The value to set.',
    })

export const handler = (yargs: Arguments): void => {
  const entry = yargs.entry as string
  const value = yargs.value as string
  const key = convertConfigEntry(entry)

  let val: string | number | boolean
  if (!isNaN(Number.parseInt(value))) val = Number.parseInt(value)
  else if (value.toUpperCase() === 'TRUE') val = true
  else if (value.toUpperCase() === 'FALSE') val = false
  else val = value as string

  try {
    Config.set(key, val)
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
    exit(1)
  }
}
