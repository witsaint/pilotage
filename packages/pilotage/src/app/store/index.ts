import type { Message, MessageMeta } from '@/types/message'

let messages: Message[] = []
let listeners: (() => void)[] = []

export function addMessage<T extends Message>(content: T['content'], type: T['type'], metadata?: MessageMeta): void {
  const message: T = {
    id: crypto.randomUUID(),
    type,
    content: content as T['content'],
    timestamp: Date.now(),
    metadata,
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
