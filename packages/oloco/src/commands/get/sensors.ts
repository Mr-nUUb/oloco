import { OLoCo } from '@oloco/oloco'

export const command = 'sensors'
export const describe = 'Read temperature, flow and level sensors.'

export const handler = (): void => {
  const controller = new OLoCo()
  const data = controller.getSensor()
  controller.close()

  console.log(data)
}
