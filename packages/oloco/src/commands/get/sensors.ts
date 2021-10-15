import { OLoCo } from '@oloco/oloco'
import { logObject } from '../../cli.common'
import { Config } from '../../config'

export const command = 'sensors'
export const describe = 'Read temperature, flow and level sensors.'

export const handler = (): void => {
  const controller = new OLoCo()
  controller.setReadTimeout(Config.get('readTimeout'))
  const data = controller.getSensor()
  controller.close()

  logObject(data)
}
