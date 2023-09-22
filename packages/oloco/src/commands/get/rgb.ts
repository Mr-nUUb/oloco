import type { Arguments } from 'yargs'
import { OLoCo } from '../../lib/oloco'
import { logObject } from '../../util'
import { Config } from '../../config'

export const command = 'rgb'
export const describe = 'Get the current RGB mode, speed and color.'

export const handler = (yargs: Arguments): void => {
  const skipValidation = yargs['skipValidation'] as boolean

  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  const data = controller.getRgb(skipValidation)
  controller.close()

  logObject(data)
}
