import { openController } from '../../common'
import { getRgb } from '@ek-loop-connect/ek-lib'

export const command = 'rgb'
export const describe = 'Get the current RGB mode, speed and color.'

export const handler = (): void => {
  const controller = openController()
  const data = getRgb(controller)
  controller.close()
  console.log(data)
}
