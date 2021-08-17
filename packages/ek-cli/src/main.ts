import HID from 'node-hid'
import yargs from 'yargs/yargs'

import {
  EkPort,
  padLeadingZeros,
  getInformation,
  getLights,
  getSensors,
  getFanspeed,
  SensorData,
  LightData,
  DeviceInformation,
  FanData,
} from '@ek-loop-connect/ek-lib'
import { exit } from 'process'

type EkPorts = EkPort | 'all'
const ekPorts: ReadonlyArray<EkPorts> = [
  'fan1',
  'fan2',
  'fan3',
  'fan4',
  'fan5',
  'fan6',
  'lights',
  'sensors',
  'all',
]

const device = HID.devices(0x0483, 0x5750).filter((dev) => dev.interface === 0)[0]
const vend = padLeadingZeros(device.vendorId.toString(16), 4)
const prod = padLeadingZeros(device.productId.toString(16), 4)
const iface = padLeadingZeros(device.interface.toString(16), 2)
console.log(`Manufacturer:  ${device.manufacturer}`)
console.log(`Product:       ${device.product}`)
console.log(`Identifier:    USB\\VID_${vend}&PID_${prod}&MI_${iface}`)
console.log()

const path = device.path || ''
if (path === '') {
  console.error('Invalid path for device!')
  exit(2)
}
const hiddev = new HID.HID(path)

yargs(process.argv.slice(2))
  .scriptName('ek-connect-cli')
  .usage('Usage: $0 <command>')
  .command({
    command: 'get [port]',
    describe: 'Get information from your EK Loop Connect.',
    builder: (args) =>
      args.positional('port', {
        choices: ekPorts,
        describe: 'Read a specific port.',
        default: 'all',
      }),
    handler: (argv) => {
      let data: FanData | LightData | SensorData | DeviceInformation
      const port = argv.port as EkPorts
      if (port === 'all') data = getInformation(hiddev)
      else if (port === 'lights') data = getLights(hiddev)
      else if (port === 'sensors') data = getSensors(hiddev)
      else data = getFanspeed(hiddev, port)

      console.log(data)
    },
  })
  .alias('h', 'help')
  .alias('v', 'version').argv
