import { Arguments, Argv } from 'yargs'
import { Config } from '../../config'

export const command = 'set [entry] [value]'
export const describe = 'Change the current configuration.'

export const builder = (yargs: Argv): Argv =>
  yargs
    .positional('entry', {
      type: 'string',
      describe: 'The entry to change.',
    })
    .positional('value', {
      type: 'string',
      describe: 'The value to set.',
    })

export const handler = (yargs: Arguments): void => {
  const entry = yargs.entry as string
  const value = yargs.value as string
  let val: string | number | boolean
  if (Number.parseInt(value)) val = Number.parseInt(value)
  else if (value.toUpperCase() === 'TRUE') val = true
  else if (value.toUpperCase() === 'FALSE') val = false
  else val = value as string
  Config.set(entry, val)
}
