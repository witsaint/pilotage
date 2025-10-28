import type { Message, MessageContent, MessageMeta, MessageType } from '@/types/message'

let messages: Message<MessageType>[] = []
let listeners: (() => void)[] = []

export function addMessage<T extends MessageType>(
  content: MessageContent[T],
  type: T,
  config?: { metadata?: MessageMeta, props?: Record<string, any> },
): void {
  const message: Message<T> = {
    id: crypto.randomUUID(),
    type,
    content,
    timestamp: Date.now(),
    metadata: config?.metadata,
    props: config?.props,
  }
  messages = [...messages, message]
  emitChange()
}

export function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

export function getMessages(): Message<MessageType>[] {
  return messages
}

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}
