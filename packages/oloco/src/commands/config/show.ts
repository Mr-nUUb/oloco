import { Config } from '../../config'

export const command = 'show'
export const describe = 'Reveal the configuration file.'

export const handler = async (): Promise<void> => {
  console.log(Config.path)
}
