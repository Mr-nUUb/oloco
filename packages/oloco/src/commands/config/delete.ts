import fs from 'fs'
import { Config } from '../../config'

export const command = 'delete'
export const describe = 'Delete the user config file.'

export const handler = async (): Promise<void> => {
  console.log(`Deleting config file...`)
  if (fs.existsSync(Config.path)) {
    fs.unlinkSync(Config.path)
  }
}
