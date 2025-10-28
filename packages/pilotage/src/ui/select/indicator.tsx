import figures from 'figures'
import { Box, Text } from 'ink'
import React from 'react'

export interface Props {
  readonly isSelected?: boolean
}

export function Indicator({ isSelected = false }: Props): React.JSX.Element {
  return (
    <Box marginRight={1}>
      {isSelected
        ? (
            <Text color="blue">{figures.lineDashed15}</Text>
          )
        : (
            <Text> </Text>
          )}
    </Box>
  )
}
