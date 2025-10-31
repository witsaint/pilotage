import { Text } from 'ink'
import { addMessage } from '@/app/store'
import { MessageType } from '@/types/message'
import { define } from '../core'

interface addErrMsgParams {
  message: string
}

export const addErrMsgDef = define<addErrMsgParams, void>({
  title: 'addErrMsg',
  description: 'Add an error message to the console',
  scope: 'internal',
})

export function addErrMsgCmd(params: addErrMsgParams): void {
  addMessage(<Text color="red">{params.message}</Text>, MessageType.Ele)
}
