import type { MessageConfig, MessageContent } from '@/types/message'
import figures from 'figures'
import { Box, Text } from 'ink'
import { addMessage } from '@/app/store'
import { Level, LEVELCOLOR_MAP } from '@/config/level'
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
  addMessage(
    <Box flexDirection="row" gap={1}>
      <Text color={LEVELCOLOR_MAP[Level.ERROR]}>{figures.cross}</Text>
      <Text color={LEVELCOLOR_MAP[Level.ERROR]}>{params.message}</Text>
    </Box>,
    MessageType.Ele,
  )
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
    <Box flexDirection="column">
      <Box flexDirection="row" gap={1}>
        <Text color={LEVELCOLOR_MAP[Level.INFO]}>⚛</Text>
        <Text>
          {params.message}
        </Text>
      </Box>
      <Box flexDirection="row" gap={1}>
        <Text color={LEVELCOLOR_MAP[Level.DESC]}>
          {figures.lineUpRightArc}
        </Text>
        <Text color={LEVELCOLOR_MAP[Level.DESC]}>
          {new Date().toLocaleTimeString()}
        </Text>
      </Box>
    </Box>,
    MessageType.Ele,
  )
}

interface addMessageParams<T extends MessageType> {
  message: MessageContent[T]
  type: T
  config?: MessageConfig
}
export const addMessageDef = define<addMessageParams<MessageType>, void>({
  title: 'addMessage',
  description: 'Add a message to the console',
  scope: 'internal',
})

export function addMessageCmd<T extends MessageType>(params: addMessageParams<T>): void {
  addMessage(params.message, params.type, params.config)
}
