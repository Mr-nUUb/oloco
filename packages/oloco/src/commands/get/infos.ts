import { OLoCo } from '../../lib/oloco'
import { logObject } from '../../util'
import { Config } from '../../config'

export const command = 'infos'
export const describe = 'Get all available information.'

export const handler = (): void => {
  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  const data = controller.getInformation()
  controller.close()

  logObject(data)
}
