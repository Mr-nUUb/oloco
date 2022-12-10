import type { Arguments } from 'yargs'
import { OLoCo } from '../../lib/oloco'
import { logObject } from '../../util'
import { Config } from '../../config'

export const command = 'sensors'
export const describe = 'Read temperature, flow and level sensors.'

export const handler = (yargs: Arguments): void => {
  const skipValidation = yargs.skipValidation as boolean

  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  const data = controller.getSensor(skipValidation)
  controller.close()

  logObject(data)
}
