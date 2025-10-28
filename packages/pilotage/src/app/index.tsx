import { Box } from 'ink'
import React, { useSyncExternalStore } from 'react'
import { MessageType } from '@/types/message'
import { BoxInput } from '@/ui/box-input'
import { HistoryComponent } from './compt/history'
import { addMessage, getMessages, subscribe } from './store'

export function RootApp(): React.JSX.Element {
  const messages = useSyncExternalStore(subscribe, getMessages)

  const onSubmit = (value: string): void => {
    addMessage(value, MessageType.String)
  }

  return (
    <Box flexDirection="column">
      {messages.map(message => (
        <Box key={message.id} marginTop={1}>
          <HistoryComponent message={message} />
        </Box>
      ))}
      <BoxInput
        onSubmit={onSubmit}
        placeholder="输入命令 (如: /loading, /progress, /table, /json)"
        suggestions={['/loading', '/progress', '/table', '/json', '/error', '/success', '/info', '/system']}
        maxSuggestions={8}
      />
    </Box>
  )
}
