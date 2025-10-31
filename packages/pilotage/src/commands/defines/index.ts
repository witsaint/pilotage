import { createRegistry, defineCommands } from '../core'
import {
  addErrMsgCmd,
  addErrMsgDef,
  addMessageCmd,
  addMessageDef,
  addUserMsgCmd,
  addUserMsgDef,
} from './message'

const defs = defineCommands({
  addErrMsg: addErrMsgDef,
  addUserMsg: addUserMsgDef,
  addMessage: addMessageDef,
})

export const registry = createRegistry(defs)

export function registryCommands(): void {
  registry.implement('addErrMsg', addErrMsgCmd)
  registry.implement('addUserMsg', addUserMsgCmd)
  registry.implement('addMessage', addMessageCmd)
}
