import type { Props as ItemProps } from './item.js'
import { isDeepStrictEqual } from 'node:util'
import { Box, useInput } from 'ink'
import React, { type FC, use, useCallback, useEffect, useRef, useState } from 'react'
import arrayToRotated from 'to-rotated'
import { getResponsiveSize } from '@/utils/screen.js'
import { Indicator, type Props as IndicatorProps } from './indicator.js'
import { ItemComponent } from './item.js'

interface Props<V> {
  /**
   * Items to display in a list. Each item must be an object and have `label` and `value` props, it may also optionally have a `key` prop.
   * If no `key` prop is provided, `value` will be used as the item key.
   */
  readonly items?: Array<Item<V>>

  /**
   * Listen to user's input. Useful in case there are multiple input components at the same time and input must be "routed" to a specific component.
   *
   * @default true
   */
  readonly isFocused?: boolean

  /**
   * Index of initially-selected item in `items` array.
   *
   * @default 0
   */
  readonly initialIndex?: number

  /**
   * Number of items to display.
   */
  readonly limit?: number

  /**
   * Custom component to override the default indicator component.
   */
  readonly indicatorComponent?: FC<IndicatorProps>

  /**
   * Custom component to override the default item component.
   */
  readonly itemComponent?: FC<ItemProps>

  /**
   * Function to call when user selects an item. Item object is passed to that function as an argument.
   */
  readonly onSelect?: (item: Item<V>) => void

  /**
   * Function to call when user highlights an item. Item object is passed to that function as an argument.
   */
  readonly onHighlight?: (item: Item<V>) => void
}

export interface Item<V> {
  key?: string
  label: string
  value: V
}

export function SelectInput<V>({
  items = [],
  isFocused = true,
  initialIndex = 0,
  indicatorComponent = Indicator,
  itemComponent = ItemComponent,
  limit: customLimit,
  onSelect,
  onHighlight,
}: Props<V>): React.JSX.Element {
  const hasLimit
		= typeof customLimit === 'number' && items.length > customLimit
  const limit = hasLimit ? Math.min(customLimit, items.length) : items.length
  const lastIndex = limit - 1
  const [rotateIndex, setRotateIndex] = useState(
    initialIndex > lastIndex ? lastIndex - initialIndex : 0,
  )
  const [selectedIndex, setSelectedIndex] = useState(
    initialIndex ? (initialIndex > lastIndex ? lastIndex : initialIndex) : 0,
  )
  const previousItems = useRef<Array<Item<V>>>(items)
  const labelWidth = useRef<number>(undefined)

  useEffect(() => {
    if (
      !isDeepStrictEqual(
        previousItems.current.map(item => item.value),
        items.map(item => item.value),
      )
    ) {
      setRotateIndex(0)
      setSelectedIndex(0)
    }
    // items 中最大的 label 长度
    const maxLabelLength = Math.max(...items.map(item => item.label.length))

    labelWidth.current = Math.min(maxLabelLength, getResponsiveSize().width)

    previousItems.current = items
  }, [items])

  useInput(
    useCallback(
      (input, key) => {
        if (input === 'k' || key.upArrow) {
          const lastIndex = (hasLimit ? limit : items.length) - 1
          const atFirstIndex = selectedIndex === 0
          const nextIndex = hasLimit ? selectedIndex : lastIndex
          const nextRotateIndex = atFirstIndex ? rotateIndex + 1 : rotateIndex
          const nextSelectedIndex = atFirstIndex
            ? nextIndex
            : selectedIndex - 1

          setRotateIndex(nextRotateIndex)
          setSelectedIndex(nextSelectedIndex)

          const slicedItems = hasLimit
            ? arrayToRotated(items, nextRotateIndex).slice(0, limit)
            : items

          if (typeof onHighlight === 'function') {
            onHighlight(slicedItems[nextSelectedIndex]!)
          }
        }

        if (input === 'j' || key.downArrow) {
          const atLastIndex
						= selectedIndex === (hasLimit ? limit : items.length) - 1
          const nextIndex = hasLimit ? selectedIndex : 0
          const nextRotateIndex = atLastIndex ? rotateIndex - 1 : rotateIndex
          const nextSelectedIndex = atLastIndex ? nextIndex : selectedIndex + 1

          setRotateIndex(nextRotateIndex)
          setSelectedIndex(nextSelectedIndex)

          const slicedItems = hasLimit
            ? arrayToRotated(items, nextRotateIndex).slice(0, limit)
            : items

          if (typeof onHighlight === 'function') {
            onHighlight(slicedItems[nextSelectedIndex]!)
          }
        }

        // Enable selection directly from number keys.
        if (/^[1-9]$/.test(input)) {
          const targetIndex = Number.parseInt(input, 10) - 1

          const visibleItems = hasLimit
            ? arrayToRotated(items, rotateIndex).slice(0, limit)
            : items

          if (targetIndex >= 0 && targetIndex < visibleItems.length) {
            const selectedItem = visibleItems[targetIndex]
            if (selectedItem) {
              onSelect?.(selectedItem)
            }
          }
        }

        if (key.return) {
          const slicedItems = hasLimit
            ? arrayToRotated(items, rotateIndex).slice(0, limit)
            : items

          if (typeof onSelect === 'function') {
            onSelect(slicedItems[selectedIndex]!)
          }
        }
      },
      [
        hasLimit,
        limit,
        rotateIndex,
        selectedIndex,
        items,
        onSelect,
        onHighlight,
      ],
    ),
    { isActive: isFocused },
  )

  const slicedItems = hasLimit
    ? arrayToRotated(items, rotateIndex).slice(0, limit)
    : items

  return (
    <Box flexDirection="column">
      {slicedItems.map((item, index) => {
        const isSelected = index === selectedIndex

        return (
          <Box key={item.key ?? item.value}>
            {React.createElement(indicatorComponent, { isSelected })}
            {React.createElement(itemComponent, { ...item, isSelected, labelWidth: labelWidth.current })}
          </Box>
        )
      })}
    </Box>
  )
}

export default SelectInput
