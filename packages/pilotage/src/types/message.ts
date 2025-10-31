import type { ListItem } from '@/ui/list'

export enum MessageType {
  String = 'string',
  List = 'list',
  Ele = 'ele',
}

export type MessageMeta = Record<string, any>

export interface MessageContent {
  [MessageType.String]: string
  [MessageType.List]: ListItem[]
  [MessageType.Ele]: React.ReactNode
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

export interface MessageConfig {
  metadata?: MessageMeta
  props?: Record<string, any>
}
