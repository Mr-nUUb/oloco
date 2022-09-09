import { Config } from '../../config'

export const command = 'reset'
export const describe = 'Restores the default configuraion.'

export const handler = (): void => {
  Config.clear()
}
