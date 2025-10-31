import { EventEmitter } from 'node:events'
import { setInputInfo } from '@/app/store'
import { Status } from '@/config/status'

export const statusEmitter = new EventEmitter()

statusEmitter.on('status', (status: Status) => {
  if (status === Status.NOT_STARTED) {
    setInputInfo({
      placeholder: 'Please configure the pilotage first',
      suggestions: [],
    })
  }
})

export function setStatus(status: Status): void {
  statusEmitter.emit('status', status)
}
