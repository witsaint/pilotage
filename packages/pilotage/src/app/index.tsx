import { Box, useStdout } from 'ink'
import React from 'react'
import { BoxInput } from '@/ui/box-input'

export function RootApp(): React.JSX.Element {
  const { write } = useStdout()
  const onSubmit = (value: string): void => {
    write(`${value}\n`)
  }

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <BoxInput
        onSubmit={onSubmit}
        placeholder="输入命令 (如: /info)"
        suggestions={['/info', '/help', '/exit']}
        maxSuggestions={8}
      />
    </Box>
  )
}
