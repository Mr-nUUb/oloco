import { OLoCo } from '@oloco/oloco'
import { logObject } from '../../cli.common'

export const command = 'sensors'
export const describe = 'Read temperature, flow and level sensors.'

export const handler = (): void => {
  const controller = new OLoCo()
  const data = controller.getSensor()
  controller.close()

  logObject(data)
}
