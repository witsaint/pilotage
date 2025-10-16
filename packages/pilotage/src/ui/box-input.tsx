import { Box as InkBox, Text, useInput } from 'ink'
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
  const [showSuggestions, setShowSuggestions] = useState(false)

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
        setQuery(selectedSuggestion)
        setShowSuggestions(false)
      }
    }

    if (key.escape) {
      setShowSuggestions(false)
      setSelectedIndex(0)
    }
  })

  const handleSubmit = (value: string): void => {
    if (onSubmit) {
      onSubmit(value)
    }
    setQuery('') // 清空输入框
    setSelectedIndex(0)
    setShowSuggestions(false)
  }

  const handleChange = (value: string): void => {
    setQuery(value)
    setSelectedIndex(0)
    setShowSuggestions(true)
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

      {/* 建议列表 */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <InkBox
          flexDirection="column"
          borderStyle="single"
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          padding={1}
          width="100%"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <InkBox key={suggestion} paddingX={1}>
              <Text
                color={index === selectedIndex ? 'white' : 'gray'}
                backgroundColor={index === selectedIndex ? 'blue' : undefined}
              >
                {index === selectedIndex ? '▶ ' : '  '}
                {suggestion}
              </Text>
            </InkBox>
          ))}
          <InkBox paddingX={1} marginTop={1}>
            <Text color="gray" dimColor>
              使用 ↑↓ 选择，Tab 补全，Esc 关闭
            </Text>
          </InkBox>
        </InkBox>
      )}
    </InkBox>
  )
}
