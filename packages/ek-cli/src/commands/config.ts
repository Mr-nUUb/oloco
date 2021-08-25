import { Argv, Arguments } from 'yargs'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { userConfigTemplate } from '../userconfig'

export const command = 'config <action>'
export const describe = 'Create or delete user configuration file.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('action', {
    choices: actionChoices,
    describe: 'The fan profile to use.',
  })

export const handler = async (yargs: Arguments): Promise<void> => {
  const action = yargs.action as Action

  const configFile = path.resolve(os.homedir(), '.config/ek-loop-connect/cli/config.json')

  if (action === 'create') {
    if (!fs.existsSync(configFile)) {
      console.log(`Config file "${configFile}" does not exist, creating...`)
      fs.mkdirSync(path.dirname(configFile), { recursive: true })
      fs.writeFileSync(configFile, JSON.stringify(userConfigTemplate, null, 2))
      console.log('Successfully created user config!')
    } else {
      console.log(`Config file "${configFile}" already exists, nothing to do!`)
    }
  } else if (action === 'delete') {
    console.log(`Deleting config file "${configFile}"...`)
    fs.unlinkSync(configFile)
  }
}

type Action = 'create' | 'delete'
const actionChoices: ReadonlyArray<Action> = ['create', 'delete']
