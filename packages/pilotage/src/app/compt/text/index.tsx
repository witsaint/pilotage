import type React from 'react'
import type { ComponentPropBase, MessageType } from '@/types/message'
import { Box, Text } from 'ink'
import { getTerminalSize } from '@/utils/screen'

interface TextComponentProps extends ComponentPropBase<MessageType.String> {
  maxRows?: number
  maxLength?: number
}

/**
 * TextComponent - 显示文本内容的组件
 * @param props - 组件属性
 * @param props.content - 要显示的内容
 * @param props.maxRows - 最大显示行数
 * @param props.maxLength - 最大显示长度
 * @returns React JSX 元素
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
