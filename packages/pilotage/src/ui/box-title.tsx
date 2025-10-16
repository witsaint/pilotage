import { Box as InkBox, Text } from 'ink'
import React from 'react'
import { Level, LEVELCOLOR_MAP } from '@/config/level'

type TitleAlign = 'left' | 'center' | 'right'

interface BoxProps {
  title: string
  content: string
  width?: number
  height?: number
  titleAlign?: TitleAlign
  level?: Level
}

export function BoxTitle({
  title,
  content,
  width = 80,
  height,
  titleAlign = 'left',
  level = Level.DEFAULT,
}: BoxProps): React.JSX.Element {
  return (
    <>
      <InkBox flexDirection="column" width={width} height={height}>
        {/* 标题和方框在同一行，标题嵌入到边框上边 */}
        <InkBox position="relative">
          {/* 方框 */}
          <InkBox borderStyle="round" borderColor={LEVELCOLOR_MAP[level]} padding={1} width="100%">
            <InkBox flexDirection="column">
              <Text>
                {content || 'Content'}
              </Text>
            </InkBox>
          </InkBox>

          {/* 标题覆盖在边框上边 */}
          <InkBox
            position="absolute"
            justifyContent={titleAlign === 'left' ? 'flex-start' : titleAlign === 'right' ? 'flex-end' : 'center'}
            paddingX={2}
          >
            <Text color={LEVELCOLOR_MAP[level]} bold>
              {title || 'Title'}
            </Text>
          </InkBox>
        </InkBox>
      </InkBox>
    </>
  )
}
