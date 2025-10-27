import type React from 'react'
import { Box, Text } from 'ink'

export function TextComponent({ content }: { content: string }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text>{content}</Text>
    </Box>
  )
}
