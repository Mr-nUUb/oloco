import {
  AllFanData,
  LightData,
  SensorData,
  getLights,
  getSensors,
  getFans,
  getFanPwmCurves,
  AllFanPwmCurveData,
  getInformation,
  DeviceInformation,
  getFanPwmCurve,
  FanPort,
  getFan,
  FanData,
} from '@ek-loop-connect/ek-lib'
import { Arguments, Argv } from 'yargs'
import { openController, deviceGadgetChoices, DeviceGadgets } from '../common'

export const command = 'get [port]'
export const describe = 'Get information from your EK Loop Connect.'

export const builder = (yargs: Argv): Argv =>
  yargs.positional('port', {
    choices: deviceGadgetChoices,
    describe: 'Read a specific port or curve.',
    default: 'infos',
  })

export const handler = async (yargs: Arguments): Promise<void> => {
  let data:
    | DeviceInformation
    | LightData
    | AllFanData
    | SensorData
    | AllFanPwmCurveData
    | FanData[]
    | FanData
  const port = yargs.port as DeviceGadgets
  const controller = openController()

  if (port === 'infos') data = getInformation(controller)
  else if (port === 'lights') data = getLights(controller)
  else if (port === 'fans') data = getFans(controller)
  else if (port === 'sensors') data = getSensors(controller)
  else if (port === 'curves') data = await getFanPwmCurves(controller)
  else if (port.startsWith('curve')) data = await getFanPwmCurve(controller, port as FanPort)
  else data = getFan(controller, port as FanPort)

  controller.close()
  console.log(data)
}
