import { exit } from 'process'
import { Arguments, Argv } from 'yargs'
import { Config } from '../../config'

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

  if (Config.get(entry) === undefined) {
    console.error(`Entry "${entry}" does not exist!`)
    exit(2)
  }
  if (entry.endsWith('.id')) {
    console.error('Changing IDs is not allowed!')
    exit(1)
  }

  let val: string | number | boolean
  if (!isNaN(Number.parseInt(value))) val = Number.parseInt(value)
  else if (value.toUpperCase() === 'TRUE') val = true
  else if (value.toUpperCase() === 'FALSE') val = false
  else val = value as string

  try {
    Config.set(entry, val)

    val = Config.get(entry)
    if (typeof val === 'string') val = `"${val}"`
    console.log(`${entry}: ${val}`)
  } catch (error) {
    console.error(`Couldn't set entry "${entry}"! Wrong type?`)
    exit(1)
  }
}
