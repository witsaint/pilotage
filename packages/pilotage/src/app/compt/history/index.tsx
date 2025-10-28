import type { Message } from '@/types/message'
import React from 'react'
import { historyRoute } from './route'

// 动态组件渲染器
export function HistoryComponent({ message }: { message: Message }): React.JSX.Element {
  // 根据消息类型动态渲染不同的组件
  const Component = historyRoute(message.type)
  return <Component content={message.content} />
}
