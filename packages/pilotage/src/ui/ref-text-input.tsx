import { Text, useInput } from 'ink'
import React, { useCallback, useEffect, useImperativeHandle, useState } from 'react'

export interface RefTextInputProps {
  value: string
  placeholder?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
}

export interface RefTextInputHandle {
  moveCursorToEnd: () => void
  getValue: () => string
}

export const RefTextInput = React.forwardRef<RefTextInputHandle, RefTextInputProps>(
  ({ value, placeholder = '', onChange, onSubmit }, ref) => {
    const [cursor, setCursor] = useState(value.length)

    // 当外部 value 变化时，如果光标超过长度，自动调整到末尾
    useEffect(() => {
      if (cursor > value.length) {
        setCursor(value.length)
      }
    }, [value, cursor])

    useImperativeHandle(
      ref,
      () => ({
        moveCursorToEnd: () => setCursor(value.length),
        getValue: () => value,
      }),
      [value],
    )

    const commitChange = useCallback(
      (next: string) => {
        if (onChange)
          onChange(next)
      },
      [onChange],
    )

    useInput((input, key) => {
      if (key.leftArrow) {
        setCursor(c => (c > 0 ? c - 1 : 0))
        return
      }
      if (key.rightArrow) {
        setCursor(c => (c < value.length ? c + 1 : value.length))
        return
      }
      if (key.return) {
        if (onSubmit)
          onSubmit(value)
        return
      }
      if (key.backspace || key.delete) {
        if (cursor === 0)
          return
        const before = value.slice(0, cursor - 1)
        const after = value.slice(cursor)
        const next = before + after
        commitChange(next)
        setCursor(c => (c > 0 ? c - 1 : 0))
        return
      }
      // 普通字符插入
      if (input) {
        const before = value.slice(0, cursor)
        const after = value.slice(cursor)
        const next = before + input + after
        commitChange(next)
        setCursor(c => c + input.length)
      }
    })

    // 渲染：显示占位符或内容，插入光标
    const renderValue = value.length === 0
      ? (
          <Text color="gray">{placeholder}</Text>
        )
      : (
          <Text>{value}</Text>
        )

    return (
      <Text>
        {value.slice(0, cursor)}
        <Text inverse>{cursor === value.length ? ' ' : value[cursor]}</Text>
        {value.slice(cursor)}
        {value.length === 0 && renderValue}
      </Text>
    )
  },
)

RefTextInput.displayName = 'RefTextInput'
