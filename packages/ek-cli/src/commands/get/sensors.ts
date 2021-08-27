import { openController } from '../../common'
import { getSensors } from '@ek-loop-connect/ek-lib'

export const command = 'sensors'
export const describe = 'Read temperature, flow and level sensors.'

export const handler = (): void => {
  const controller = openController()
  const data = getSensors(controller)
  controller.close()
  console.log(data)
}
