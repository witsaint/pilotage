import type { Message } from '@/types/message'
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
          <HistoryComponent message={message as Message} />
        </Box>
      ))}
      <BoxInput
        onSubmit={onSubmit}
        placeholder="输入命令 (如: /init)"
        suggestions={[
          {
            title: '/init',
            desc: '初始化',
            value: 'init',
          },
          {
            title: '/progress',
            desc: '进度条',
            value: 'progress',
          },
        ]}
        maxSuggestions={8}
      />
    </Box>
  )
}
