import { Box as InkBox, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useMemo, useState } from 'react'
import { Level, LEVELCOLOR_MAP } from '@/config/level'
import { RefTextInput, type RefTextInputHandle } from './ref-text-input'

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
  // 自定义输入框 ref 控制光标
  const refInput = React.useRef<RefTextInputHandle | null>(null)

  const handleSelect = (): void => {
    // write(query)
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
      // Tab补全（Ink 在 Node 终端中，受控 value 更新后光标自动在末尾）
      const selectedSuggestion = filteredSuggestions[selectedIndex]
      if (selectedSuggestion) {
        setQuery(selectedSuggestion.value)
        // 使用 ref 主动将光标移动到末尾
        setTimeout(() => {
          refInput.current?.moveCursorToEnd()
        }, 0)
        // 重置选中索引，因为补全后建议列表会更新
        setSelectedIndex(0)
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
        gap={1}
      >
        <Text>❯</Text>
        {/* 使用包裹层 key 触发重挂载，TextInput 不接受自定义 key prop 类型声明 */}
        <RefTextInput
          ref={refInput}
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
