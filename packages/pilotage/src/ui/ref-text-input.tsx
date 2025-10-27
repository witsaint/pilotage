import process from 'node:process'
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

    // 根据终端宽度截断 placeholder，避免换行
    const columns = (process.stdout && (process.stdout as any).columns) || 80
    const maxPlaceholder = Math.max(columns - 2, 10)
    const safePlaceholder = placeholder.length > maxPlaceholder ? `${placeholder.slice(0, maxPlaceholder - 1)}…` : placeholder

    // 如果没有内容，单独渲染光标和 placeholder 在同一行，减少换行概率
    if (value.length === 0) {
      return (
        <Text>
          <Text inverse> </Text>
          <Text color="gray">{safePlaceholder}</Text>
        </Text>
      )
    }

    // 有内容时在内容中渲染光标
    return (
      <Text>
        {value.slice(0, cursor)}
        <Text inverse>{cursor === value.length ? ' ' : value[cursor]}</Text>
        {value.slice(cursor)}
      </Text>
    )
  },
)

RefTextInput.displayName = 'RefTextInput'
