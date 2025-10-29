import type React from 'react'
import { MessageType } from '@/types/message'
import { EleComponent } from '../ele'
import { ListComponent } from '../list'
import { TextComponent } from '../text'

export function historyRoute(type: MessageType): React.ComponentType<any> {
  switch (type) {
    case MessageType.String:
      return TextComponent
    case MessageType.List:
      return ListComponent
    case MessageType.Ele:
      return EleComponent
    default:
      return TextComponent
  }
}
