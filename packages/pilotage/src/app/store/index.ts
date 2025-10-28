import type { Message, MessageMeta } from '@/types/message'

let messages: Message[] = []
let listeners: (() => void)[] = []

export function addMessage<T extends Message>(
  content: T['content'],
  type: T['type'],
  config?: { metadata?: MessageMeta, props?: Record<string, any> },
): void {
  const message: T = {
    id: crypto.randomUUID(),
    type,
    content: content as T['content'],
    timestamp: Date.now(),
    metadata: config?.metadata,
    props: config?.props,
  } as T
  messages = [...messages, message]
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
