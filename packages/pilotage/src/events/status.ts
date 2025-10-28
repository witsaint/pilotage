import { Status } from '@/config/status'
import { EventEmitter } from 'events'
import { setInputInfo } from '@/app/store'

export const statusEmitter = new EventEmitter()

statusEmitter.on('status', (status: Status) => {
  if (status === Status.NOT_STARTED) {
    setInputInfo({
      placeholder: 'Please set your channel by /use',
      suggestions: [
        {
          title: '/use',
          value: '/use',
          desc: 'Set your channel by /use <channel> the default channel is Gitlab',
        },
      ],
    })
  }
})

export function setStatus(status: Status): void {
  statusEmitter.emit('status', status)
}