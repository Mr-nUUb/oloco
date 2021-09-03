import { openController } from '../../common'
import { getInformation } from '@ek-loop-connect/ek-lib'
import util from 'util'

export const command = 'infos'
export const describe = 'Get all available information.'

export const handler = (): void => {
  const controller = openController()
  const data = getInformation(controller)
  controller.close()
  console.log(util.inspect(data, { depth: null, colors: true }))
}
