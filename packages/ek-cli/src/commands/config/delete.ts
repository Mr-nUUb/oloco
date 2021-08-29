import fs from 'fs'
import { configFilePath } from '../../config'

export const command = 'delete'
export const describe = 'Delete the user config file.'

export const handler = async (): Promise<void> => {
  console.log(`Deleting config file "${configFilePath}"...`)
  if (fs.existsSync(configFilePath)) {
    fs.unlinkSync(configFilePath)
  }
}
