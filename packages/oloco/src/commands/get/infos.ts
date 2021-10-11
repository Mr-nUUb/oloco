import { OLoCo } from '@oloco/oloco'
import { logObject } from 'oloco/src/cli.common'

export const command = 'infos'
export const describe = 'Get all available information.'

export const handler = (): void => {
  const controller = new OLoCo()
  const data = controller.getInformation()
  controller.close()

  logObject(data)
}
