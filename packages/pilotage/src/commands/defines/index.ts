import { createRegistry, defineCommands } from '../core'
import { addErrMsgCmd, addErrMsgDef, addUserMsgCmd, addUserMsgDef } from './message'

const defs = defineCommands({
  addErrMsg: addErrMsgDef,
  addUserMsg: addUserMsgDef,
})

export const registry = createRegistry(defs)

export function registryCommands(): void {
  registry.implement('addErrMsg', addErrMsgCmd)
  registry.implement('addUserMsg', addUserMsgCmd)
}
