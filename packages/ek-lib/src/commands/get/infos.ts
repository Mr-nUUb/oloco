import { EkLoopConnect } from '@oloco/oloco'
import util from 'util'

export const command = 'infos'
export const describe = 'Get all available information.'

export const handler = (): void => {
  const controller = new EkLoopConnect()
  const data = controller.getInformation()
  controller.close()

  console.log(util.inspect(data, { depth: null, colors: true }))
}
