import { exit } from 'node:process'
import type { Arguments, Argv } from 'yargs'
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
  const entry = yargs['entry'] as string
  const value = yargs['value'] as string

  const value_ = Number.isNaN(Number.parseInt(value))
    ? value.toLowerCase() === `${true}`
      ? true
      : value.toLowerCase() === `${false}`
      ? false
      : value
    : Number.parseInt(value)

  try {
    Config.set(entry, value_)
  } catch (error) {
    console.error((error as Error).message || error)
    exit(1)
  }
}
