import { EkLoopConnect } from '@ek-loop-connect/ek-lib'

export const command = 'rgb'
export const describe = 'Get the current RGB mode, speed and color.'

export const handler = (): void => {
  const controller = new EkLoopConnect()
  const data = controller.getRgb()
  controller.close()
  console.log(data)
}
