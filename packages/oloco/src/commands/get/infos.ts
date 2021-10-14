import { OLoCo } from '@oloco/oloco'
import { logObject } from '../../cli.common'
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
