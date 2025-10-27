// 定义消息类型
interface Message {
  id: string
  type: 'user' | 'system' | 'error' | 'success' | 'info' | 'loading' | 'progress' | 'table' | 'json'
  content: string | any
  timestamp?: Date
  metadata?: Record<string, any>
}

let messages: Message[] = []
let listeners: (() => void)[] = []

export function addMessage(content: string | any, type: Message['type'] = 'user', metadata?: Record<string, any>): void {
  const message: Message = {
    id: Date.now().toString(),
    type,
    content,
    timestamp: new Date(),
    metadata,
  }
  messages = [...messages, message] // 创建新数组而不是修改原数组
  emitChange()
}

export function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

export function getMessages(): Message[] {
  return messages
}

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}
