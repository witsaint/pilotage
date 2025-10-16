import { Box as InkBox, useInput, useStdin, useStdout } from 'ink'
import SelectInput from 'ink-select-input'
import TextInput from 'ink-text-input'
import React, { useMemo, useState } from 'react'
import { Level, LEVELCOLOR_MAP } from '@/config/level'

interface BoxInputProps {
  onSubmit?: (value: string) => void
  placeholder?: string
  suggestions?: string[] // 建议列表
  maxSuggestions?: number // 最大显示建议数
}

export function BoxInput({
  onSubmit,
  placeholder = 'Enter your input',
  suggestions = [],
  maxSuggestions = 5,
}: BoxInputProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { write } = useStdout()

  const handleSelect = (_item): void => {
    // `item` = { label: 'First', value: 'first' }
    write('2133')
  }

  // 过滤建议列表
  const filteredSuggestions = useMemo(() => {
    if (!query.trim() || suggestions.length === 0) {
      return []
    }

    return suggestions
      .filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, maxSuggestions)
      .map(suggestion => ({
        label: suggestion,
        value: suggestion,
      }))
  }, [query, suggestions, maxSuggestions])

  // 处理键盘输入
  useInput((input, key) => {
    if (key.upArrow && filteredSuggestions.length > 0) {
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
      )
    }

    if (key.downArrow && filteredSuggestions.length > 0) {
      setSelectedIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
      )
    }

    if (key.tab && filteredSuggestions.length > 0) {
      // Tab补全
      const selectedSuggestion = filteredSuggestions[selectedIndex]
      if (selectedSuggestion) {
        setQuery(selectedSuggestion.value)
      }
    }
  })

  const handleSubmit = (value: string): void => {
    if (onSubmit) {
      onSubmit(value)
    }
    setQuery('') // 清空输入框
    setSelectedIndex(0)
  }

  const handleChange = (value: string): void => {
    setQuery(value)
    setSelectedIndex(0)
  }

  return (
    <InkBox flexDirection="column" width="100%">
      {/* 输入框 */}
      <InkBox
        borderStyle="single"
        padding={1}
        borderTopColor={LEVELCOLOR_MAP[Level.DEFAULT]}
        borderDimColor={LEVELCOLOR_MAP[Level.DEFAULT]}
        borderBottomDimColor
        borderLeftDimColor
        borderRightDimColor
        borderTopDimColor
        borderLeft={false}
        borderRight={false}
        width="100%"
      >
        <TextInput
          value={query}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder={placeholder}
        />
      </InkBox>

      <SelectInput items={filteredSuggestions} onSelect={handleSelect} />
    </InkBox>
  )
}
