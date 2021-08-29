import fs from 'fs'
import { config } from '../../config'

export const command = 'delete'
export const describe = 'Delete the user config file.'

export const handler = async (): Promise<void> => {
  console.log(`Deleting config file...`)
  if (fs.existsSync(config.path)) {
    fs.unlinkSync(config.path)
  }
}
