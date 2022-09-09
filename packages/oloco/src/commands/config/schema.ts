import { schema } from '../../config'
import { logObject } from '../../util'

export const command = 'schema'
export const describe = 'Retrieves the JSON schema for the configuration file.'

export const handler = (): void => {
  logObject(schema)
}
