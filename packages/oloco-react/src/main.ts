import ipc from 'node-ipc'

ipc.config.appspace = 'oloco.'
ipc.config.id = 'oloco-react'
ipc.config.retry = 1000
ipc.config.maxRetries = 3

ipc.connectTo('oloco', () => {
  // dummy
})
