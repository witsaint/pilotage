export enum MessageType {
  String = 'string',
}

export type MessageMeta = Record<string, any>

export interface MessageContent {
  [MessageType.String]: string
}

export interface MessageBase {
  id: string
  timestamp: number
  metadata?: MessageMeta
  props?: MessageMeta
}

export interface Message<T extends MessageType = MessageType.String, C = MessageContent[T]> extends MessageBase {
  type: T
  content: C
}

export interface ComponentPropBase<T extends MessageType = MessageType.String, C = MessageContent[T]> {
  content: C
}
