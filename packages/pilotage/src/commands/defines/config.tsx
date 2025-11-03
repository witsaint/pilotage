import { Status } from '@/config/status'
import { setStatus } from '@/events/status'
import { define } from '../core'

interface configParams {
  host: string
  token: string
}

export const configDef = define<configParams, void>({
  title: 'config',
  description: 'Configure the pilotage',
  scope: 'cli',
})

export function configCmd(): void {
  setStatus(Status.CONFIG_ING)
}
