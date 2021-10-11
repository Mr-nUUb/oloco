import { OLoCo } from '@oloco/oloco'
import { logObject } from 'oloco/src/cli.common'

export const command = 'rgb'
export const describe = 'Get the current RGB mode, speed and color.'

export const handler = (): void => {
  const controller = new OLoCo()
  const data = controller.getRgb()
  controller.close()

  logObject(data)
}
