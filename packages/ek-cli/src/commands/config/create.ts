import path from 'path'
import fs from 'fs'
import { ConfigTemplate, configFilePath } from '../../config'

export const command = 'create'
export const describe = 'Create the user config with default settings.'

export const handler = async (): Promise<void> => {
  if (!fs.existsSync(configFilePath)) {
    console.log(`Config file "${configFilePath}" does not exist, creating...`)
    fs.mkdirSync(path.dirname(configFilePath), { recursive: true })
    fs.writeFileSync(configFilePath, JSON.stringify(ConfigTemplate, null, 2))
  } else {
    console.log(`Config file "${configFilePath}" already exists, nothing to do!`)
  }
}
