import { createRegistry, defineCommands } from '../core'
import { addErrMsgCmd, addErrMsgDef } from './message'

const defs = defineCommands({
  addErrMsg: addErrMsgDef,
})

export const registry = createRegistry(defs)

export function registryCommands(): void {
  registry.implement('addErrMsg', addErrMsgCmd)
}
