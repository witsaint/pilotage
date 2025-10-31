import { Box, Text } from 'ink'
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

interface addUserMsgParams {
  message: string
}

export const addUserMsgDef = define<addUserMsgParams, void>({
  title: 'addUserMsg',
  description: 'Add a user message to the console',
  scope: 'internal',
})

export function addUserMsgCmd(params: addUserMsgParams): void {
  addMessage(
    <Box flexDirection="row" gap={1}>
      <Text color="blue">⚛</Text>
      <Text>{params.message}</Text>
    </Box>,
    MessageType.Ele,
  )
}
