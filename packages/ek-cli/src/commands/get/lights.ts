import { openController } from '../../common'
import { getLights } from '@ek-loop-connect/ek-lib'

export const command = 'lights'
export const describe = 'Get the current light mode, speed and color.'

export const builder = {}

export const handler = (): void => {
  const controller = openController()
  const data = getLights(controller)
  controller.close()
  console.log(data)
}
