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
import { hiddev, deviceGadgetChoices, DeviceGadgets } from '../common'

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

  if (port === 'infos') data = getInformation(hiddev)
  else if (port === 'lights') data = getLights(hiddev)
  else if (port === 'fans') data = getFans(hiddev)
  else if (port === 'sensors') data = getSensors(hiddev)
  else if (port === 'curves') data = await getFanPwmCurves(hiddev)
  else if (port.startsWith('curve')) data = await getFanPwmCurve(hiddev, port as FanPort)
  else data = getFan(hiddev, port as FanPort)

  console.log(data)
}
