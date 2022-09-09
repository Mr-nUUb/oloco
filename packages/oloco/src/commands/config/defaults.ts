import { defaults } from '../../config'
import { logObject } from '../../util'

export const command = 'defaults'
export const describe = 'Retrieves the defaults for the configuration file.'

export const handler = (): void => {
  logObject(defaults)
}
