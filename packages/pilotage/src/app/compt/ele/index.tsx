import type React from 'react'
import type { ComponentPropBase, MessageType } from '@/types/message'
import { Box } from 'ink'

interface EleComponentProps extends ComponentPropBase<MessageType.Ele> {
}

export function EleComponent({ content }: EleComponentProps): React.JSX.Element {
  return (
    <Box>
      {content}
    </Box>
  )
}
