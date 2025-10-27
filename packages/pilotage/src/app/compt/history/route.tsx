import type React from 'react'
import { MessageType } from '@/types/message'
import { TextComponent } from '../text'

export function historyRoute(type: MessageType): React.JSX.Element {
  switch (type) {
    case MessageType.String:
      return TextComponent
    default:
      return TextComponent
  }
}
