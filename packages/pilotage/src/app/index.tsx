import type { Message } from '@/types/message'
import { Box } from 'ink'
import React, { useSyncExternalStore } from 'react'
import { MessageType } from '@/types/message'
import { BoxInput } from '@/ui/box-input'
import { HistoryComponent } from './compt/history'
import { addMessage, getInputInfo, getMessages, subscribeInputInfo, subscribeMessages } from './store'

export function RootApp(): React.JSX.Element {
  const messages = useSyncExternalStore(subscribeMessages, getMessages)
  const inputInfo = useSyncExternalStore(subscribeInputInfo, getInputInfo)
  const onSubmit = (value: string): void => {
    addMessage(`⚛ ${value}`, MessageType.String)
  }

  return (
    <Box flexDirection="column">
      {messages.map(message => (
        <Box key={message.id} marginTop={1}>
          <HistoryComponent message={message as Message} />
        </Box>
      ))}
      <BoxInput
        onSubmit={onSubmit}
        placeholder={inputInfo.placeholder}
        suggestions={[
          ...inputInfo.suggestions,
        ]}
        maxSuggestions={8}
      />
    </Box>
  )
}
