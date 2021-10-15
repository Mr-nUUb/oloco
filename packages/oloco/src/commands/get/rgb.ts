import { OLoCo } from '@oloco/oloco'
import { logObject } from '../../cli.common'
import { Config } from '../../config'

export const command = 'rgb'
export const describe = 'Get the current RGB mode, speed and color.'

export const handler = (): void => {
  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  const data = controller.getRgb()
  controller.close()

  logObject(data)
}
