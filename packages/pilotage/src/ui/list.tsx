import { Box, Text } from 'ink'
import React from 'react'

type ListStyle = 'tree' | 'bullet' | 'dash' | 'none'
type StatusColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'cyan' | 'magenta' | 'white'

interface ListItem {
  title: string
  desc?: string
  titleColor?: string
  descColor?: string
  status?: StatusColor
  showStatus?: boolean
}

interface ListProps {
  title?: string
  titleColor?: string
  items: ListItem[]
  style?: ListStyle
  defaultTitleColor?: string
  defaultDescColor?: string
  defaultStatusColor?: StatusColor
  showStatus?: boolean
}

export function List({
  title,
  titleColor = 'cyan',
  items,
  style = 'tree',
  defaultTitleColor = 'white',
  defaultDescColor = 'gray',
  defaultStatusColor = 'green',
  showStatus = false,
}: ListProps): React.JSX.Element {
  const getPrefix = (index: number, isLast: boolean): string => {
    switch (style) {
      case 'tree':
        return isLast ? '└── ' : '├── '
      case 'bullet':
        return '• '
      case 'dash':
        return '- '
      case 'none':
      default:
        return ''
    }
  }

  const getStatusIndicator = (_color: StatusColor): string => {
    return '●'
  }

  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={1}>
          <Text bold color={titleColor}>
            {title}
          </Text>
        </Box>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const prefix = getPrefix(index, isLast)
        const itemTitleColor = item.titleColor || defaultTitleColor
        const itemDescColor = item.descColor || defaultDescColor
        const itemStatus = item.status || defaultStatusColor
        const shouldShowStatus = item.showStatus !== undefined ? item.showStatus : showStatus

        return (
          <Box key={index}>
            {style !== 'none' && (
              <Text color="gray">{prefix}</Text>
            )}
            {shouldShowStatus && (
              <Text color={itemStatus}>
                {getStatusIndicator(itemStatus)}
                {' '}
              </Text>
            )}
            <Text color={itemTitleColor} bold>
              {item.title}
            </Text>
            {item.desc && (
              <>
                <Text> </Text>
                <Text color={itemDescColor}>{item.desc}</Text>
              </>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
