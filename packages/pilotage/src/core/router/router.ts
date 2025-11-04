import { Status } from '@/config/status'
import { inputRouter } from '@/utils/input-router'
import { setConfig } from './set-config'

export function initRouter(): void {
  inputRouter.register(Status.CONFIG_ING, {
    handler: setConfig,
    nextState: Status.CONFIG_ING,
  })
}
