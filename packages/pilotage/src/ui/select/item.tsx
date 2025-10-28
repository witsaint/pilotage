import { Box, Text } from 'ink'
import * as React from 'react'

export interface Props {
  readonly isSelected?: boolean
  readonly label: string
  readonly description?: string
}

export function ItemComponent({ isSelected = false, label, description }: Props): React.JSX.Element {
  return (
    <Box flexDirection="row" gap={1} justifyContent="space-between">
      <Text color={isSelected ? 'blue' : undefined}>{label}</Text>
      {description && <Text color="gray">{description}</Text>}
    </Box>
  )
}
