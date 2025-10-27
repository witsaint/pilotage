import type { Message } from '@/types/message'
import { Box, Text } from 'ink'
import React from 'react'

// 动态组件渲染器
export function HistoryComponent({ message }: { message: Message }): React.JSX.Element {
  // 根据消息类型动态渲染不同的组件

  return (
    <Box flexDirection="column">
      <Text>{new Date(message.timestamp).toISOString()}</Text>
      <Text>{message.type}</Text>
      <Text>{message.content}</Text>
      <Text>{message.metadata}</Text>
    </Box>
  )
}
