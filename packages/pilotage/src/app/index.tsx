import type { Message } from '@/types/message'
import { Box } from 'ink'
import React, { useSyncExternalStore } from 'react'
import { registry } from '@/commands'
import { MessageType } from '@/types/message'
import { BoxInput } from '@/ui/box-input'
import { HistoryComponent } from './compt/history'
import { addMessage, getInputInfo, getMessages, subscribeInputInfo, subscribeMessages } from './store'

export function RootApp(): React.JSX.Element {
  const messages = useSyncExternalStore(subscribeMessages, getMessages)
  const inputInfo = useSyncExternalStore(subscribeInputInfo, getInputInfo)
  const onSubmit = (value: string): void => {
    addMessage(`⚛ ${value}`, MessageType.String)
    registry.execute('addErrMsg', { message: value }).catch((error) => {
      // 错误已在全局处理器中打印，这里可以做额外的UI反馈
      addMessage(`❌ 执行失败: ${error instanceof Error ? error.message : String(error)}`, MessageType.String)
    })
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
