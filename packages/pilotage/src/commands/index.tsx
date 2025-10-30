import { Text } from 'ink'
import { addMessage } from '@/app/store'
import { MessageType } from '@/types/message'

export function addUserCommand(): void {
  addMessage(<Text color="cyan">addUserCommand</Text>, MessageType.Ele)
}
