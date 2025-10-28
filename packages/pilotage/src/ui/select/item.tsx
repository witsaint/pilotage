import { Box, Text } from 'ink'
import * as React from 'react'

export interface Props {
  readonly isSelected?: boolean
  readonly label: string
  readonly description?: string
  readonly labelWidth?: number
}

export function ItemComponent({ isSelected = false, label, description, labelWidth }: Props): React.JSX.Element {
  return (
    <Box flexDirection="row" gap={1} justifyContent="space-between">
      <Box width={labelWidth}><Text color={isSelected ? 'blue' : undefined}>{label}</Text></Box>
      {description && <Text color="gray">{description}</Text>}
    </Box>
  )
}
