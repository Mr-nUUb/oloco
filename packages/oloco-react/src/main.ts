import ipc from 'node-ipc'

ipc.config.appspace = 'oloco.'
ipc.config.id = 'oloco-react'
ipc.config.retry = 1000
ipc.config.maxRetries = 3

ipc.connectTo('oloco', () => {
  ipc.of.oloco.on('connect', () => {
    ipc.log('connected to oloco')
  })
  ipc.of.oloco.on('message', (data) => {
    ipc.log(data)
  })
  ipc.of.oloco.on('disconnect', () => {
    ipc.log('disconnected from oloco')
  })
})
