import type React from 'react'
import type { ComponentPropBase, MessageType } from '@/types/message'
import { Box, Text } from 'ink'
import { getTerminalSize } from '@/utils/screen'

interface TextComponentProps extends ComponentPropBase<MessageType.String> {
  maxRows?: number
  maxLength?: number
}

/**
 *
 * @param content - The content to display
 * @param maxRows - The maximum number of rows to display
 * @param maxLength - The maximum length of the content to display
 * @returns
 */
export function TextComponent(
  { content, maxRows, maxLength }: TextComponentProps,
): React.JSX.Element {
  const terminalSize = getTerminalSize()
  let truncatedContent = content
  if (maxRows && !maxLength) {
    truncatedContent = content.slice(0, maxRows * terminalSize.columns)
  }
  if (maxLength) {
    truncatedContent = truncatedContent.slice(0, maxLength)
  }

  return (
    <Box flexDirection="column">
      <Text>{truncatedContent}</Text>
    </Box>
  )
}
