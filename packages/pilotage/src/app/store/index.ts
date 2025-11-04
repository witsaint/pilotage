import type { InputInfo } from '@/types/input'
import type { Message, MessageConfig, MessageContent, MessageType } from '@/types/message'
import { Status } from '@/config/status'
import { useStore } from '@/utils/use-store'

/****************************************
* 输入信息
 *****************************************
 */
const inputInfo: InputInfo = {
  placeholder: 'Enter your input',
  suggestions: [],
}

export const { subscribe: subscribeInputInfo, get: getInputInfo, set: emitInputInfo } = useStore<typeof inputInfo>(inputInfo)

export function setInputInfo(inputInfo: InputInfo): void {
  emitInputInfo(inputInfo)
}

/**
 *****************************************
 * 消息
 *****************************************
 */
const messages: Message<MessageType>[] = []

export const { subscribe: subscribeMessages, get: getMessages, set: setMessages } = useStore<Message<MessageType>[]>(messages)

export function addMessage<T extends MessageType>(
  content: MessageContent[T],
  type: T,
  config?: MessageConfig,
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
    return [...messages, message]
  })
}

/**
 *****************************************
 * 状态
 *****************************************
 */
const status: Status = Status.NOT_STARTED

export const { subscribe: subscribeStatus, get: getStatus, set: setStatus } = useStore<Status>(status)

export function updateStatus(status: Status): void {
  setStatus(status)
}
