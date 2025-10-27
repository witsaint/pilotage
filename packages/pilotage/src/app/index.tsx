import { Box, Static, Text } from 'ink'
import React, { useSyncExternalStore } from 'react'
import { BoxInput } from '@/ui/box-input'
import { addMessage, getMessages, subscribe } from './store'

// 定义消息类型
interface Message {
  id: string
  type: 'user' | 'system' | 'error' | 'success' | 'info' | 'loading' | 'progress' | 'table' | 'json'
  content: string | any
  timestamp?: Date
  metadata?: Record<string, any>
}

// 动态组件渲染器
function MessageComponent({ message }: { message: Message }): React.JSX.Element {
  // 根据消息类型动态渲染不同的组件
  switch (message.type) {
    case 'loading':
      return (
        <Box>
          <Text color="yellow">
            ⏳
            {message.content}
          </Text>
        </Box>
      )

    case 'progress': {
      const percent = message.metadata?.percent || 0
      const progressBar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10))
      return (
        <Box flexDirection="column">
          <Text color="cyan">{message.content}</Text>
          <Text color="green">
            [
            {progressBar}
            ]
            {Math.round(percent)}
            %
          </Text>
        </Box>
      )
    }

    case 'table':
      return (
        <Box flexDirection="column">
          <Text color="yellow">📊 表格数据:</Text>
          {Array.isArray(message.content)
            ? (
                message.content.map((row: any, index: number) => (
                  <Box key={index} marginLeft={2}>
                    <Text>{JSON.stringify(row)}</Text>
                  </Box>
                ))
              )
            : (
                <Text color="red">表格数据格式错误</Text>
              )}
        </Box>
      )

    case 'json':
      return (
        <Box flexDirection="column">
          <Text color="magenta">📋 JSON 数据:</Text>
          <Box marginLeft={2}>
            <Text>{JSON.stringify(message.content, null, 2)}</Text>
          </Box>
        </Box>
      )

    case 'error':
      return (
        <Box>
          <Text color="red">
            ❌
            {message.content}
          </Text>
        </Box>
      )

    case 'success':
      return (
        <Box>
          <Text color="green">
            ✅
            {message.content}
          </Text>
        </Box>
      )

    case 'info':
      return (
        <Box>
          <Text color="blue">
            ℹ️
            {message.content}
          </Text>
        </Box>
      )

    case 'system':
      return (
        <Box>
          <Text color="gray">
            🔧
            {message.content}
          </Text>
        </Box>
      )

    case 'user':
    default:
      return (
        <Box>
          <Text color="white">
            {'>'}
            {' '}
            {message.content}
          </Text>
        </Box>
      )
  }
}

export function RootApp(): React.JSX.Element {
  const messages = useSyncExternalStore(subscribe, getMessages)

  const onSubmit = (value: string): void => {
    // 根据命令类型动态设置消息类型和内容
    if (value.startsWith('/loading')) {
      addMessage(value.replace('/loading', '').trim() || '加载中...', 'loading')
    }
    else if (value.startsWith('/progress')) {
      const percent = Math.random() * 100
      addMessage('处理进度', 'progress', { percent })
    }
    else if (value.startsWith('/table')) {
      const tableData = [
        { name: 'Alice', age: 25, city: 'New York' },
        { name: 'Bob', age: 30, city: 'London' },
        { name: 'Charlie', age: 35, city: 'Tokyo' },
      ]
      addMessage(tableData, 'table')
    }
    else if (value.startsWith('/json')) {
      const jsonData = {
        status: 'success',
        data: { id: 1, name: 'Test', timestamp: new Date().toISOString() },
        message: '操作完成',
      }
      addMessage(jsonData, 'json')
    }
    else if (value.startsWith('/error')) {
      addMessage(value.replace('/error', '').trim() || '发生错误', 'error')
    }
    else if (value.startsWith('/success')) {
      addMessage(value.replace('/success', '').trim() || '操作成功', 'success')
    }
    else if (value.startsWith('/info')) {
      addMessage(value.replace('/info', '').trim() || '信息提示', 'info')
    }
    else if (value.startsWith('/system')) {
      addMessage(value.replace('/system', '').trim() || '系统消息', 'system')
    }
    else {
      addMessage(value, 'user')
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      {messages.map(message => (
        <Box key={message.id}>
          <MessageComponent message={message} />
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
