import type { Message, MessageContent, MessageMeta, MessageType } from '@/types/message'
import type { Suggestion } from '@/ui/box-input'
import { useStore } from '@/utils/use-store'

const inputInfo: {
  placeholder: string
  suggestions: Suggestion[]
} = {
  placeholder: 'Enter your input',
  suggestions: [],
}

export const { subscribe: subscribeInputInfo, get: getInputInfo, set: emitInputInfo } = useStore<typeof inputInfo>(inputInfo)

export function setInputInfo(): void {
  emitInputInfo({
    placeholder: 'Enter your input1',
    suggestions: [
      {
        title: 'test',
        value: 'test',
      },
    ],
  })
}

const messages: Message<MessageType>[] = []

export const { subscribe: subscribeMessages, get: getMessages, set: setMessages } = useStore<Message<MessageType>[]>(messages)

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
  setMessages((messages) => {
    messages.push(message)
  })
}
