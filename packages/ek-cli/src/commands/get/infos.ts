import { openController } from '../../common'
import { getInformation } from '@ek-loop-connect/ek-lib'

export const command = 'infos'
export const describe = 'Get all available information.'

export const handler = (): void => {
  const controller = openController()
  const data = getInformation(controller)
  controller.close()
  console.log(data)
}
