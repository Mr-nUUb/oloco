import * as HID from 'node-hid'

import { padLeadingZeros, getInformation } from '@ek-loop-connect/ek-lib'

const vid = 0x0483
const pid = 0x5750

const devices = HID.devices(vid, pid)
devices
  .filter((dev) => dev.interface === 0)
  .forEach(async (dev) => {
    const vend = padLeadingZeros(dev.vendorId.toString(16), 4)
    const prod = padLeadingZeros(dev.productId.toString(16), 4)
    const iface = padLeadingZeros(dev.interface.toString(16), 2)

    console.log(`Manufacturer:  ${dev.manufacturer}`)
    console.log(`Product:       ${dev.product}`)
    console.log(`Identifier:    USB\\VID_${vend}&PID_${prod}&MI_${iface}`)

    const path = dev.path || ''
    if (path === '') throw 'Invalid path for device!'

    const hiddev = new HID.HID(path)
    console.log(getInformation(hiddev))

    hiddev.close()
  })
