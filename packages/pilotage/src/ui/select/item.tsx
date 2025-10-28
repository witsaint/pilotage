import { Text } from 'ink'
import * as React from 'react'

export interface Props {
  readonly isSelected?: boolean
  readonly label: string
}

export function ItemComponent({ isSelected = false, label }: Props): React.JSX.Element {
  return <Text color={isSelected ? 'blue' : undefined}>{label}</Text>
}
