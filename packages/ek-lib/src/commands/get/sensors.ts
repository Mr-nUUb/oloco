import { EkLoopConnect } from '@ek-loop-connect/ek-lib'

export const command = 'sensors'
export const describe = 'Read temperature, flow and level sensors.'

export const handler = (): void => {
  const controller = new EkLoopConnect()
  const data = controller.getSensor()
  controller.close()
  console.log(data)
}
